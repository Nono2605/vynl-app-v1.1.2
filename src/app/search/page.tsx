import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { api } from "@/lib/api";
import { TrackGrid, type Track } from "@/components/TrackGrid";
import { AlbumGrid } from "@/components/AlbumGrid";
import { fetchAlbums } from "@/lib/albums";
import { ArtistGrid, type Artist } from "@/components/ArtistGrid";
import { getSavedTrackIds } from "@/lib/savedTrackIds";
import { getAllowExplicit } from "@/lib/listening";
import { withExplicitFilter } from "@/lib/explicit";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  const allowExplicit = query ? await getAllowExplicit(session.access_token) : true;
  const catalog = withExplicitFilter(`limit=24&q=${encodeURIComponent(query)}`, allowExplicit);

  const [results, savedTrackIds] = await Promise.all([
    query
      ? Promise.all([
          api.get<{ data: Track[] }>(`/tracks?${catalog}`),
          api.get<{ data: Artist[] }>(`/artists?limit=24&q=${encodeURIComponent(query)}`),
          fetchAlbums(catalog),
        ])
      : Promise.resolve(null),
    getSavedTrackIds(session.access_token),
  ]);

  return (
    <div style={{ padding: "var(--space-lg)", display: "flex", flexDirection: "column", gap: "var(--space-xl)" }}>
      <section>
        <h1 className="display-title" style={{ marginBottom: "var(--space-md)" }}>Search</h1>
        <form method="get" style={{ display: "flex", gap: "var(--space-sm)" }}>
          <input
            type="text"
            name="q"
            placeholder="Search tracks, albums or artists" aria-label="Search tracks, albums or artists"
            defaultValue={query}
            autoFocus
            className="input-field"
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn btn-primary">
            Search
          </button>
        </form>
      </section>

      {results && (
        <>
          <section>
            <h2 style={{ fontSize: "1.125rem", marginBottom: "var(--space-md)" }}>Tracks</h2>
            <TrackGrid
              tracks={results[0].data}
              emptyMessage={`No tracks match "${query}".`}
              savedTrackIds={savedTrackIds}
              source={{ context: "search" }}
            />
          </section>

          <section>
            <h2 style={{ fontSize: "1.125rem", marginBottom: "var(--space-md)" }}>Albums</h2>
            <AlbumGrid albums={results[2]} emptyMessage={`No albums match "${query}".`} />
          </section>

          <section>
            <h2 style={{ fontSize: "1.125rem", marginBottom: "var(--space-md)" }}>Artists</h2>
            <ArtistGrid artists={results[1].data} emptyMessage={`No artists match "${query}".`} />
          </section>
        </>
      )}
    </div>
  );
}
