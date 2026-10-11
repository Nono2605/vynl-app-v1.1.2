import { createClient } from "@/lib/supabase/server";
import { api } from "@/lib/api";
import type { Track } from "@/components/TrackGrid";
import type { Album } from "@/components/AlbumGrid";
import type { Artist } from "@/components/ArtistGrid";
import { MAX_QUERY_LENGTH, MIN_QUERY_LENGTH, RESULTS_PER_KIND, type SearchResponse } from "@/lib/search";

// Recherche en direct de la barre du haut : les premiers morceaux, albums et artistes
// qui correspondent. Le navigateur ne parle pas à l'API (elle n'accepte que ce
// serveur), il passe donc par ici ; la session du cookie sert de contrôle d'accès.
//
// Les trois requêtes partent en parallèle et une famille qui échoue n'empêche pas les
// autres : on renvoie ce qu'on a et la liste de ce qui manque (`failed`).
const NO_STORE = { "Cache-Control": "no-store" };

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return Response.json({ error: "Not authenticated" }, { status: 401, headers: NO_STORE });

  const raw = new URL(request.url).searchParams.get("q") ?? "";
  const q = raw.trim().slice(0, MAX_QUERY_LENGTH);
  const empty: SearchResponse = { tracks: [], albums: [], artists: [], failed: [] };
  if (q.length < MIN_QUERY_LENGTH) return Response.json(empty, { headers: NO_STORE });

  const query = `limit=${RESULTS_PER_KIND}&q=${encodeURIComponent(q)}`;
  const [tracks, albums, artists] = await Promise.allSettled([
    api.get<{ data: Track[] }>(`/tracks?${query}`),
    api.get<{ data: Album[] }>(`/albums?${query}`),
    api.get<{ data: Artist[] }>(`/artists?${query}`),
  ]);

  const failed: SearchResponse["failed"] = [];
  if (tracks.status === "rejected") failed.push("tracks");
  if (albums.status === "rejected") failed.push("albums");
  if (artists.status === "rejected") failed.push("artists");
  // Tout est tombé : mieux vaut une erreur que « aucun résultat » (ce serait faux).
  if (failed.length === 3) return Response.json({ error: "Search unavailable" }, { status: 502, headers: NO_STORE });

  const body: SearchResponse = {
    tracks: tracks.status === "fulfilled" ? tracks.value.data : [],
    albums: albums.status === "fulfilled" ? albums.value.data : [],
    artists: artists.status === "fulfilled" ? artists.value.data : [],
    failed,
  };
  return Response.json(body, { headers: NO_STORE });
}
