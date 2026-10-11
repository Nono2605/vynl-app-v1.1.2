import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  MAX_HISTORY,
  advance,
  clearUpcoming,
  emptyQueue,
  enqueue,
  hasNext,
  hasPrevious,
  jump,
  previousAction,
  removeUpcoming,
  retreat,
  setShuffled,
  shuffleArray,
  startQueue,
  upcoming,
} from "./queue.ts";

const t = (id) => ({ id, title: id });
const album = [t("a"), t("b"), t("c"), t("d")];
const ids = (list) => list.map((x) => x.id);
const cur = (q) => q.current?.id ?? null;

// Un « hasard » déterministe : suite de valeurs fixes en boucle.
const seq = (...values) => {
  let i = 0;
  return () => values[i++ % values.length];
};

const start = (id, shuffled = false, random) => startQueue(emptyQueue(shuffled), t(id), album, random);

describe("startQueue", () => {
  it("démarre au morceau choisi, la suite est le reste de la liste", () => {
    const q = start("b");
    assert.equal(cur(q), "b");
    assert.deepEqual(ids(upcoming(q)), ["c", "d"]);
    assert.equal(hasPrevious(q), false);
  });

  it("sans liste, ou liste qui ne contient pas le morceau : il joue seul", () => {
    assert.deepEqual(ids(upcoming(startQueue(emptyQueue(), t("x")))), []);
    const alone = startQueue(emptyQueue(), t("x"), album);
    assert.equal(cur(alone), "x");
    assert.deepEqual(ids(upcoming(alone)), []);
    assert.deepEqual(ids(upcoming(startQueue(emptyQueue(), t("x"), []))), []);
  });

  it("garde les ajouts manuels et range le morceau qui jouait dans l'historique", () => {
    let q = enqueue(start("a"), t("m"), "last");
    q = startQueue(q, t("c"), album);
    assert.equal(cur(q), "c");
    assert.deepEqual(ids(q.manual), ["m"]);
    assert.deepEqual(ids(q.history), ["a"]);
    assert.deepEqual(ids(upcoming(q)), ["m", "d"]);
  });

  it("relancer le morceau déjà en cours ne le met pas en double dans l'historique", () => {
    const q = startQueue(start("b"), t("b"), album);
    assert.deepEqual(ids(q.history), []);
    assert.equal(cur(q), "b");
  });

  it("mélangé : le morceau choisi d'abord, tout le reste derrière, une seule fois chacun", () => {
    const q = start("c", true, seq(0.3, 0.9, 0.1));
    assert.equal(cur(q), "c");
    const rest = ids(upcoming(q));
    assert.equal(rest.length, 3);
    assert.deepEqual([...rest].sort(), ["a", "b", "d"]);
  });
});

describe("advance, retreat, hasNext, hasPrevious", () => {
  it("enchaîne jusqu'au bout puis s'arrête", () => {
    let q = start("a");
    const played = [cur(q)];
    for (let n = advance(q); n; n = advance(q)) {
      q = n;
      played.push(cur(q));
    }
    assert.deepEqual(played, ["a", "b", "c", "d"]);
    assert.equal(hasNext(q), false);
    assert.equal(advance(q), null);
  });

  it("précédent puis suivant retombe sur le même morceau", () => {
    let q = advance(advance(start("a"))); // c
    const back = retreat(q);
    assert.equal(cur(back), "b");
    assert.deepEqual(ids(upcoming(back)), ["c", "d"]);
    const forward = advance(back);
    assert.equal(cur(forward), "c");
    assert.deepEqual(ids(upcoming(forward)), ["d"]);
    assert.deepEqual(ids(forward.history), ["a", "b"]);
  });

  it("reculer plusieurs fois puis avancer rejoue dans le même ordre, sans doublon", () => {
    let q = advance(advance(advance(start("a")))); // d
    q = retreat(retreat(q)); // b
    assert.equal(cur(q), "b");
    assert.deepEqual(ids(upcoming(q)), ["c", "d"]);
    q = advance(advance(q)); // d
    assert.equal(cur(q), "d");
    assert.equal(hasNext(q), false);
  });

  it("rien avant le premier morceau", () => {
    assert.equal(retreat(start("a")), null);
    assert.equal(hasPrevious(start("a")), false);
  });

  it("file vide : ni suivant ni précédent", () => {
    const q = emptyQueue();
    assert.deepEqual([hasNext(q), hasPrevious(q), advance(q), retreat(q)], [false, false, null, null]);
    assert.deepEqual(upcoming(q), []);
  });
});

