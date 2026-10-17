"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { api, ApiError } from "@/lib/api";
import type { HeartbeatResult, HeartbeatState, PlaySource, StartPlayResult } from "@/lib/player/types";

async function accessToken(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

// L'API ne voit que l'adresse de CE serveur, pas celle de l'auditeur : on lui
// transmet pays, appareil et IP du visiteur sous des en-têtes à nous (lus par
// API/src/lib/clientInfo.ts, qui n'en garde qu'une empreinte d'IP salée). Les pays
// viennent de Vercel (x-vercel-ip-country), absent en local : l'API stocke alors null.
//
// Ne lève jamais et ne transmet que de l'ASCII imprimable : un en-tête invalide
// ferait échouer fetch(), donc le démarrage de la lecture, pour une simple statistique.
const PRINTABLE_ASCII = /^[\x20-\x7e]+$/;

async function visitorHeaders(): Promise<Record<string, string>> {
  try {
    const h = await headers();
    const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || undefined;
    const candidates: Record<string, string | undefined> = {
      "x-vynl-client-country": h.get("x-vercel-ip-country") ?? undefined,
      "x-vynl-client-ua": h.get("user-agent")?.slice(0, 512),
      "x-vynl-client-ip": forwarded,
    };
    const out: Record<string, string> = {};
    for (const [name, value] of Object.entries(candidates)) {
      if (value && PRINTABLE_ASCII.test(value)) out[name] = value;
    }
    return out;
  } catch {
    return {};
  }
}

// Démarre une lecture : le serveur la comptabilise (voir docs/SPEC_REMUNERATION.md)
// puis renvoie l'URL du morceau. Remplace GET /tracks/:id/stream, qui délivrait
// le morceau sans rien enregistrer.
//
// Les échecs attendus sont renvoyés, pas levés : en production Next masque le
// message d'une erreur levée par une Server Action, et le lecteur ne saurait
// plus dire « session expirée » de « morceau introuvable » ou « API injoignable ».
export async function startPlay(
  trackId: string,
  source: PlaySource | undefined,
  clientSessionId: string
): Promise<StartPlayResult> {
  const token = await accessToken();
  if (!token) return { ok: false, reason: "unauthenticated" };

  try {
    const res = await api.post<{ play_id: string; url: string; format: string; heartbeat_every_seconds: number }>(
      "/plays",
      {
        track_id: trackId,
        client_session_id: clientSessionId,
        ...(source ? { source_context: source.context, ...(source.id ? { source_id: source.id } : {}) } : {}),
      },
      { accessToken: token, headers: await visitorHeaders() }
    );
    return {
      ok: true,
      playId: res.play_id,
      url: res.url,
      format: res.format,
      heartbeatEverySeconds: res.heartbeat_every_seconds,
    };
  } catch (err) {
    if (err instanceof ApiError) {
      if (err.status === 401) return { ok: false, reason: "unauthenticated" };
      if (err.status === 404) return { ok: false, reason: "not_found" };
      if (err.status === 403 && err.code === "explicit_blocked") return { ok: false, reason: "explicit_blocked" };
    }
    return { ok: false, reason: "unavailable" };
  }
}

// Un battement de cœur : « à cette position, la lecture est dans cet état ». Le
// serveur en tire les secondes écoutées (le client n'en déclare aucune).
//
// Ne lève JAMAIS : un battement raté ne doit pas perturber l'écoute, et le
// suivant rattrape tout l'intervalle d'après la position.
export async function sendHeartbeat(
  playId: string,
  seq: number,
  positionSeconds: number,
  state: HeartbeatState
): Promise<HeartbeatResult> {
  try {
    const token = await accessToken();
    if (!token) return { status: "error" };

    const res = await api.post<{ status: HeartbeatResult["status"] }>(
      `/plays/${playId}/heartbeat`,
      { seq, position_seconds: Math.round(positionSeconds * 1000) / 1000, state },
      { accessToken: token }
    );
    return { status: res.status };
  } catch {
    return { status: "error" };
  }
}
