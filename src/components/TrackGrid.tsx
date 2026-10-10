import { SaveButton } from "@/components/SaveButton";
import { TrackPlayButton } from "@/components/TrackPlayButton";
import type { PlaySource } from "@/lib/player/types";

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

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
        gap: "var(--space-md)",
      }}
    >
      {tracks.map((track) => (
        <article key={track.id} className="hover-card">
          <div
            style={{
              position: "relative",
              width: "100%",
              aspectRatio: "1",
              borderRadius: "var(--radius-md)",
              marginBottom: "0.65rem",
              background: track.albums?.cover_url
                ? `url(${track.albums.cover_url}) center/cover`
                : "var(--vynl-pochette-vide)",
            }}
          >
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
                track={{
                  id: track.id,
                  title: track.title,
                  artistName: track.artists?.name ?? "Unknown artist",
                  coverUrl: track.albums?.cover_url ?? null,
                }}
                size={44}
                source={source}
              />
            </div>
            {savedTrackIds && (
              <div
                style={{
                  position: "absolute",
                  top: "0.5rem",
                  right: "0.5rem",
                  background: "var(--vynl-voile)",
                  borderRadius: "50%",
                  width: 28,
                  height: 28,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <SaveButton itemType="track" itemId={track.id} initialSaved={savedTrackIds.has(track.id)} />
              </div>
            )}
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
