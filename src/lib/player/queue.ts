// File d'attente du lecteur : la logique, sans React ni <audio>, pour pouvoir la
// tester (queue.test.mjs). PlayerContext s'en sert pour savoir quel morceau jouer
// ensuite, ou avant.

export interface Queue<T extends { id: string }> {
  items: readonly T[];
  /** Position du morceau en cours dans `items` ; -1 pour une file vide. */
  index: number;
}

export const EMPTY_QUEUE: Queue<never> = { items: [], index: -1 };

/** Au-delà de ce temps d'écoute, « précédent » relance le morceau au lieu de reculer. */
export const RESTART_AFTER_SECONDS = 3;

/**
 * File démarrée sur `current`. `list` est la liste d'où vient la lecture (un album,
 * une playlist…) ; absente, ou sans `current`, la file ne contient que ce morceau.
 */
export function startQueue<T extends { id: string }>(current: T, list?: readonly T[]): Queue<T> {
  const index = list ? list.findIndex((item) => item.id === current.id) : -1;
  return list && index !== -1 ? { items: list, index } : { items: [current], index: 0 };
}

export function moveTo<T extends { id: string }>(queue: Queue<T>, index: number): Queue<T> {
  return { items: queue.items, index };
}

export function hasNext(queue: Queue<{ id: string }>): boolean {
  return queue.index >= 0 && queue.index < queue.items.length - 1;
}

export function hasPrevious(queue: Queue<{ id: string }>): boolean {
  return queue.index > 0;
}

/** Position du morceau suivant, ou null en fin de file. */
export function nextIndex(queue: Queue<{ id: string }>): number | null {
  return hasNext(queue) ? queue.index + 1 : null;
}

export type PreviousAction = { kind: "restart" } | { kind: "goto"; index: number };

/**
 * Que fait « précédent » : comme partout, il relance le morceau en cours s'il est
 * entamé depuis plus de 3 s (ou s'il n'y a rien avant), sinon il recule d'un cran.
 */
export function previousAction(queue: Queue<{ id: string }>, currentTime: number): PreviousAction {
  if (currentTime > RESTART_AFTER_SECONDS || !hasPrevious(queue)) return { kind: "restart" };
  return { kind: "goto", index: queue.index - 1 };
}
