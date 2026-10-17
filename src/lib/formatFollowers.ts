// « 1 follower », « 12 followers », « 1.5K followers ». Pur et sans dépendance (testé par
// formatFollowers.test.mjs).

const COMPACT = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });

export function formatFollowers(count: number): string {
  const n = Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0;
  return `${n < 1000 ? n : COMPACT.format(n)} ${n === 1 ? "follower" : "followers"}`;
}
