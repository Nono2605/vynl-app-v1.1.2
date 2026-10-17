import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { api } from "@/lib/api";
import type { Track } from "@/components/TrackGrid";
import type { Artist } from "@/components/ArtistGrid";
import { DiscoverView } from "@/components/DiscoverView";
import { fetchAlbums } from "@/lib/albums";
import { fetchGenres } from "@/lib/genreList";
import { getSavedTrackIds } from "@/lib/savedTrackIds";
import { getAllowExplicit } from "@/lib/listening";
import { withExplicitFilter } from "@/lib/explicit";

export default async function DiscoverPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  const allowExplicit = await getAllowExplicit(session.access_token);
  const catalog = withExplicitFilter("limit=12", allowExplicit);

  const [albums, tracksRes, artistsRes, savedTrackIds, genres] = await Promise.all([
    fetchAlbums(catalog),
    api.get<{ data: Track[] }>(`/tracks?${catalog}`),
    api.get<{ data: Artist[] }>("/artists?limit=12"),
    getSavedTrackIds(session.access_token),
    fetchGenres(),
  ]);

  return (
    <DiscoverView
      albums={albums}
      tracks={tracksRes.data}
      artists={artistsRes.data}
      savedTrackIds={savedTrackIds}
      genres={genres}
    />
  );
}
