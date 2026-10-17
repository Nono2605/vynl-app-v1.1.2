import { api } from "@/lib/api";
import type { GenreRef } from "@/lib/trackMeta";

// La liste fermée des genres (GET /genres, publique), pour « parcourir par genre » : jamais d'erreur, une liste
// vide si l'API ne répond pas (ou si la migration des genres n'est pas appliquée) : la section n'est alors pas
// affichée, le reste de la page n'en souffre pas.
export async function fetchGenres(): Promise<GenreRef[]> {
  try {
    const { genres } = await api.get<{ genres: GenreRef[] }>("/genres");
    return genres;
  } catch {
    return [];
  }
}
