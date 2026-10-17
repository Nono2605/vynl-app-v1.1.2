import Link from "next/link";
import { searchHref, type GenreRef } from "@/lib/trackMeta";

// Des genres, chacun un lien vers la recherche de ce genre. `active` : le genre en cours (page de recherche).
export function GenreChips({
  genres,
  active,
  label = "Genres",
}: {
  genres: GenreRef[];
  active?: string | null;
  label?: string;
}) {
  if (genres.length === 0) return null;
  return (
    <ul className="chip-links" aria-label={label}>
      {genres.map((genre) => (
        <li key={genre.code}>
          <Link
            href={searchHref({ genre: genre.code })}
            className="chip-link"
            aria-current={active === genre.code ? "true" : undefined}
          >
            {genre.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

// Des styles libres (« dark », « late night »), chacun un lien vers la recherche de ce style.
export function TagChips({ tags, active, label = "Styles" }: { tags: string[]; active?: string | null; label?: string }) {
  if (tags.length === 0) return null;
  return (
    <ul className="chip-links" aria-label={label}>
      {tags.map((tag) => (
        <li key={tag}>
          <Link
            href={searchHref({ tag })}
            className="chip-link chip-link--tag"
            aria-current={active === tag ? "true" : undefined}
          >
            #{tag}
          </Link>
        </li>
      ))}
    </ul>
  );
}
