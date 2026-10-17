// Petit « E » à côté du titre d'un morceau, d'un album ou d'un single dont le contenu est explicite.
// Discret (contour fin, pas de couleur d'alerte) mais lisible par un lecteur d'écran.
export function ExplicitBadge({ explicit, className = "" }: { explicit: boolean | null | undefined; className?: string }) {
  if (explicit !== true) return null;
  return (
    <span className={`explicit-badge ${className}`.trim()} role="img" aria-label="Explicit" title="Explicit">
      E
    </span>
  );
}
