// Petits nombres affichés dans l'interface : « 12 », « 1.5K », « 2.3M ». Pur et sans dépendance
// (testé par formatCount.test.mjs).

const COMPACT = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });

function whole(count: number): number {
  return Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0;
}

/** Le nombre exact sous 1 000, puis abrégé. Une valeur invalide ou négative donne 0. */
export function formatCount(count: number): string {
  const n = whole(count);
  return n < 1000 ? String(n) : COMPACT.format(n);
}

/** « 1 like », « 12 likes » : le nombre exact, pour une infobulle ou un lecteur d'écran. */
export function likesLabel(count: number): string {
  const n = whole(count);
  return `${n} ${n === 1 ? "like" : "likes"}`;
}
