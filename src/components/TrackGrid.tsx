import { SaveButton } from "@/components/SaveButton";
import { TrackPlayButton } from "@/components/TrackPlayButton";
import { TrackMenu } from "@/components/TrackMenu";
import type { PlaySource } from "@/lib/player/types";
import { VinylCover } from "@/components/VinylCover";
import type { PlayerTrack } from "@/lib/player/PlayerContext";

export interface Track {
  id: string;
  title: string;
  duration_seconds: number | null;
  artists: { name: string } | null;
  albums: { cover_url: string | null } | null;
}

export function TrackGrid({
  tracks,
  emptyMessage,
  savedTrackIds,
  source,
}: {
  tracks: Track[];
  emptyMessage: string;
  /** Si fourni, affiche le bouton Sauvegarder sur chaque carte. */
  savedTrackIds?: Set<string>;
  /** D'où viennent les lectures lancées depuis cette grille : enregistré avec chaque écoute. */
  source?: PlaySource;
}) {
  if (tracks.length === 0) {
    return <p style={{ color: "var(--vynl-texte-2)" }}>{emptyMessage}</p>;
  }

  // La grille entière est la file d'attente : une fois un morceau lancé, les
  // suivants s'enchaînent dans l'ordre d'affichage.
  const queue: PlayerTrack[] = tracks.map((track) => ({
    id: track.id,
    title: track.title,
    artistName: track.artists?.name ?? "Unknown artist",
    coverUrl: track.albums?.cover_url ?? null,
  }));

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
        gap: "var(--space-md)",
      }}
    >
      {tracks.map((track, index) => (
        <article key={track.id} className="hover-card" data-reveal suppressHydrationWarning>
          <div data-tilt suppressHydrationWarning style={{ position: "relative", width: "100%", marginBottom: "0.65rem" }}>
            <VinylCover src={track.albums?.cover_url ?? null} />
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <TrackPlayButton
                track={queue[index]}
                size={44}
                source={source}
                queue={queue}
              />
            </div>
            <div className="card-actions">
              {savedTrackIds && (
                <SaveButton itemType="track" itemId={track.id} initialSaved={savedTrackIds.has(track.id)} />
              )}
              <TrackMenu track={queue[index]} source={source} />
            </div>
          </div>
          <p style={{ fontWeight: 600, fontSize: "0.9375rem" }}>{track.title}</p>
          <p style={{ color: "var(--vynl-texte-2)", fontSize: "0.8125rem" }}>
            {track.artists?.name ?? "Unknown artist"}
          </p>
        </article>
      ))}
    </div>
  );
}
