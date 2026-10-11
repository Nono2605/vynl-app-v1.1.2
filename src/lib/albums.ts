import { api } from "@/lib/api";
import type { Album } from "@/components/AlbumGrid";

// Liste d'albums pour une section de page (Découvrir, recherche, page artiste).
// Renvoie null si l'API ne répond pas : une section secondaire en panne doit
// s'annoncer comme telle, pas faire tomber toute la page.
export async function fetchAlbums(query: string): Promise<Album[] | null> {
  try {
    const res = await api.get<{ data: Album[] }>(`/albums?${query}`);
    return res.data;
  } catch {
    return null;
  }
}
