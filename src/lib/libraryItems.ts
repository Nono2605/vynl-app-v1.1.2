// Lecture des réponses paginées de l'API pour la bibliothèque. Pur et sans dépendance (testé par
// libraryItems.test.mjs).

/** Taille d'une page demandée à l'API (son maximum). */
export const LIBRARY_PAGE_SIZE = 100;

/**
 * Les éléments d'une page de /library. Une ligne dont l'élément n'est plus disponible (morceau
 * retiré du catalogue, playlist devenue privée) a `item: null` : on l'ignore.
 */
export function libraryItems<T>(rows: readonly { item: T | null }[]): T[] {
  return rows.flatMap((row) => (row.item ? [row.item] : []));
}

/** La page est pleine : il y en a probablement d'autres derrière, que cet écran n'affiche pas encore. */
export function mayHaveMore(rowCount: number, pageSize = LIBRARY_PAGE_SIZE): boolean {
  return rowCount >= pageSize;
}
