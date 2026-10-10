import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { api } from "@/lib/api";
import { TrackGrid, type Track } from "@/components/TrackGrid";
import { ArtistGrid, type Artist } from "@/components/ArtistGrid";
import { getSavedTrackIds } from "@/lib/savedTrackIds";

export default async function DiscoverPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  const [tracksRes, artistsRes, savedTrackIds] = await Promise.all([
    api.get<{ data: Track[] }>("/tracks?limit=12"),
    api.get<{ data: Artist[] }>("/artists?limit=12"),
    getSavedTrackIds(session.access_token),
  ]);

  return (
    <div style={{ padding: "var(--space-lg)", display: "flex", flexDirection: "column", gap: "var(--space-xl)" }}>
      <section>
        <h1 className="display-title" style={{ marginBottom: "var(--space-sm)" }}>Discover</h1>
        <p style={{ color: "var(--vynl-texte-2)" }}>
          Every track published on Vynl, most recent first.
        </p>
      </section>

      <section>
        <h2 style={{ fontSize: "1.125rem", marginBottom: "var(--space-md)" }}>New tracks</h2>
        <TrackGrid
          tracks={tracksRes.data}
          emptyMessage="No tracks published yet — check back soon."
          savedTrackIds={savedTrackIds}
          source={{ context: "discover" }}
        />
      </section>

      <section>
        <h2 style={{ fontSize: "1.125rem", marginBottom: "var(--space-md)" }}>Artists</h2>
        <ArtistGrid artists={artistsRes.data} emptyMessage="No artists yet — check back soon." />
      </section>
    </div>
  );
}
