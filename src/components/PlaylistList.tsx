import Link from "next/link";

export interface PlaylistSummary {
  id: string;
  title: string;
  cover_url: string | null;
  /** Absent selon l'endpoint d'origine — ne rendre le badge que si explicitement false. */
  is_public?: boolean;
}

export function PlaylistList({ playlists, emptyMessage }: { playlists: PlaylistSummary[]; emptyMessage: string }) {
  if (playlists.length === 0) {
    return <p style={{ color: "var(--vynl-texte-2)" }}>{emptyMessage}</p>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      {playlists.map((playlist) => (
        <Link
          key={playlist.id}
          href={`/playlists/${playlist.id}`}
          className="list-row"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-md)",
            padding: "0.6rem",
            borderRadius: "var(--vynl-rayon-carte)",
            border: "1px solid var(--vynl-bordure)",
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              flex: "none",
              borderRadius: "var(--radius-sm)",
              background: playlist.cover_url
                ? `url(${playlist.cover_url}) center/cover`
                : "var(--vynl-pochette-vide)",
            }}
          />
          <span style={{ fontWeight: 600, flex: 1 }}>{playlist.title}</span>
          {playlist.is_public === false && (
            <span className="badge" style={{ color: "var(--vynl-texte-2)" }}>
              Private
            </span>
          )}
        </Link>
      ))}
    </div>
  );
}
