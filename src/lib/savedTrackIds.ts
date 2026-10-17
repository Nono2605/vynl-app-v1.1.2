import { api } from "@/lib/api";

// Ids des morceaux déjà sauvegardés par l'utilisateur, pour amorcer SaveButton. Une seule requête
// légère (que les identifiants, pas le détail de la bibliothèque), quelle que soit sa taille.
//
// Ne lève jamais : si l'API ne répond pas, les cœurs repartent simplement « non sauvegardés » au lieu
// de faire tomber la page (Découvrir, recherche, artiste, album, playlist).
export async function getSavedTrackIds(accessToken: string): Promise<Set<string>> {
  try {
    const { ids } = await api.get<{ ids: string[] }>("/library/ids?type=track", { accessToken });
    return new Set(ids);
  } catch {
    return new Set();
  }
}
