// Provenance IA d'un morceau ou d'un album, telle que l'API la renvoie (voir
// API/src/lib/publicProvenance.ts) : « ai » = généré par IA, « hybrid » = assisté par IA.
// Absente ou null : pas de badge.
export type Provenance = "ai" | "hybrid";

/** Valeur reçue de l'API, sûre : tout ce qui n'est pas une provenance connue devient null. */
export function toProvenance(value: unknown): Provenance | null {
  return value === "ai" || value === "hybrid" ? value : null;
}

export function provenanceLabel(provenance: Provenance): string {
  return provenance === "ai" ? "AI-generated" : "AI-assisted";
}

export function provenanceHint(provenance: Provenance): string {
  return provenance === "ai"
    ? "Declared by the artist as generated entirely with AI."
    : "Declared by the artist as made with AI assistance.";
}
