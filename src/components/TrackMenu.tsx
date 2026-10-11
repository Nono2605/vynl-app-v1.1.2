"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { usePlayer, type PlayerTrack } from "@/lib/player/PlayerContext";
import type { PlaySource } from "@/lib/player/types";
import { addToPlaylist, createPlaylistAndAdd, listMyPlaylists } from "@/app/actions/trackMenu";
import {
  MAX_PLAYLIST_TITLE,
  type AddResult,
  type CreateResult,
  type MenuPlaylist,
  type PlaylistsResult,
} from "@/lib/trackMenu";
import { ChevronLeftIcon, LockIcon, MoreIcon, PlusIcon, QueueIcon, SpinnerIcon } from "@/components/icons";
import { useToast } from "@/components/Toast";

const MENU_WIDTH = 264;
const MARGIN = 8;
const GAP = 6;
// Hauteur au-delà de laquelle le menu s'ouvre vers le haut (le plus haut est la liste des playlists).
const ROOM_BELOW = 340;

/** Les trois appels serveur du menu ; remplaçables pour tester l'interface sans compte. */
export interface TrackMenuActions {
  listMyPlaylists: () => Promise<PlaylistsResult>;
  addToPlaylist: (playlistId: string, trackId: string) => Promise<AddResult>;
  createPlaylistAndAdd: (title: string, trackId: string) => Promise<CreateResult>;
}

const serverActions: TrackMenuActions = { listMyPlaylists, addToPlaylist, createPlaylistAndAdd };

type View = "menu" | "playlists";
type Playlists = { status: "loading" } | { status: "error"; error: string } | { status: "ready"; items: MenuPlaylist[] };

