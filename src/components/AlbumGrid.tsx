import Link from "next/link";

export interface Album {
  id: string;
  title: string;
  cover_url: string | null;
  artists: { name: string; slug: string } | null;
}

export function AlbumGrid({ albums, emptyMessage }: { albums: Album[]; emptyMessage: string }) {
  if (albums.length === 0) {
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
      {albums.map((album) => (
        <Link key={album.id} href={`/albums/${album.id}`} className="hover-card">
          <div
            style={{
              width: "100%",
              aspectRatio: "1",
              borderRadius: "var(--radius-md)",
              marginBottom: "0.65rem",
              background: album.cover_url ? `url(${album.cover_url}) center/cover` : "var(--vynl-pochette-vide)",
            }}
          />
          <p style={{ fontWeight: 600, fontSize: "0.9375rem" }}>{album.title}</p>
          {album.artists && (
            <p style={{ color: "var(--vynl-texte-2)", fontSize: "0.8125rem" }}>{album.artists.name}</p>
          )}
        </Link>
      ))}
    </div>
  );
}
