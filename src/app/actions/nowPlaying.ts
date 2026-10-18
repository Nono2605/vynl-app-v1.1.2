"use server";

import { createClient } from "@/lib/supabase/server";
import { api } from "@/lib/api";
import type { TrackContext, TrackContextResult } from "@/lib/nowPlaying";

const ID = /^[0-9a-zA-Z-]{1,64}$/;

// Ce que la platine doit savoir du morceau en cours (artiste, déjà aimé, artiste déjà suivi), en un
// seul appel. Ne lève jamais : un échec laisse la platine sans les boutons « j'aime » et « suivre »,
// jamais sans lecture.
export async function getTrackContext(trackId: string): Promise<TrackContextResult> {
  if (!ID.test(trackId)) return { ok: false };

  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return { ok: false };

  try {
    const context = await api.get<TrackContext>(`/tracks/${trackId}/context`, { accessToken: session.access_token });
    return { ok: true, context };
  } catch {
    return { ok: false };
  }
}
