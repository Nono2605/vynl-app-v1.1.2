import Link from "next/link";
import type { Album } from "@/components/AlbumGrid";
import { albumTypeLabel } from "@/lib/albumType";

// Rangée de disques à faire défiler (la « caisse » de vinyles du site vitrine) :
// chaque sortie est un disque rond, un sur deux décalé vers le bas. Au survol, le
// disque tourne un peu et se soulève.
export function Crate({ albums, emptyMessage }: { albums: Album[] | null; emptyMessage: string }) {
  if (albums === null) {
    return (
      <p style={{ color: "var(--vynl-texte-2)" }}>
        Releases couldn&apos;t be loaded right now. Try again in a moment.
      </p>
    );
  }
  if (albums.length === 0) return <p style={{ color: "var(--vynl-texte-2)" }}>{emptyMessage}</p>;

  return (
    <ul className="crate">
      {albums.map((album) => {
        const year = album.release_date ? new Date(album.release_date).getUTCFullYear() : null;
        const kind = [album.type ? albumTypeLabel(album.type) : null, year].filter(Boolean).join(" · ");
        return (
          <li key={album.id} className="crate__item" data-reveal>
            <Link href={`/albums/${album.id}`} className="crate__link">
              <span className={`crate__disc${album.cover_url ? "" : " crate__disc--blank"}`}>
                {album.cover_url && (
                  // Image distante du stockage : <img> simple, sans l'optimiseur de next/image.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={album.cover_url} alt="" loading="lazy" decoding="async" draggable={false} />
                )}
              </span>
              <span className="crate__title">{album.title}</span>
              {album.artists && <span className="crate__artist">{album.artists.name}</span>}
              {kind && <span className="crate__kind">{kind}</span>}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
