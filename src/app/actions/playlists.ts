"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { api } from "@/lib/api";
import { getAllowExplicit } from "@/lib/listening";
import { withExplicitFilter } from "@/lib/explicit";

async function accessToken() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");
  return session.access_token;
}

export interface PlaylistFormState {
  error?: string;
}

export async function createPlaylist(
  _state: PlaylistFormState | undefined,
  formData: FormData
): Promise<PlaylistFormState> {
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { error: "Title is required." };
  const isPublic = formData.get("is_public") === "on";

  const token = await accessToken();
  let playlist: { id: string };
  try {
    playlist = await api.post("/playlists", { title, is_public: isPublic }, { accessToken: token });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not create playlist." };
  }

  redirect(`/playlists/${playlist.id}`);
}

export async function deletePlaylist(playlistId: string) {
  await api.delete(`/playlists/${playlistId}`, { accessToken: await accessToken() });
  redirect("/playlists");
}

export async function setPlaylistVisibility(playlistId: string, isPublic: boolean) {
  await api.patch(`/playlists/${playlistId}`, { is_public: isPublic }, { accessToken: await accessToken() });
  revalidatePath(`/playlists/${playlistId}`);
  revalidatePath("/playlists");
}

export async function addTrackToPlaylist(playlistId: string, trackId: string) {
  await api.post(`/playlists/${playlistId}/tracks`, { track_id: trackId }, { accessToken: await accessToken() });
  revalidatePath(`/playlists/${playlistId}`);
}

export async function removeTrackFromPlaylist(playlistId: string, trackId: string) {
  await api.delete(`/playlists/${playlistId}/tracks/${trackId}`, { accessToken: await accessToken() });
  revalidatePath(`/playlists/${playlistId}`);
}

interface SearchTrack {
  id: string;
  title: string;
  artists: { name: string } | null;
}

export interface TrackSearchState {
  results?: SearchTrack[];
  query?: string;
}

export async function searchTracksForPlaylist(
  _state: TrackSearchState | undefined,
  formData: FormData
): Promise<TrackSearchState> {
  const query = String(formData.get("q") ?? "").trim();
  if (!query) return { results: [], query };

  const allowExplicit = await getAllowExplicit(await accessToken());
  const { data } = await api.get<{ data: SearchTrack[] }>(
    `/tracks?${withExplicitFilter(`limit=10&q=${encodeURIComponent(query)}`, allowExplicit)}`
  );
  return { results: data, query };
}