// Le menu « ⋯ » d'un morceau : jouer ensuite, ajouter à la file d'attente, ajouter à une playlist
// (ou en créer une) sans quitter la page. Le menu est rendu dans <body> (portail) pour ne
// jamais être rogné ni incliné par la carte ou la ligne qui le contient.
export function TrackMenu({
  track,
  source,
  actions = serverActions,
}: {
  track: PlayerTrack;
  source?: PlaySource;
  actions?: TrackMenuActions;
}) {
  const { track: current, enqueue } = usePlayer();
  const toast = useToast();
  const pathname = usePathname();
  const menuId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Le menu est « ouvert sur cette page » : il se ferme tout seul quand la page change.
  const [openPath, setOpenPath] = useState<string | null>(null);
  const [place, setPlace] = useState<{ left: number; top?: number; bottom?: number }>({ left: 0 });
  const [view, setView] = useState<View>("menu");
  const [playlists, setPlaylists] = useState<Playlists>({ status: "loading" });
  const [busy, setBusy] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");

  const open = openPath === pathname;

  function close(refocus = false) {
    setOpenPath(null);
    if (refocus) buttonRef.current?.focus();
  }

  function toggle() {
    if (open) return close();
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    const left = Math.min(Math.max(MARGIN, rect.right - MENU_WIDTH), window.innerWidth - MENU_WIDTH - MARGIN);
    const roomBelow = window.innerHeight - rect.bottom;
    setPlace(
      roomBelow >= ROOM_BELOW || roomBelow >= rect.top
        ? { left, top: rect.bottom + GAP }
        : { left, bottom: window.innerHeight - rect.top + GAP }
    );
    setView("menu");
    setProblem(null);
    setCreating(false);
    setTitle("");
    setOpenPath(pathname);
  }

  // Fermeture : clic ailleurs, défilement de la page, redimensionnement. (Un défilement DANS
  // le menu, quand la liste des playlists est longue, ne le ferme pas.)
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (!menuRef.current?.contains(target) && !buttonRef.current?.contains(target)) setOpenPath(null);
    };
    const onScroll = (e: Event) => {
      if (!menuRef.current?.contains(e.target as Node)) setOpenPath(null);
    };
    const onResize = () => setOpenPath(null);
    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  // Le focus entre dans le menu à l'ouverture et à chaque changement de vue.
  useEffect(() => {
    if (!open) return;
    menuRef.current?.querySelector<HTMLElement>('[role="menuitem"], input')?.focus();
  }, [open, view, playlists.status]);

  async function showPlaylists() {
    setView("playlists");
    setProblem(null);
    setPlaylists({ status: "loading" });
    const result = await actions.listMyPlaylists();
    setPlaylists(result.ok ? { status: "ready", items: result.playlists } : { status: "error", error: result.error });
  }

  function queueTrack(mode: "next" | "last") {
    // Rien ne joue : « ajouter » lance le morceau (voir enqueue dans PlayerContext).
    const idle = current === null;
    enqueue(track, mode, source);
    toast(idle ? `Playing ${track.title}` : mode === "next" ? `Playing next: ${track.title}` : `Added to queue: ${track.title}`);
    close(true);
  }

  async function addTo(playlist: MenuPlaylist) {
    setBusy(playlist.id);
    setProblem(null);
    const result = await actions.addToPlaylist(playlist.id, track.id);
    setBusy(null);
    if (!result.ok) return setProblem(result.error);
    toast(result.added ? `Added to “${playlist.title}”` : `Already in “${playlist.title}”`);
    close(true);
  }

  async function createAndAdd(e: React.FormEvent) {
    e.preventDefault();
    setBusy("new");
    setProblem(null);
    const result = await actions.createPlaylistAndAdd(title, track.id);
    setBusy(null);
    if (!result.ok) {
      setProblem(result.error);
      // La playlist a bien été créée : elle apparaît dans la liste au prochain affichage.
      if (result.created) setCreating(false);
      return;
    }
    toast(`Added to “${result.playlist.title}”`);
    close(true);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      e.stopPropagation();
      return close(true);
    }
    if (e.key === "Tab") return setOpenPath(null);
    const keys = ["ArrowDown", "ArrowUp", "Home", "End"];
    if (!keys.includes(e.key)) return;
    const items = Array.from(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not(:disabled)') ?? []);
    if (items.length === 0) return;
    e.preventDefault();
    const at = items.indexOf(document.activeElement as HTMLElement);
    const next =
      e.key === "Home" ? 0 : e.key === "End" ? items.length - 1 : (at + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
    items[next].focus();
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className="track-menu-btn icon-btn"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={`Options for ${track.title}`}
        onClick={toggle}
      >
        <MoreIcon size={20} />
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            id={menuId}
            role="menu"
            aria-label={view === "menu" ? `Options for ${track.title}` : "Add to playlist"}
            className="track-menu"
            style={{ left: place.left, top: place.top, bottom: place.bottom, width: MENU_WIDTH }}
            onKeyDown={onKeyDown}
          >
            {view === "menu" ? (
              <>
                <button type="button" role="menuitem" className="track-menu__item" onClick={() => queueTrack("next")}>
                  <QueueIcon size={18} />
                  Play next
                </button>
                <button type="button" role="menuitem" className="track-menu__item" onClick={() => queueTrack("last")}>
                  <QueueIcon size={18} />
                  Add to queue
                </button>
                <button type="button" role="menuitem" className="track-menu__item" onClick={showPlaylists}>
                  <PlusIcon size={18} />
                  Add to playlist
                </button>
              </>
            ) : (
              <>
                <button type="button" role="menuitem" className="track-menu__item track-menu__back" onClick={() => setView("menu")}>
                  <ChevronLeftIcon size={18} />
                  Add to playlist
                </button>

                {playlists.status === "loading" && (
                  <p className="track-menu__note" role="status">
                    <SpinnerIcon size={14} /> Loading your playlists
                  </p>
                )}
                {playlists.status === "error" && (
                  <p className="track-menu__note track-menu__note--error" role="alert">
                    {playlists.error}
                  </p>
                )}
                {playlists.status === "ready" && playlists.items.length === 0 && !creating && (
                  <p className="track-menu__note">You don&apos;t have any playlist yet.</p>
                )}
                {playlists.status === "ready" &&
                  playlists.items.map((playlist) => (
                    <button
                      key={playlist.id}
                      type="button"
                      role="menuitem"
                      className="track-menu__item"
                      disabled={busy !== null}
                      onClick={() => addTo(playlist)}
                    >
                      <span className="track-menu__name">{playlist.title}</span>
                      {busy === playlist.id ? <SpinnerIcon size={14} /> : !playlist.is_public ? <LockIcon size={14} /> : null}
                    </button>
                  ))}

                {playlists.status !== "loading" &&
                  (creating ? (
                    <form className="track-menu__create" onSubmit={createAndAdd}>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="Playlist name"
                        aria-label="New playlist name"
                        value={title}
                        maxLength={MAX_PLAYLIST_TITLE}
                        onChange={(e) => setTitle(e.target.value)}
                        disabled={busy !== null}
                        autoFocus
                      />
                      <button type="submit" className="btn btn-primary btn-sm" disabled={busy !== null || title.trim() === ""}>
                        {busy === "new" ? <SpinnerIcon size={14} /> : "Create"}
                      </button>
                    </form>
                  ) : (
                    <button
                      type="button"
                      role="menuitem"
                      className="track-menu__item track-menu__new"
                      disabled={busy !== null}
                      onClick={() => setCreating(true)}
                    >
                      <PlusIcon size={18} />
                      New playlist
                    </button>
                  ))}

                {problem && (
                  <p className="track-menu__note track-menu__note--error" role="alert">
                    {problem}
                  </p>
                )}
              </>
            )}
          </div>,
          document.body
        )}
    </>
  );
}
