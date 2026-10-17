// Contenu explicite côté webapp. Quand l'auditeur l'a refusé dans ses réglages, les listes du
// catalogue (Découvrir, recherche, page artiste) le masquent en passant `explicit=false` à l'API ;
// c'est l'API qui fait foi au démarrage d'une lecture (POST /plays), quelle que soit la liste.
// Pur et sans dépendance (testé par explicit.test.mjs).

/** Ajoute `explicit=false` à une query string de l'API quand le contenu explicite est refusé. */
export function withExplicitFilter(query: string, allowExplicit: boolean): string {
  if (allowExplicit) return query;
  return query ? `${query}&explicit=false` : "explicit=false";
}
