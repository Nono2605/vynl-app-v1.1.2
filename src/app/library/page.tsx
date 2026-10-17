import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TrackGrid, type Track } from "@/components/TrackGrid";
import { AlbumGrid, type Album } from "@/components/AlbumGrid";
import { ArtistGrid } from "@/components/ArtistGrid";
import { PlaylistList, type PlaylistSummary } from "@/components/PlaylistList";
import { fetchFollowedArtists, fetchLibrarySection, type Section } from "@/lib/library";
import { LIBRARY_PAGE_SIZE } from "@/lib/libraryItems";

const unavailable = (what: string) => (
  <p style={{ color: "var(--vynl-texte-2)" }}>{what} couldn&apos;t be loaded right now. Try again in a moment.</p>
);

// Une page pleine : la bibliothèque contient probablement davantage, pas encore affiché ici.
function MoreNote({ section }: { section: Section<unknown> }) {
  if (!section.more) return null;
  return (
    <p style={{ color: "var(--vynl-texte-3)", fontSize: "0.8125rem", marginTop: "var(--space-sm)" }}>
      Showing your {LIBRARY_PAGE_SIZE} latest. Older ones will be browsable soon.
    </p>
  );
}

export default async function LibraryPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  const token = session.access_token;
  const [tracks, albums, playlists, following] = await Promise.all([
    fetchLibrarySection<Track>("track", token),
    fetchLibrarySection<Album>("album", token),
    fetchLibrarySection<PlaylistSummary>("playlist", token),
    fetchFollowedArtists(token),
  ]);
  const savedTrackIds = new Set(tracks?.items.map((t) => t.id));

  return (
    <div style={{ padding: "var(--space-lg)", display: "flex", flexDirection: "column", gap: "var(--space-xl)" }}>
      <h1 className="display-title">Your Library</h1>

      <section>
        <h2 style={{ fontSize: "1.125rem", marginBottom: "var(--space-md)" }}>Tracks</h2>
        {tracks ? (
          <>
            <TrackGrid
              tracks={tracks.items}
              emptyMessage="No saved tracks yet."
              savedTrackIds={savedTrackIds}
              source={{ context: "library" }}
            />
            <MoreNote section={tracks} />
          </>
        ) : (
          unavailable("Your saved tracks")
        )}
      </section>

      <section>
        <h2 style={{ fontSize: "1.125rem", marginBottom: "var(--space-md)" }}>Albums</h2>
        {albums ? (
          <>
            <AlbumGrid albums={albums.items} emptyMessage="No saved albums yet." />
            <MoreNote section={albums} />
          </>
        ) : (
          unavailable("Your saved albums")
        )}
      </section>

      <section id="following">
        <h2 style={{ fontSize: "1.125rem", marginBottom: "var(--space-md)" }}>Following</h2>
        {following ? (
          <>
            <ArtistGrid artists={following.items} emptyMessage="You're not following any artist yet. Use Follow on an artist page." />
            <MoreNote section={following} />
          </>
        ) : (
          unavailable("The artists you follow")
        )}
      </section>

      <section>
        <h2 style={{ fontSize: "1.125rem", marginBottom: "var(--space-md)" }}>Playlists</h2>
        {playlists ? (
          <>
            <PlaylistList playlists={playlists.items} emptyMessage="No saved playlists yet." />
            <MoreNote section={playlists} />
          </>
        ) : (
          unavailable("Your saved playlists")
        )}
      </section>
    </div>
  );
}
