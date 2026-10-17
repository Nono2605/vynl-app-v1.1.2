// Genres favoris de l'auditeur. La liste fermée vient de l'API (GET /genres, la même que celle où les
// créateurs choisissent le genre d'un morceau) ; ce fichier ne fait que les choix et la lecture des
// anciennes valeurs libres. Pur et sans dépendance (testé par genres.test.mjs).

export interface GenreOption {
  code: string;
  label: string;
}

export const MAX_FAVORITE_GENRES = 20;

// Même forme que l'API (lib/genres.ts, GENRE_CODE).
const GENRE_CODE = /^[a-z][a-z0-9_]{1,30}$/;

/**
 * Les genres à cocher d'après ce qui est enregistré. Avant la liste fermée, le réglage était un
 * texte libre (« House, Hip-Hop ») : une ancienne valeur compte si elle correspond au code ou au
 * nom d'un genre (sans tenir compte de la casse). Les autres ne sont pas reprises.
 */
export function selectedGenreCodes(favorites: readonly string[], options: readonly GenreOption[]): Set<string> {
  const byName = new Map<string, string>();
  for (const option of options) {
    byName.set(option.code.toLowerCase(), option.code);
    byName.set(option.label.trim().toLowerCase(), option.code);
  }
  const selected = new Set<string>();
  for (const favorite of favorites) {
    const code = byName.get(favorite.trim().toLowerCase());
    if (code) selected.add(code);
  }
  return selected;
}

/**
 * Ce qu'on enregistre. `chosen` : les cases cochées (des codes de la liste) ; `text` : le champ libre
 * de secours, utilisé seulement quand la liste n'a pas pu être chargée. Sans doublon, au plus
 * MAX_FAVORITE_GENRES.
 */
export function parseFavoriteGenres(chosen: readonly string[], text: string): string[] {
  const codes = chosen.map((value) => value.trim()).filter((value) => GENRE_CODE.test(value));
  const free = text
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  return [...new Set([...codes, ...free])].slice(0, MAX_FAVORITE_GENRES);
}
