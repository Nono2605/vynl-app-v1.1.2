// Libellé d'un type de release (enum album_type de l'API). « ep » s'écrit EP.
const LABELS: Record<string, string> = {
  album: "Album",
  ep: "EP",
  single: "Single",
  compilation: "Compilation",
};

export function albumTypeLabel(type: string): string {
  return LABELS[type] ?? type.charAt(0).toUpperCase() + type.slice(1);
}
