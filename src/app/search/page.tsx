import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { api } from "@/lib/api";
import { TrackGrid, type Track } from "@/components/TrackGrid";
import { ArtistGrid, type Artist } from "@/components/ArtistGrid";
import { getSavedTrackIds } from "@/lib/savedTrackIds";

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

  const [results, savedTrackIds] = await Promise.all([
    query
      ? Promise.all([
          api.get<{ data: Track[] }>(`/tracks?limit=24&q=${encodeURIComponent(query)}`),
          api.get<{ data: Artist[] }>(`/artists?limit=24&q=${encodeURIComponent(query)}`),
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
            placeholder="Search tracks or artists"
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
            <h2 style={{ fontSize: "1.125rem", marginBottom: "var(--space-md)" }}>Artists</h2>
            <ArtistGrid artists={results[1].data} emptyMessage={`No artists match "${query}".`} />
          </section>
        </>
      )}
    </div>
  );
}
