import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { api } from "@/lib/api";
import { PlaylistList, type PlaylistSummary } from "@/components/PlaylistList";
import { CreatePlaylistForm } from "./CreatePlaylistForm";

export default async function PlaylistsPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  const { data: playlists } = await api.get<{ data: PlaylistSummary[] }>("/playlists", {
    accessToken: session.access_token,
  });

  return (
    <div style={{ padding: "var(--space-lg)", display: "flex", flexDirection: "column", gap: "var(--space-xl)" }}>
      <h1 className="display-title">Your Playlists</h1>
      <CreatePlaylistForm />
      <PlaylistList playlists={playlists} emptyMessage="No playlists yet. Create your first one above." />
    </div>
  );
}
