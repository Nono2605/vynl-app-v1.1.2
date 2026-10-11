"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { api, ApiError } from "@/lib/api";
import {
  MAX_PLAYLIST_TITLE,
  type AddResult,
  type CreateResult,
  type MenuPlaylist,
  type PlaylistsResult,
} from "@/lib/trackMenu";

// Actions du menu « ⋯ » d'un morceau : lister mes playlists, y ajouter un morceau, en créer
// une avec ce morceau. Elles ne lèvent jamais : en production Next masque le message d'une
// erreur levée par une Server Action, et le menu ne saurait plus dire « session expirée »
// de « playlist introuvable ». Le résultat dit ce qui s'est passé.
const EXPIRED = "Your session has expired. Log in again.";
const ID = /^[0-9a-zA-Z-]{1,64}$/;

async function accessToken(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

function failure(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    if (err.status === 401) return EXPIRED;
    if (err.status === 404) return "That playlist isn't available anymore.";
  }
  return fallback;
}

export async function listMyPlaylists(): Promise<PlaylistsResult> {
  const token = await accessToken();
  if (!token) return { ok: false, error: EXPIRED };
  try {
    const { data } = await api.get<{ data: MenuPlaylist[] }>("/playlists", { accessToken: token });
    return { ok: true, playlists: data.map(({ id, title, is_public }) => ({ id, title, is_public })) };
  } catch (err) {
    return { ok: false, error: failure(err, "Couldn't load your playlists.") };
  }
}

export async function addToPlaylist(playlistId: string, trackId: string): Promise<AddResult> {
  if (!ID.test(playlistId) || !ID.test(trackId)) return { ok: false, error: "Couldn't add this track." };
  const token = await accessToken();
  if (!token) return { ok: false, error: EXPIRED };
  try {
    // L'API répond { added: false } si le morceau y était déjà. Une ancienne version de l'API
    // répondait 204 sans corps dans les deux cas : on ne peut alors rien dire, on compte « ajouté ».
    const res = await api.post<{ added?: boolean } | undefined>(
      `/playlists/${playlistId}/tracks`,
      { track_id: trackId },
      { accessToken: token }
    );
    revalidatePath(`/playlists/${playlistId}`);
    return { ok: true, added: res?.added !== false };
  } catch (err) {
    return { ok: false, error: failure(err, "Couldn't add this track. Try again.") };
  }
}

export async function createPlaylistAndAdd(title: string, trackId: string): Promise<CreateResult> {
  const name = title.trim().slice(0, MAX_PLAYLIST_TITLE);
  if (!name) return { ok: false, error: "Give the playlist a name." };
  if (!ID.test(trackId)) return { ok: false, error: "Couldn't add this track." };
  const token = await accessToken();
  if (!token) return { ok: false, error: EXPIRED };

  let playlist: { id: string; title: string };
  try {
    playlist = await api.post<{ id: string; title: string }>(
      "/playlists",
      { title: name, is_public: false },
      { accessToken: token }
    );
  } catch (err) {
    return { ok: false, error: failure(err, "Couldn't create the playlist. Try again.") };
  }
  revalidatePath("/playlists");

  const added = await addToPlaylist(playlist.id, trackId);
  if (!added.ok) {
    return {
      ok: false,
      error: `Playlist created, but the track couldn't be added. ${added.error}`,
      created: { id: playlist.id, title: playlist.title },
    };
  }
  return { ok: true, playlist: { id: playlist.id, title: playlist.title } };
}
