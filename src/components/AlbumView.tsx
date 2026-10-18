import Link from "next/link";
import { TrackPlayButton } from "@/components/TrackPlayButton";
import { formatDuration } from "@/lib/formatDuration";
import { VinylCover } from "@/components/VinylCover";
import { SaveButton } from "@/components/SaveButton";
import { PlayAllButton } from "@/components/PlayAllButton";
import { TrackIndex } from "@/components/TrackIndex";
import { TrackActions } from "@/components/TrackActions";
import { ProvenanceBadge } from "@/components/ProvenanceBadge";
import { ExplicitBadge } from "@/components/ExplicitBadge";
import { toProvenance, type Provenance } from "@/lib/provenance";
import { CreditLine } from "@/components/CreditLine";
import { GenreChips, TagChips } from "@/components/GenreChips";
import { artistLine, topTags, type GenreRef, type TrackMeta } from "@/lib/trackMeta";
import type { PlayerTrack } from "@/lib/player/PlayerContext";

export interface AlbumTrack extends TrackMeta {
  id: string;
  title: string;
  duration_seconds: number | null;
  track_number: number | null;
  provenance?: Provenance | null;
  explicit?: boolean;
  likes_count?: number;
}

export interface AlbumDetail {
  id: string;
  title: string;
  cover_url: string | null;
  release_date: string | null;
  type: string;
  artists: { name: string; slug: string } | null;
  /** « ai » si tous les morceaux sont déclarés 100 % IA, « hybrid » sinon. */
  provenance?: Provenance | null;
  /** Au moins un morceau est explicite (badge « E » à côté du titre). */
  explicit?: boolean;
  /** Les genres qui reviennent le plus parmi les morceaux. */
  genres?: GenreRef[];
  label?: string | null;
  copyright_line?: string | null;
  description?: string | null;
  tracks: AlbumTrack[];
}

// La page d'un album, sans accès aux données : la page les charge et les passe ici.
export function AlbumView({
  album,
  saved,
  savedTrackIds,
}: {
  album: AlbumDetail;
  saved: boolean;
  savedTrackIds: Set<string>;
}) {
  const releaseYear = album.release_date ? new Date(album.release_date).getUTCFullYear() : null;
  const releaseDate = album.release_date
    ? new Date(album.release_date).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      })
    : null;

  // Durée totale : seulement si on connaît celle de chaque morceau, sinon on
  // afficherait un total faux.
  const durations = album.tracks.map((t) => t.duration_seconds);
  const totalSeconds = durations.every((d): d is number => d !== null)
    ? durations.reduce((sum, d) => sum + d, 0)
    : null;
  const queue: PlayerTrack[] = album.tracks.map((t) => ({
    id: t.id,
    title: t.title,
    artistName: artistLine(album.artists?.name, t.credits),
    coverUrl: album.cover_url,
    provenance: toProvenance(t.provenance),
    explicit: t.explicit === true,
  }));
  const albumProvenance = toProvenance(album.provenance);
  const tags = topTags(album.tracks);
  const footer = [album.label, album.copyright_line].filter(Boolean).join(" · ");
  const summary = [
    releaseDate,
    `${album.tracks.length} ${album.tracks.length === 1 ? "track" : "tracks"}`,
    totalSeconds ? `${Math.max(1, Math.round(totalSeconds / 60))} min` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div style={{ padding: "var(--space-lg)", maxWidth: 800 }}>
      <div style={{ display: "flex", gap: "var(--space-lg)", marginBottom: "var(--space-xl)", flexWrap: "wrap" }}>
        <VinylCover src={album.cover_url} size={240} label={`Cover of ${album.title}`} />
        <div style={{ alignSelf: "flex-end", minWidth: 0, flex: "1 1 260px" }}>
          <p
            style={{
              textTransform: "uppercase",
              fontSize: "0.75rem",
              letterSpacing: "0.05em",
              color: "var(--vynl-texte-2)",
              marginBottom: "0.35rem",
            }}
          >
            {album.type}
          </p>
          <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem", overflowWrap: "anywhere" }}>
            {album.title}
            <ExplicitBadge explicit={album.explicit} className="explicit-badge--lg" />
          </h1>
          {album.artists && (
            <p style={{ color: "var(--vynl-texte-2)" }}>
              <Link href={`/artists/${album.artists.slug}`} className="text-link">
                {album.artists.name}
              </Link>
              {releaseYear && ` · ${releaseYear}`}
            </p>
          )}
          <ProvenanceBadge provenance={albumProvenance} size="md" className="detail-badge" />
          <p style={{ color: "var(--vynl-texte-2)", fontSize: "0.875rem", marginTop: "0.25rem" }}>{summary}</p>
          {(album.genres?.length ?? 0) > 0 || tags.length > 0 ? (
            <div style={{ marginTop: "var(--space-sm)", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <GenreChips genres={album.genres ?? []} />
              <TagChips tags={tags} />
            </div>
          ) : null}
          <div style={{ marginTop: "var(--space-sm)", display: "flex", alignItems: "center", gap: "var(--space-md)" }}>
            <PlayAllButton tracks={queue} source={{ context: "album", id: album.id }} />
            <SaveButton itemType="album" itemId={album.id} initialSaved={saved} size={28} />
          </div>
        </div>
      </div>

      {album.description && (
        <p style={{ color: "var(--vynl-texte-2)", maxWidth: "65ch", marginBottom: "var(--space-lg)", whiteSpace: "pre-line" }}>
          {album.description}
        </p>
      )}

      <section>
        {album.tracks.length === 0 ? (
          <p style={{ color: "var(--vynl-texte-2)" }}>No tracks published yet.</p>
        ) : (
          <ol style={{ listStyle: "none" }}>
            {album.tracks.map((track, index) => (
              <li
                key={track.id}
                className="list-row track-row"
              >
                <TrackIndex id={track.id} n={track.track_number ?? index + 1} />
                <TrackPlayButton
                  track={queue[index]}
                  size={28}
                  source={{ context: "album", id: album.id }}
                  queue={queue}
                />
                <span className="row-title">
                  <span>
                    {track.title}
                    <ExplicitBadge explicit={track.explicit} />
                  </span>
                  {/* Le badge de l'album vaut pour ses morceaux ; une ligne n'en a un que si elle diffère
                      (un album « AI-assisted » avec un morceau « AI-generated »). Sous le titre : à côté,
                      il ferait déborder la ligne sur un téléphone. */}
                  {toProvenance(track.provenance) !== albumProvenance && (
                    <ProvenanceBadge provenance={track.provenance} />
                  )}
                  <CreditLine credits={track.credits} />
                </span>
                <span style={{ color: "var(--vynl-texte-3)", fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>
                  {formatDuration(track.duration_seconds)}
                </span>
                <TrackActions
                  track={queue[index]}
                  source={{ context: "album", id: album.id }}
                  saved={savedTrackIds.has(track.id)}
                  likesCount={track.likes_count ?? null}
                />
              </li>
            ))}
          </ol>
        )}
      </section>

      {footer && <p style={{ color: "var(--vynl-texte-3)", fontSize: "0.8125rem", marginTop: "var(--space-lg)" }}>{footer}</p>}
    </div>
  );
}
