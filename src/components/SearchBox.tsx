"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { usePlayer, type PlayerTrack } from "@/lib/player/PlayerContext";
import { Icon, PlayIcon, SearchIcon, SpinnerIcon } from "@/components/icons";
import { VinylCover } from "@/components/VinylCover";
import { ExplicitBadge } from "@/components/ExplicitBadge";
import { LikeCount } from "@/components/LikeCount";
import type { Track } from "@/components/TrackGrid";
import type { Album } from "@/components/AlbumGrid";
import type { Artist } from "@/components/ArtistGrid";
import { albumTypeLabel } from "@/lib/albumType";
import { splitMatch } from "@/lib/searchMatch";
import { artistLine } from "@/lib/trackMeta";
import { toProvenance } from "@/lib/provenance";
import { MIN_QUERY_LENGTH, type SearchResponse } from "@/lib/search";

const DEBOUNCE_MS = 250;
const SEARCH_CONTEXT = { context: "search" } as const;

// Ce qu'on peut choisir dans la liste, dans l'ordre d'affichage (c'est aussi l'ordre
// des flèches du clavier). « all » ouvre la page de recherche complète.
type Item =
  | { kind: "track"; key: string; track: Track; player: PlayerTrack; queue: PlayerTrack[] }
  | { kind: "album"; key: string; album: Album }
  | { kind: "artist"; key: string; artist: Artist }
  | { kind: "all"; key: string };

function toPlayerTrack(track: Track): PlayerTrack {
  return {
    id: track.id,
    title: track.title,
    artistName: artistLine(track.artists?.name, track.credits),
    coverUrl: track.albums?.cover_url ?? null,
    provenance: toProvenance(track.provenance),
    explicit: track.explicit === true,
  };
}

// Le texte avec la partie tapée par l'utilisateur en gras (<mark>).
function Marked({ text, query }: { text: string; query: string }) {
  return (
    <>
      {splitMatch(text, query).map((part, i) =>
        part.match ? (
          <mark key={i} className="search__mark">
            {part.text}
          </mark>
        ) : (
          <span key={i}>{part.text}</span>
        )
      )}
    </>
  );
}

