// File d'attente du lecteur : la logique, sans React ni <audio>, pour pouvoir la
// tester (queue.test.mjs). PlayerContext s'en sert pour savoir quel morceau jouer
// ensuite ou avant.
//
// Trois sources de « suite », jouées dans cet ordre :
//  1. `future`  : les morceaux qu'on a quittés en revenant en arrière (« précédent ») ;
//  2. `manual`  : ceux que l'utilisateur a ajoutés à la main (« Play next », « Add to queue ») ;
//  3. le contexte : la liste d'où vient la lecture (un album, une playlist…), dans son
//     ordre, ou mélangée (`order`).
// `history` garde ce qui a déjà été joué pour « précédent ».
//
// Toutes les fonctions sont pures : elles renvoient une nouvelle file.

export interface Queue<T extends { id: string }> {
  /** La liste d'où vient la lecture, dans son ordre naturel. */
  context: readonly T[];
  /** Ordre de lecture du contexte : positions dans `context` (identité, ou mélange). */
  order: readonly number[];
  /** Position dans `order` du dernier morceau du contexte démarré ; -1 avant le premier. */
  cursor: number;
  /** Ajouts manuels, joués avant la suite du contexte. */
  manual: readonly T[];
  /** Morceaux quittés par « précédent » ; le dernier élément est le premier à rejouer. */
  future: readonly T[];
  /** Morceaux déjà joués ; le dernier élément est le plus récent. */
  history: readonly T[];
  current: T | null;
  shuffled: boolean;
}

export type Random = () => number;

/** Au-delà de ce temps d'écoute, « précédent » relance le morceau au lieu de reculer. */
export const RESTART_AFTER_SECONDS = 3;
/** On ne garde pas l'historique indéfiniment (une longue session d'écoute). */
export const MAX_HISTORY = 200;

type Item = { id: string };

export function emptyQueue<T extends Item>(shuffled = false): Queue<T> {
  return { context: [], order: [], cursor: -1, manual: [], future: [], history: [], current: null, shuffled };
}

function identity(length: number): number[] {
  return Array.from({ length }, (_, i) => i);
}

