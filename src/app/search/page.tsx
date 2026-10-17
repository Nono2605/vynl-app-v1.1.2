import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { api } from "@/lib/api";
import { TrackGrid, type Track } from "@/components/TrackGrid";
import { AlbumGrid } from "@/components/AlbumGrid";
import { fetchAlbums } from "@/lib/albums";
import { fetchGenres } from "@/lib/genreList";
import { ArtistGrid, type Artist } from "@/components/ArtistGrid";
import { GenreChips } from "@/components/GenreChips";
import { getSavedTrackIds } from "@/lib/savedTrackIds";
import { getAllowExplicit } from "@/lib/listening";
import { withExplicitFilter } from "@/lib/explicit";
import { parseGenreParam, parseTagParam } from "@/lib/trackMeta";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; genre?: string | string[]; tag?: string | string[] }>;
}) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  // Un genre (?genre=) ou un style (?tag=) se cherche seul, ou avec un terme : « dark » dans le genre « Electronic ».
  const genre = parseGenreParam(params.genre);
  const tag = parseTagParam(params.tag);
  const searching = Boolean(query || genre || tag);

  const allowExplicit = searching ? await getAllowExplicit(session.access_token) : true;
  const genreQuery = genre ? `&genre=${genre}` : "";
  const catalog = withExplicitFilter(
    `limit=24&q=${encodeURIComponent(query)}${genreQuery}${tag ? `&tag=${encodeURIComponent(tag)}` : ""}`,
    allowExplicit
  );
  // Les albums et les artistes n'ont pas de styles : un style ne cherche que des morceaux.
  const albumsQuery = withExplicitFilter(`limit=24&q=${encodeURIComponent(query)}${genreQuery}`, allowExplicit);

  const [results, savedTrackIds, genres] = await Promise.all([
    searching
      ? Promise.all([
          api.get<{ data: Track[] }>(`/tracks?${catalog}`),
          tag ? Promise.resolve({ data: [] as Artist[] }) : api.get<{ data: Artist[] }>(`/artists?limit=24&q=${encodeURIComponent(query)}${genreQuery}`),
          tag ? Promise.resolve([]) : fetchAlbums(albumsQuery),
        ])
      : Promise.resolve(null),
    getSavedTrackIds(session.access_token),
    fetchGenres(),
  ]);

  const genreLabel = genre ? (genres.find((item) => item.code === genre)?.label ?? genre) : null;
  // Ce qui est cherché, en toutes lettres, pour les messages « aucun résultat ».
  const subject = [query ? `“${query}”` : null, genreLabel ? `in ${genreLabel}` : null, tag ? `with the style #${tag}` : null]
    .filter(Boolean)
    .join(" ");

  return (
    <div style={{ padding: "var(--space-lg)", display: "flex", flexDirection: "column", gap: "var(--space-xl)" }}>
      <section>
        <h1 className="display-title" style={{ marginBottom: "var(--space-md)" }}>Search</h1>
        <form method="get" style={{ display: "flex", gap: "var(--space-sm)" }}>
          <input
            type="text"
            name="q"
            placeholder="Search tracks, albums, artists, genres or styles" aria-label="Search tracks, albums, artists, genres or styles"
            defaultValue={query}
            autoFocus
            className="input-field"
            style={{ flex: 1 }}
          />
          {genre && <input type="hidden" name="genre" value={genre} />}
          <button type="submit" className="btn btn-primary">
            Search
          </button>
        </form>

        {genres.length > 0 && (
          <div style={{ marginTop: "var(--space-md)" }}>
            <GenreChips genres={genres} active={genre} label="Browse by genre" />
          </div>
        )}
        {(genre || tag) && (
          <p style={{ marginTop: "var(--space-sm)", color: "var(--vynl-texte-2)", fontSize: "0.875rem" }}>
            Showing {genreLabel ? <strong>{genreLabel}</strong> : null}
            {genreLabel && tag ? " · " : null}
            {tag ? <strong>#{tag}</strong> : null}
            {" · "}
            <Link href={query ? `/search?q=${encodeURIComponent(query)}` : "/search"} className="text-link">
              Clear
            </Link>
          </p>
        )}
      </section>

      {results && (
        <>
          <section>
            <h2 style={{ fontSize: "1.125rem", marginBottom: "var(--space-md)" }}>Tracks</h2>
            <TrackGrid
              tracks={results[0].data}
              emptyMessage={`No tracks match ${subject}.`}
              savedTrackIds={savedTrackIds}
              source={{ context: "search" }}
            />
          </section>

          {!tag && (
            <>
              <section>
                <h2 style={{ fontSize: "1.125rem", marginBottom: "var(--space-md)" }}>Albums</h2>
                <AlbumGrid albums={results[2]} emptyMessage={`No albums match ${subject}.`} />
              </section>

              <section>
                <h2 style={{ fontSize: "1.125rem", marginBottom: "var(--space-md)" }}>Artists</h2>
                <ArtistGrid artists={results[1].data} emptyMessage={`No artists match ${subject}.`} />
              </section>
            </>
          )}
        </>
      )}
    </div>
  );
}
