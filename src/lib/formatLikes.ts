// Le nombre de « j'aime » tel qu'on l'affiche : exact sous 1 000, puis par paliers d'une puissance de dix,
// suivis d'un « + » : 1k+, 10k+, 100k+, 1M+, 10M+… (« 1k+ » : au moins mille, pas mille exactement).
// Pur et sans dépendance (testé par formatLikes.test.mjs).

const UNITS = [
  { value: 1e12, suffix: "T" },
  { value: 1e9, suffix: "B" },
  { value: 1e6, suffix: "M" },
  { value: 1e3, suffix: "k" },
] as const;

function whole(count: number): number {
  return Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0;
}

/** « 12 », « 999 », « 1k+ », « 10k+ », « 100k+ », « 1M+ »… Une valeur invalide ou négative donne « 0 ». */
export function formatLikes(count: number): string {
  const n = whole(count);
  if (n < 1000) return String(n);

  const unit = UNITS.find((u) => n >= u.value)!;
  const ratio = n / unit.value; // de 1 à moins de 1 000
  let step = 1;
  while (step * 10 <= ratio) step *= 10;
  return `${step}${unit.suffix}+`;
}

/** « 1 like », « 12 likes », « 1k+ likes » : le même palier que l'affichage, pour une infobulle ou un lecteur d'écran. */
export function likesLabel(count: number): string {
  const n = whole(count);
  return `${formatLikes(n)} ${n === 1 ? "like" : "likes"}`;
}