/** Mélange de Fisher-Yates sur une copie. `random` est injectable pour les tests. */
export function shuffleArray<T>(items: readonly T[], random: Random = Math.random): T[] {
  const copy = items.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function played<T extends Item>(queue: Queue<T>): readonly T[] {
  return queue.current ? [...queue.history, queue.current].slice(-MAX_HISTORY) : queue.history;
}

/**
 * Démarre `track` dans la liste d'où il vient. `list` absente, ou sans ce morceau : le
 * contexte ne contient que lui. Mélangé, le morceau choisi passe en premier puis le reste
 * de la liste dans le désordre. Les ajouts manuels sont conservés ; le morceau qui jouait
 * rejoint l'historique.
 */
export function startQueue<T extends Item>(
  queue: Queue<T>,
  track: T,
  list?: readonly T[],
  random: Random = Math.random
): Queue<T> {
  const found = list ? list.findIndex((item) => item.id === track.id) : -1;
  const context = list && found !== -1 ? list : [track];
  const index = found !== -1 ? found : 0;
  const order = queue.shuffled
    ? [index, ...shuffleArray(identity(context.length).filter((i) => i !== index), random)]
    : identity(context.length);
  return {
    context,
    order,
    cursor: queue.shuffled ? 0 : index,
    manual: queue.manual,
    future: [],
    // Relancer le morceau déjà en cours ne le range pas dans l'historique (il y serait en double).
    history: queue.current && queue.current.id !== track.id ? played(queue) : queue.history,
    current: context[index],
    shuffled: queue.shuffled,
  };
}

/** La suite, dans l'ordre où elle sera jouée. */
export function upcoming<T extends Item>(queue: Queue<T>): T[] {
  return [
    ...queue.future.slice().reverse(),
    ...queue.manual,
    ...queue.order.slice(queue.cursor + 1).map((i) => queue.context[i]),
  ];
}

export function hasNext(queue: Queue<Item>): boolean {
  return queue.future.length > 0 || queue.manual.length > 0 || queue.cursor + 1 < queue.order.length;
}

export function hasPrevious(queue: Queue<Item>): boolean {
  return queue.history.length > 0;
}

/** Passe au morceau suivant ; null s'il n'y en a pas. */
export function advance<T extends Item>(queue: Queue<T>): Queue<T> | null {
  if (queue.future.length > 0) {
    return {
      ...queue,
      current: queue.future[queue.future.length - 1],
      future: queue.future.slice(0, -1),
      history: played(queue),
    };
  }
  if (queue.manual.length > 0) {
    return { ...queue, current: queue.manual[0], manual: queue.manual.slice(1), history: played(queue) };
  }
  const cursor = queue.cursor + 1;
  if (cursor < queue.order.length) {
    return { ...queue, cursor, current: queue.context[queue.order[cursor]], history: played(queue) };
  }
  return null;
}

/** Revient au morceau d'avant ; null s'il n'y en a pas. Le morceau quitté se rejoue avec « suivant ». */
export function retreat<T extends Item>(queue: Queue<T>): Queue<T> | null {
  if (queue.history.length === 0) return null;
  return {
    ...queue,
    current: queue.history[queue.history.length - 1],
    history: queue.history.slice(0, -1),
    future: queue.current ? [...queue.future, queue.current] : queue.future,
  };
}

export type PreviousAction = { kind: "restart" } | { kind: "back" };

/**
 * Que fait « précédent » : comme partout, il relance le morceau en cours s'il est entamé
 * depuis plus de 3 s (ou s'il n'y a rien avant), sinon il revient au morceau d'avant.
 */
export function previousAction(queue: Queue<Item>, currentTime: number): PreviousAction {
  if (currentTime > RESTART_AFTER_SECONDS || !hasPrevious(queue)) return { kind: "restart" };
  return { kind: "back" };
}

/** « Play next » : le morceau passe devant les ajouts précédents. « Add to queue » : à la fin. */
export function enqueue<T extends Item>(queue: Queue<T>, track: T, mode: "next" | "last"): Queue<T> {
  return { ...queue, manual: mode === "next" ? [track, ...queue.manual] : [...queue.manual, track] };
}

/** Saute au k-ième morceau de la suite ; ceux qu'on enjambe rejoignent l'historique. */
export function jump<T extends Item>(queue: Queue<T>, k: number): Queue<T> | null {
  if (k < 0) return null;
  let current: Queue<T> = queue;
  for (let i = 0; i <= k; i++) {
    const next = advance(current);
    if (!next) return null;
    current = next;
  }
  return current;
}

/** Retire le k-ième morceau de la suite. */
export function removeUpcoming<T extends Item>(queue: Queue<T>, k: number): Queue<T> {
  const futureCount = queue.future.length;
  const manualCount = queue.manual.length;
  if (k < 0) return queue;
  if (k < futureCount) {
    const at = futureCount - 1 - k; // `future` est une pile : l'ordre d'affichage est inversé
    return { ...queue, future: queue.future.filter((_, i) => i !== at) };
  }
  if (k < futureCount + manualCount) {
    const at = k - futureCount;
    return { ...queue, manual: queue.manual.filter((_, i) => i !== at) };
  }
  const at = queue.cursor + 1 + (k - futureCount - manualCount);
  if (at >= queue.order.length) return queue;
  return { ...queue, order: queue.order.filter((_, i) => i !== at) };
}

/** Vide la suite : le morceau en cours est le dernier. L'historique reste. */
export function clearUpcoming<T extends Item>(queue: Queue<T>): Queue<T> {
  const kept = queue.order.slice(0, queue.cursor + 1).map((i) => queue.context[i]);
  return {
    ...queue,
    context: kept,
    order: identity(kept.length),
    cursor: kept.length - 1,
    manual: [],
    future: [],
  };
}

/**
 * Active ou coupe l'aléatoire sans toucher au morceau en cours. Activé : le dernier morceau
 * du contexte démarré passe en tête et toute la liste est mélangée derrière. Coupé : la
 * liste reprend son ordre naturel, juste après ce morceau.
 */
export function setShuffled<T extends Item>(queue: Queue<T>, on: boolean, random: Random = Math.random): Queue<T> {
  if (queue.shuffled === on) return queue;
  const at = queue.cursor >= 0 ? queue.order[queue.cursor] : -1;
  if (on) {
    const rest = shuffleArray(identity(queue.context.length).filter((i) => i !== at), random);
    return { ...queue, shuffled: true, order: at >= 0 ? [at, ...rest] : rest, cursor: at >= 0 ? 0 : -1 };
  }
  return { ...queue, shuffled: false, order: identity(queue.context.length), cursor: at };
}
