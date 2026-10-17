import { api } from "@/lib/api";
import { LIBRARY_PAGE_SIZE, libraryItems, mayHaveMore } from "@/lib/libraryItems";
import type { Artist } from "@/components/ArtistGrid";

export interface Section<T> {
  items: T[];
  /** La page est pleine : il y a probablement d'autres éléments, pas encore affichés. */
  more: boolean;
}

type LibraryType = "track" | "album" | "playlist";

// Une section de la bibliothèque (les plus récents d'abord). `null` : l'API n'a pas répondu, ce qui
// ne doit ni faire tomber la page ni se faire passer pour « rien de sauvegardé ».
export async function fetchLibrarySection<T>(type: LibraryType, accessToken: string): Promise<Section<T> | null> {
  try {
    const { data } = await api.get<{ data: { item: T | null }[] }>(`/library?type=${type}&limit=${LIBRARY_PAGE_SIZE}`, {
      accessToken,
    });
    return { items: libraryItems(data), more: mayHaveMore(data.length) };
  } catch {
    return null;
  }
}

// Les artistes que l'utilisateur suit (le plus récemment suivi d'abord).
export async function fetchFollowedArtists(accessToken: string): Promise<Section<Artist> | null> {
  try {
    const { data } = await api.get<{ data: Artist[] }>(`/me/follows?limit=${LIBRARY_PAGE_SIZE}`, { accessToken });
    return { items: data, more: mayHaveMore(data.length) };
  } catch {
    return null;
  }
}
