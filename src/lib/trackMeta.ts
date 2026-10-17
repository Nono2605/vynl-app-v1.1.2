// Genres, styles et crédits d'un morceau tels que l'API les renvoie (migration 20261018000000_release_details.sql
// de l'API) : de quoi afficher « Artiste feat. Invité », les genres d'un album, ses styles, qui a produit ou écrit.
// Pur et sans dépendance (testé par trackMeta.test.mjs).

export interface GenreRef {
  code: string;
  label: string;
}

export interface Credit {
  role: string;
  name: string;
  /** La page de l'artiste Vynl crédité ; null pour une personne qui n'a pas de page. */
  slug: string | null;
}

/** Ce que porte un morceau de l'API ; absent des anciennes réponses (tout est alors facultatif). */
export interface TrackMeta {
  genres?: GenreRef[];
  tags?: string[];
  credits?: Credit[];
}

const MAX_NAMED = 3;

/** Les artistes invités d'un morceau (rôle « featured »), dans l'ordre. */
export function featuredCredits(credits: readonly Credit[] | undefined): Credit[] {
  return (credits ?? []).filter((credit) => credit.role === "featured");
}

/**
 * La ligne d'artiste d'un morceau : « Nova » ou « Nova feat. Kid, Sam ». Au-delà de trois invités : « feat. A, B, C
 * +2 ». Sans nom d'artiste (morceau retiré, réponse partielle) : « Unknown artist », comme avant.
 */
export function artistLine(artistName: string | null | undefined, credits: readonly Credit[] | undefined): string {
  const name = artistName?.trim() || "Unknown artist";
  const guests = featuredCredits(credits).map((credit) => credit.name);
  if (guests.length === 0) return name;
  const shown = guests.slice(0, MAX_NAMED).join(", ");
  const more = guests.length > MAX_NAMED ? ` +${guests.length - MAX_NAMED}` : "";
  return `${name} feat. ${shown}${more}`;
}

const ROLE_LABEL: Record<string, string> = { producer: "Produced by", writer: "Written by" };

/**
 * Les autres crédits d'un morceau (producteur, auteur), un libellé par rôle : « Produced by Sam · Written by Lou ».
 * Les invités n'y sont pas (ils sont dans la ligne d'artiste). Chaîne vide s'il n'y en a pas.
 */
export function otherCreditsLine(credits: readonly Credit[] | undefined): string {
  const byRole = new Map<string, string[]>();
  for (const credit of credits ?? []) {
    if (!ROLE_LABEL[credit.role]) continue;
    byRole.set(credit.role, [...(byRole.get(credit.role) ?? []), credit.name]);
  }
  return [...byRole.entries()].map(([role, names]) => `${ROLE_LABEL[role]} ${names.join(", ")}`).join(" · ");
}

/** Les styles qui reviennent le plus parmi des morceaux, les plus fréquents d'abord (à égalité : ordre d'apparition). */
export function topTags(tracks: readonly TrackMeta[], limit = 8): string[] {
  const counts = new Map<string, { count: number; order: number }>();
  let order = 0;
  for (const track of tracks) {
    for (const tag of track.tags ?? []) {
      const known = counts.get(tag);
      if (known) known.count += 1;
      else counts.set(tag, { count: 1, order: order++ });
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1].count - a[1].count || a[1].order - b[1].order)
    .slice(0, limit)
    .map(([tag]) => tag);
}

/** Même forme qu'à l'API : un code de genre de la liste fermée, sinon rien. */
const GENRE_CODE = /^[a-z][a-z0-9_]{1,30}$/;

export function parseGenreParam(raw: string | string[] | undefined): string | null {
  return typeof raw === "string" && GENRE_CODE.test(raw) ? raw : null;
}

const TAG_PATTERN = /^[\p{L}\p{N}][\p{L}\p{N} '-]{1,23}$/u;

/** Un style de l'adresse (?tag=), mis en forme comme à l'API, ou null. */
export function parseTagParam(raw: string | string[] | undefined): string | null {
  if (typeof raw !== "string") return null;
  const tag = raw.trim().replace(/^#+/, "").trim().replace(/\s+/g, " ").toLowerCase();
  return TAG_PATTERN.test(tag) ? tag : null;
}

/** L'adresse de la page de recherche pour un genre, un style ou un terme. */
export function searchHref(params: { q?: string; genre?: string; tag?: string }): string {
  const query = new URLSearchParams();
  if (params.q) query.set("q", params.q);
  if (params.genre) query.set("genre", params.genre);
  if (params.tag) query.set("tag", params.tag);
  const text = query.toString();
  return text ? `/search?${text}` : "/search";
}