// Zone de recherche au centre de la barre du haut. On tape, les résultats (morceaux,
// albums, artistes) s'affichent en direct sous le champ ; flèches + Entrée au clavier,
// « / » pour y aller de n'importe où, Échap pour fermer. Entrée sans rien de choisi
// ouvre la page de recherche complète. Un morceau choisi se lance (les morceaux
// trouvés forment la file d'attente) ; un album ou un artiste ouvre sa page.
export function SearchBox() {
  const router = useRouter();
  const pathname = usePathname();
  const { play } = usePlayer();
  const uid = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState("");
  // La liste est « ouverte sur cette page » : un changement de page la referme toute
  // seule, sans effet qui remette un state à zéro.
  const [openPath, setOpenPath] = useState<string | null>(null);
  const [active, setActive] = useState(-1);
  // Dernier résultat reçu et pour quelle recherche. `data` à null = la requête a échoué.
  const [settled, setSettled] = useState<{ q: string; data: SearchResponse | null } | null>(null);

  const trimmed = query.trim();
  const searching = trimmed.length >= MIN_QUERY_LENGTH;
  const open = searching && openPath === pathname;
  // Les résultats de la recherche précédente restent affichés (atténués) pendant que
  // les nouveaux arrivent : la liste ne clignote pas à chaque lettre.
  const loading = searching && settled?.q !== trimmed;
  const data = settled?.data ?? null;
  const failed = searching && !loading && settled !== null && settled.data === null;

  useEffect(() => {
    if (trimmed.length < MIN_QUERY_LENGTH) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      let received: SearchResponse | null = null;
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, { signal: controller.signal });
        if (res.ok) received = (await res.json()) as SearchResponse;
      } catch {
        // annulée (une autre lettre est arrivée) ou réseau coupé : voir ci-dessous
      }
      if (controller.signal.aborted) return;
      setSettled({ q: trimmed, data: received });
      setActive(-1);
    }, DEBOUNCE_MS);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [trimmed]);

  const items = useMemo<Item[]>(() => {
    if (!searching || !data) return [];
    const queue = data.tracks.map(toPlayerTrack);
    const list: Item[] = [
      ...data.tracks.map((track, i): Item => ({ kind: "track", key: `t-${track.id}`, track, player: queue[i], queue })),
      ...data.albums.map((album): Item => ({ kind: "album", key: `a-${album.id}`, album })),
      ...data.artists.map((artist): Item => ({ kind: "artist", key: `r-${artist.id}`, artist })),
    ];
    if (list.length > 0) list.push({ kind: "all", key: "all" });
    return list;
  }, [searching, data]);

  const optionId = (index: number) => `${uid}-opt-${index}`;
  const resultCount = items.filter((item) => item.kind !== "all").length;

  // Garde l'option choisie au clavier visible dans la liste qui défile.
  useEffect(() => {
    if (active >= 0) document.getElementById(`${uid}-opt-${active}`)?.scrollIntoView({ block: "nearest" });
  }, [active, uid]);

  // « / » met le focus dans la recherche, sauf quand on tape déjà ailleurs ou
  // qu'une boîte de dialogue (la platine) est ouverte.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) return;
      if (document.querySelector('[aria-modal="true"]')) return;
      e.preventDefault();
      inputRef.current?.focus();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  function close() {
    setOpenPath(null);
  }

  // Un résultat est choisi : la liste se ferme et le champ se vide.
  function finish() {
    close();
    setQuery("");
    setSettled(null);
    setActive(-1);
    inputRef.current?.blur();
  }

  function activate(item: Item) {
    if (item.kind === "track") {
      play(item.player, SEARCH_CONTEXT, item.queue);
      finish();
    } else if (item.kind === "all") {
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
      close();
      inputRef.current?.blur();
    }
    // album et artiste : le <Link> de la ligne navigue, onClick appelle finish()
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    switch (e.key) {
      case "ArrowDown":
      case "ArrowUp": {
        if (!searching) return;
        e.preventDefault();
        setOpenPath(pathname);
        if (items.length === 0) return;
        const step = e.key === "ArrowDown" ? 1 : -1;
        setActive((current) => (current < 0 ? (step === 1 ? 0 : items.length - 1) : (current + step + items.length) % items.length));
        return;
      }
      case "Enter": {
        if (!searching) return;
        e.preventDefault();
        const item = items[active];
        if (item?.kind === "album") {
          router.push(`/albums/${item.album.id}`);
          finish();
        } else if (item?.kind === "artist") {
          router.push(`/artists/${item.artist.slug}`);
          finish();
        } else if (item) {
          activate(item);
        } else {
          // Rien de choisi : la page de recherche complète.
          router.push(`/search?q=${encodeURIComponent(trimmed)}`);
          close();
          inputRef.current?.blur();
        }
        return;
      }
      case "Escape": {
        if (open) close();
        else if (query) setQuery("");
        else inputRef.current?.blur();
        return;
      }
    }
  }

  function rowProps(index: number) {
    return {
      id: optionId(index),
      role: "option" as const,
      "aria-selected": index === active,
      tabIndex: -1,
      className: "search__row",
      "data-active": index === active ? "" : undefined,
      onMouseMove: () => setActive(index),
    };
  }

  // Une famille de résultats ; la position d'une ligne est son rang dans `items`
  // (c'est elle que suivent les flèches du clavier).
  const section = (kind: Item["kind"], title: string) => {
    const group = items.filter((item) => item.kind === kind);
    if (group.length === 0) return null;
    const headingId = `${uid}-${kind}`;
    return (
      <div role="group" aria-labelledby={headingId} className="search__group">
        <p id={headingId} className="search__heading">
          {title}
        </p>
        {group.map((item) => {
          const position = items.indexOf(item);
          if (item.kind === "track") {
            return (
              <button key={item.key} type="button" {...rowProps(position)} onClick={() => activate(item)}>
                <span className="search__thumb">
                  <VinylCover src={item.player.coverUrl} small />
                </span>
                <span className="search__text">
                  <span className="search__name">
                    <Marked text={item.track.title} query={trimmed} />
                    <ExplicitBadge explicit={item.track.explicit} />
                  </span>
                  <span className="search__sub">
                    {item.player.artistName}
                    <LikeCount count={item.track.likes_count} />
                  </span>
                </span>
                <span className="search__play" aria-hidden="true">
                  <PlayIcon size={14} />
                </span>
              </button>
            );
          }
          if (item.kind === "album") {
            const year = item.album.release_date ? new Date(item.album.release_date).getUTCFullYear() : null;
            const sub = [item.album.type ? albumTypeLabel(item.album.type) : null, item.album.artists?.name, year]
              .filter(Boolean)
              .join(" · ");
            return (
              <Link key={item.key} href={`/albums/${item.album.id}`} {...rowProps(position)} onClick={finish}>
                <span className="search__thumb">
                  <VinylCover src={item.album.cover_url} small />
                </span>
                <span className="search__text">
                  <span className="search__name">
                    <Marked text={item.album.title} query={trimmed} />
                    <ExplicitBadge explicit={item.album.explicit} />
                  </span>
                  <span className="search__sub">{sub}</span>
                </span>
              </Link>
            );
          }
          if (item.kind === "artist") {
            return (
              <Link key={item.key} href={`/artists/${item.artist.slug}`} {...rowProps(position)} onClick={finish}>
                <span
                  className="search__thumb search__thumb--round"
                  style={{
                    background: item.artist.avatar_url
                      ? `url(${item.artist.avatar_url}) center/cover`
                      : "var(--vynl-pochette-vide)",
                  }}
                />
                <span className="search__text">
                  <span className="search__name">
                    <Marked text={item.artist.name} query={trimmed} />
                    {item.artist.verified && (
                      <span title="Verified" style={{ color: "var(--vynl-reflet)" }}>
                        {" "}
                        ✓
                      </span>
                    )}
                  </span>
                  <span className="search__sub">Artist</span>
                </span>
              </Link>
            );
          }
          return null;
        })}
      </div>
    );
  };

  const allItem = items.find((item) => item.kind === "all");
  const status = loading
    ? "Searching…"
    : failed
      ? "Search is unavailable."
      : data
        ? resultCount === 0
          ? "No results."
          : `${resultCount} ${resultCount === 1 ? "result" : "results"}.`
        : "";

  return (
    <div
      ref={wrapRef}
      className="search"
      onBlur={(e) => {
        // Le focus sort de toute la zone (champ + liste) : on ferme.
        if (!wrapRef.current?.contains(e.relatedTarget as Node | null)) close();
      }}
    >
      <div className="search__field">
        <SearchIcon size={18} />
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          className="search__input"
          placeholder="Search tracks, albums, artists"
          aria-label="Search tracks, albums and artists"
          aria-expanded={open}
          aria-controls={`${uid}-list`}
          aria-autocomplete="list"
          aria-activedescendant={open && active >= 0 ? optionId(active) : undefined}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpenPath(pathname);
          }}
          onFocus={() => setOpenPath(pathname)}
          onKeyDown={onKeyDown}
        />
        {loading ? (
          <span className="search__aside" aria-hidden="true">
            <SpinnerIcon size={16} />
          </span>
        ) : query ? (
          <button
            type="button"
            className="search__clear icon-btn"
            aria-label="Clear search"
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
          >
            <Icon name="close" size={14} />
          </button>
        ) : (
          <kbd className="search__aside search__kbd" aria-hidden="true">
            /
          </kbd>
        )}
      </div>

      <p className="sr-only" role="status">
        {open ? status : ""}
      </p>

      {open && (
        // Un clic dans la liste ne doit pas faire perdre le focus au champ (sinon la
        // liste se fermerait avant que le clic n'arrive, notamment sur Safari).
        <div className="search__panel" onMouseDown={(e) => e.preventDefault()}>
          {failed ? (
            <p className="search__empty" role="alert">
              Search isn&apos;t available right now. Try again in a moment.
            </p>
          ) : !data ? (
            <div className="search__skeleton" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
          ) : resultCount === 0 && !loading ? (
            <p className="search__empty">
              No results for &ldquo;{trimmed}&rdquo;.
              {data.failed.length > 0 && " Some results couldn\u2019t be loaded."}
            </p>
          ) : (
            <div id={`${uid}-list`} role="listbox" aria-label="Search results" aria-busy={loading} className="search__list" data-loading={loading || undefined}>
              {section("track", "Tracks")}
              {section("album", "Albums")}
              {section("artist", "Artists")}
              {allItem && (
                <Link
                  href={`/search?q=${encodeURIComponent(trimmed)}`}
                  {...rowProps(items.length - 1)}
                  className="search__row search__all"
                  onClick={() => {
                    close();
                    inputRef.current?.blur();
                  }}
                >
                  See all results for &ldquo;{trimmed}&rdquo;
                </Link>
              )}
              {data.failed.length > 0 && <p className="search__note">Some results couldn&apos;t be loaded.</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
