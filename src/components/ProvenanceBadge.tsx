import { provenanceHint, provenanceLabel, toProvenance } from "@/lib/provenance";

// Étiquette de provenance IA d'un morceau ou d'un album : « AI-generated » (cyan) ou
// « AI-assisted » (azur clair). Rien du tout sans provenance connue. Le texte est visible
// (pas seulement une couleur) ; `title` donne l'explication au survol.
export function ProvenanceBadge({
  provenance,
  size = "sm",
  className = "",
}: {
  provenance: unknown;
  size?: "sm" | "md";
  className?: string;
}) {
  const value = toProvenance(provenance);
  if (!value) return null;
  const classes = ["badge", value === "ai" ? "badge--ai" : "badge--assist", size === "sm" ? "badge--sm" : "", className]
    .filter(Boolean)
    .join(" ");
  return (
    <span className={classes} title={provenanceHint(value)}>
      {provenanceLabel(value)}
    </span>
  );
}