describe("previousAction", () => {
  it("moins de 3 s écoulées : revient en arrière ; plus : relance le morceau", () => {
    const q = advance(start("a"));
    assert.deepEqual(previousAction(q, 1.2), { kind: "back" });
    assert.deepEqual(previousAction(q, 3), { kind: "back" });
    assert.deepEqual(previousAction(q, 3.01), { kind: "restart" });
  });

  it("au premier morceau : relance, même au tout début", () => {
    assert.deepEqual(previousAction(start("a"), 0), { kind: "restart" });
  });
});

describe("enqueue (ajouts manuels)", () => {
  it("« Add to queue » passe à la suite des ajouts, avant le reste du contexte", () => {
    let q = start("a");
    q = enqueue(q, t("x"), "last");
    q = enqueue(q, t("y"), "last");
    assert.deepEqual(ids(upcoming(q)), ["x", "y", "b", "c", "d"]);
  });

  it("« Play next » passe devant les ajouts précédents", () => {
    let q = enqueue(enqueue(start("a"), t("x"), "last"), t("y"), "next");
    assert.deepEqual(ids(upcoming(q)), ["y", "x", "b", "c", "d"]);
  });

  it("les ajouts se jouent avant la suite du contexte, qui reprend ensuite où elle en était", () => {
    let q = enqueue(start("a"), t("x"), "last");
    const played = [];
    for (let n = advance(q); n; n = advance(q)) {
      q = n;
      played.push(cur(q));
    }
    assert.deepEqual(played, ["x", "b", "c", "d"]);
  });

  it("un ajout dans une file vide devient simplement la suite", () => {
    const q = enqueue(emptyQueue(), t("x"), "last");
    assert.deepEqual(ids(upcoming(q)), ["x"]);
    assert.equal(hasNext(q), true);
  });
});

describe("jump et removeUpcoming", () => {
  it("saute au k-ième morceau de la suite ; ceux qu'on enjambe vont dans l'historique", () => {
    const q = jump(start("a"), 1); // suite : b, c, d -> c
    assert.equal(cur(q), "c");
    assert.deepEqual(ids(q.history), ["a", "b"]);
    assert.deepEqual(ids(upcoming(q)), ["d"]);
  });

  it("saute vers un ajout manuel puis continue dans le contexte", () => {
    const q = jump(enqueue(start("a"), t("x"), "last"), 0);
    assert.equal(cur(q), "x");
    assert.deepEqual(ids(upcoming(q)), ["b", "c", "d"]);
  });

  it("au-delà de la suite : rien", () => {
    assert.equal(jump(start("a"), 3), null);
    assert.equal(jump(start("a"), -1), null);
  });

  it("retire un morceau du contexte, d'un ajout manuel, ou de la pile « précédent »", () => {
    assert.deepEqual(ids(upcoming(removeUpcoming(start("a"), 1))), ["b", "d"]);

    const manual = enqueue(enqueue(start("a"), t("x"), "last"), t("y"), "last");
    assert.deepEqual(ids(upcoming(removeUpcoming(manual, 0))), ["y", "b", "c", "d"]);

    const stepped = retreat(advance(advance(start("a")))); // courant b, pile [c]
    assert.deepEqual(ids(upcoming(stepped)), ["c", "d"]);
    assert.deepEqual(ids(upcoming(removeUpcoming(stepped, 0))), ["d"]);
  });

  it("hors limites : la file ne change pas", () => {
    const q = start("a");
    assert.equal(removeUpcoming(q, 99), q);
    assert.equal(removeUpcoming(q, -1), q);
  });

  it("vider la suite : le morceau en cours est le dernier, l'historique reste", () => {
    let q = enqueue(advance(start("a")), t("x"), "last"); // courant b
    q = clearUpcoming(q);
    assert.equal(cur(q), "b");
    assert.deepEqual(ids(upcoming(q)), []);
    assert.deepEqual(ids(q.history), ["a"]);
    assert.equal(hasNext(q), false);
  });

  it("couper l'aléatoire après avoir vidé la suite ne ressuscite pas les morceaux retirés", () => {
    let q = setShuffled(start("a"), true, seq(0.5));
    q = clearUpcoming(q);
    q = setShuffled(q, false);
    assert.deepEqual(ids(upcoming(q)), []);
  });
});

