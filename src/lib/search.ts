import type { Track } from "@/components/TrackGrid";
import type { Album } from "@/components/AlbumGrid";
import type { Artist } from "@/components/ArtistGrid";

/** Réponse de /api/search : les premiers résultats de chaque famille. */
export interface SearchResponse {
  tracks: Track[];
  albums: Album[];
  artists: Artist[];
  /** Familles dont l'API n'a pas répondu (résultats partiels). */
  failed: ("tracks" | "albums" | "artists")[];
}

/** En dessous, on ne cherche pas : « a » ramènerait la moitié du catalogue. */
export const MIN_QUERY_LENGTH = 2;
export const MAX_QUERY_LENGTH = 100;
export const RESULTS_PER_KIND = 5;
