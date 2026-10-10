import { createClient } from "@/lib/supabase/server";
import { api } from "@/lib/api";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Dernier battement d'une lecture, envoyé par le navigateur au moment où la page
// se ferme ou se recharge (navigator.sendBeacon, voir PlayerContext). Une Server
// Action ne convient pas ici : le navigateur annule les requêtes ordinaires d'une
// page qui part, pas celles d'un beacon.
//
// Le beacon n'a ni en-tête d'autorisation ni réponse lue : l'identité vient du
// cookie de session, et l'API ne mesure que les lectures du compte connecté.
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(null, { status: 400 });
  }

  const { play_id, seq, position_seconds } = (body ?? {}) as Record<string, unknown>;
  if (typeof play_id !== "string" || !UUID.test(play_id)) return new Response(null, { status: 400 });
  if (typeof seq !== "number" || !Number.isInteger(seq) || seq < 1) return new Response(null, { status: 400 });
  if (typeof position_seconds !== "number" || !Number.isFinite(position_seconds) || position_seconds < 0) {
    return new Response(null, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return new Response(null, { status: 401 });

  try {
    await api.post(
      `/plays/${play_id}/heartbeat`,
      { seq, position_seconds, state: "closed" },
      { accessToken: session.access_token }
    );
    return new Response(null, { status: 204 });
  } catch {
    // Rien à réessayer côté navigateur (la page est partie) : la lecture sera
    // close au prochain démarrage, à la position du dernier battement reçu.
    return new Response(null, { status: 502 });
  }
}
