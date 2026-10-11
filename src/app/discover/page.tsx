import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { api } from "@/lib/api";
import type { Track } from "@/components/TrackGrid";
import type { Artist } from "@/components/ArtistGrid";
import { DiscoverView } from "@/components/DiscoverView";
import { fetchAlbums } from "@/lib/albums";
import { getSavedTrackIds } from "@/lib/savedTrackIds";

export default async function DiscoverPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  const [albums, tracksRes, artistsRes, savedTrackIds] = await Promise.all([
    fetchAlbums("limit=12"),
    api.get<{ data: Track[] }>("/tracks?limit=12"),
    api.get<{ data: Artist[] }>("/artists?limit=12"),
    getSavedTrackIds(session.access_token),
  ]);

  return <DiscoverView albums={albums} tracks={tracksRes.data} artists={artistsRes.data} savedTrackIds={savedTrackIds} />;
}
