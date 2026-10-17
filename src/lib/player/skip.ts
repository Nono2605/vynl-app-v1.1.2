// Quand un morceau de la file ne peut pas être joué (retiré du catalogue, ou explicite alors que
// l'auditeur l'a refusé), le lecteur passe au suivant au lieu de s'arrêter. Pur et sans React
// pour être testé (skip.test.mjs).

import type { PlayFailure } from "@/lib/player/types";

/** Au plus autant de morceaux sautés d'affilée : une file entière illisible ne se vide pas en silence. */
export const MAX_SKIPS = 3;

/** Les échecs qui valent un saut : ceux qui tiennent au morceau, pas à la session ni au réseau. */
export function isSkippable(reason: PlayFailure): boolean {
  return reason === "not_found" || reason === "explicit_blocked";
}

/** Saute-t-on ce morceau ? `streak` : combien de morceaux ont déjà été sautés d'affilée. */
export function shouldSkip(reason: PlayFailure, streak: number): boolean {
  return isSkippable(reason) && streak < MAX_SKIPS;
}

/** Le petit message affiché quand un morceau est sauté. */
export function skipMessage(title: string, reason: PlayFailure): string {
  return reason === "explicit_blocked"
    ? `Skipped “${title}”: explicit content is turned off`
    : `Skipped “${title}”: no longer available`;
}