describe("setShuffled", () => {
  it("activer : le morceau en cours reste, le reste de la liste est mélangé derrière", () => {
    const q = setShuffled(advance(start("a")), true, seq(0.2, 0.7, 0.4)); // courant b
    assert.equal(cur(q), "b");
    assert.equal(q.shuffled, true);
    assert.deepEqual([...ids(upcoming(q))].sort(), ["a", "c", "d"]);
    assert.equal(q.order.length, 4);
    assert.equal(q.order[q.cursor], 1); // b est le courant dans l'ordre mélangé
  });

  it("couper : l'ordre naturel reprend juste après le morceau en cours", () => {
    const shuffled = setShuffled(advance(start("a")), true, seq(0.9, 0.1));
    const natural = setShuffled(shuffled, false);
    assert.equal(cur(natural), "b");
    assert.deepEqual(ids(upcoming(natural)), ["c", "d"]);
  });

  it("sans changement de réglage, la même file est renvoyée", () => {
    const q = start("a");
    assert.equal(setShuffled(q, false), q);
  });

  it("file vide : seul le réglage change", () => {
    const q = setShuffled(emptyQueue(), true);
    assert.equal(q.shuffled, true);
    assert.deepEqual(upcoming(q), []);
  });

  it("un morceau lancé alors que l'aléatoire est actif hérite du réglage", () => {
    const q = start("c", true, seq(0.5));
    assert.equal(q.shuffled, true);
    assert.equal(cur(q), "c");
    assert.equal(upcoming(q).length, 3);
  });

  it("le mélange parcourt tous les morceaux sans répétition", () => {
    let q = start("a", true, seq(0.7, 0.2, 0.9));
    const played = [cur(q)];
    for (let n = advance(q); n; n = advance(q)) {
      q = n;
      played.push(cur(q));
    }
    assert.deepEqual([...played].sort(), ["a", "b", "c", "d"]);
    assert.equal(played[0], "a");
  });

  it("précédent en aléatoire repasse par les morceaux réellement joués", () => {
    let q = start("a", true, seq(0.6, 0.1, 0.8));
    const first = cur(q);
    q = advance(q);
    const second = cur(q);
    q = advance(q);
    assert.equal(cur(retreat(q)), second);
    assert.equal(cur(retreat(retreat(q))), first);
  });
});

describe("shuffleArray", () => {
  it("renvoie une permutation et ne modifie pas l'original", () => {
    const original = [1, 2, 3, 4, 5];
    const out = shuffleArray(original, seq(0.1, 0.8, 0.5, 0.3));
    assert.deepEqual([...out].sort(), [1, 2, 3, 4, 5]);
    assert.deepEqual(original, [1, 2, 3, 4, 5]);
  });

  it("listes vides ou d'un élément", () => {
    assert.deepEqual(shuffleArray([]), []);
    assert.deepEqual(shuffleArray([7]), [7]);
  });
});

describe("historique", () => {
  it("est plafonné", () => {
    const big = Array.from({ length: MAX_HISTORY + 50 }, (_, i) => t(`t${i}`));
    let q = startQueue(emptyQueue(), big[0], big);
    for (let i = 0; i < big.length - 1; i++) q = advance(q);
    assert.equal(q.history.length, MAX_HISTORY);
    assert.equal(cur(q), big[big.length - 1].id);
  });
});
