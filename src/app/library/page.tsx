import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { api } from "@/lib/api";
import { TrackGrid, type Track } from "@/components/TrackGrid";
import { AlbumGrid, type Album } from "@/components/AlbumGrid";
import { ArtistGrid, type Artist } from "@/components/ArtistGrid";
import { PlaylistList, type PlaylistSummary } from "@/components/PlaylistList";

interface LibraryRow {
  item_type: "track" | "album" | "artist" | "playlist";
  item: Track | Album | Artist | PlaylistSummary | null;
}

export default async function LibraryPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  const { data: rows } = await api.get<{ data: LibraryRow[] }>("/library", {
    accessToken: session.access_token,
  });

  const byType = <T,>(type: LibraryRow["item_type"]) =>
    rows.filter((r) => r.item_type === type && r.item).map((r) => r.item as T);

  const tracks = byType<Track>("track");
  const albums = byType<Album>("album");
  const artists = byType<Artist>("artist");
  const playlists = byType<PlaylistSummary>("playlist");
  const savedTrackIds = new Set(tracks.map((t) => t.id));

  return (
    <div style={{ padding: "var(--space-lg)", display: "flex", flexDirection: "column", gap: "var(--space-xl)" }}>
      <h1 className="display-title">Your Library</h1>

      <section>
        <h2 style={{ fontSize: "1.125rem", marginBottom: "var(--space-md)" }}>Tracks</h2>
        <TrackGrid tracks={tracks} emptyMessage="No saved tracks yet." savedTrackIds={savedTrackIds} />
      </section>

      <section>
        <h2 style={{ fontSize: "1.125rem", marginBottom: "var(--space-md)" }}>Albums</h2>
        <AlbumGrid albums={albums} emptyMessage="No saved albums yet." />
      </section>

      <section>
        <h2 style={{ fontSize: "1.125rem", marginBottom: "var(--space-md)" }}>Artists</h2>
        <ArtistGrid artists={artists} emptyMessage="No saved artists yet." />
      </section>

      <section>
        <h2 style={{ fontSize: "1.125rem", marginBottom: "var(--space-md)" }}>Playlists</h2>
        <PlaylistList playlists={playlists} emptyMessage="No saved playlists yet." />
      </section>
    </div>
  );
}
