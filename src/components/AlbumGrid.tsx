import Link from "next/link";
import { VinylCover } from "@/components/VinylCover";
import { albumTypeLabel } from "@/lib/albumType";

export interface Album {
  id: string;
  title: string;
  cover_url: string | null;
  artists: { name: string; slug: string } | null;
  /** Absents des anciennes réponses (bibliothèque) : la ligne « Album · 2026 » est alors omise. */
  type?: string;
  release_date?: string | null;
}

// « Album · 2026 », « EP », « Single · 2025 »… selon ce que l'API a renvoyé.
function releaseLine(album: Album): string | null {
  const year = album.release_date ? new Date(album.release_date).getUTCFullYear() : null;
  const parts = [album.type ? albumTypeLabel(album.type) : null, year];
  const line = parts.filter(Boolean).join(" · ");
  return line || null;
}

export function AlbumGrid({ albums, emptyMessage }: { albums: Album[] | null; emptyMessage: string }) {
  // null : la liste n'a pas pu être chargée (voir fetchAlbums), à ne pas confondre avec « aucun album ».
  if (albums === null) {
    return <p style={{ color: "var(--vynl-texte-2)" }}>Releases couldn&apos;t be loaded right now. Try again in a moment.</p>;
  }
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
        <Link key={album.id} href={`/albums/${album.id}`} className="hover-card" data-reveal>
          <span data-tilt style={{ display: "block", marginBottom: "0.65rem" }}>
            <VinylCover src={album.cover_url} />
          </span>
          <p style={{ fontWeight: 600, fontSize: "0.9375rem" }}>{album.title}</p>
          {album.artists && (
            <p style={{ color: "var(--vynl-texte-2)", fontSize: "0.8125rem" }}>{album.artists.name}</p>
          )}
          {releaseLine(album) && (
            <p style={{ color: "var(--vynl-texte-3)", fontSize: "0.75rem" }}>{releaseLine(album)}</p>
          )}
        </Link>
      ))}
    </div>
  );
}
