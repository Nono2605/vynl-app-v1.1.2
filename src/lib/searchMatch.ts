// Mise en évidence de ce que l'utilisateur a tapé dans un résultat de recherche.
// Pur et sans dépendance (testé par searchMatch.test.mjs).

export interface MatchPart {
  text: string;
  match: boolean;
}

/**
 * Coupe `text` en morceaux dont un seul (la première occurrence de `query`, sans
 * tenir compte de la casse) est marqué `match`. Sans occurrence, un seul morceau.
 */
export function splitMatch(text: string, query: string): MatchPart[] {
  const needle = query.trim();
  if (!needle) return [{ text, match: false }];

  const lower = text.toLowerCase();
  // Certains caractères changent de longueur en minuscules (« İ » devient deux
  // signes) : les positions ne correspondraient plus au texte d'origine.
  if (lower.length !== text.length) return [{ text, match: false }];

  const at = lower.indexOf(needle.toLowerCase());
  if (at === -1) return [{ text, match: false }];

  return [
    { text: text.slice(0, at), match: false },
    { text: text.slice(at, at + needle.length), match: true },
    { text: text.slice(at + needle.length), match: false },
  ].filter((part) => part.text !== "");
}
