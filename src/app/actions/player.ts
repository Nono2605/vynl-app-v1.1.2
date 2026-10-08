"use server";

import { createClient } from "@/lib/supabase/server";
import { api, ApiError } from "@/lib/api";

export type StreamFailure = "unauthenticated" | "not_found" | "unavailable";

export type StreamResult =
  | { ok: true; url: string; format: string }
  | { ok: false; reason: StreamFailure };

// Les échecs attendus sont renvoyés, pas levés : en production Next masque le
// message d'une erreur levée par une Server Action, et le lecteur ne saurait
// plus dire « session expirée » de « morceau introuvable » ou « API injoignable ».
export async function getStreamUrl(trackId: string): Promise<StreamResult> {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return { ok: false, reason: "unauthenticated" };

  try {
    const { url, format } = await api.get<{ url: string; format: string }>(`/tracks/${trackId}/stream`, {
      accessToken: session.access_token,
    });
    return { ok: true, url, format };
  } catch (err) {
    if (err instanceof ApiError) {
      if (err.status === 401) return { ok: false, reason: "unauthenticated" };
      if (err.status === 404) return { ok: false, reason: "not_found" };
    }
    return { ok: false, reason: "unavailable" };
  }
}
