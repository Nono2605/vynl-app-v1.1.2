import Link from "next/link";
import { VinylCover } from "@/components/VinylCover";

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
          <VinylCover src={album.cover_url} style={{ marginBottom: "0.65rem" }} />
          <p style={{ fontWeight: 600, fontSize: "0.9375rem" }}>{album.title}</p>
          {album.artists && (
            <p style={{ color: "var(--vynl-texte-2)", fontSize: "0.8125rem" }}>{album.artists.name}</p>
          )}
        </Link>
      ))}
    </div>
  );
}
