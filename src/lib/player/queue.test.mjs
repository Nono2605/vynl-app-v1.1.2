import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  EMPTY_QUEUE,
  hasNext,
  hasPrevious,
  moveTo,
  nextIndex,
  previousAction,
  startQueue,
} from "./queue.ts";

const t = (id) => ({ id, title: id });
const album = [t("a"), t("b"), t("c")];

describe("startQueue", () => {
  it("démarre au morceau choisi dans la liste", () => {
    const q = startQueue(t("b"), album);
    assert.equal(q.index, 1);
    assert.equal(q.items.length, 3);
  });

  it("sans liste : la file ne contient que ce morceau", () => {
    const q = startQueue(t("x"));
    assert.deepEqual(q.items.map((i) => i.id), ["x"]);
    assert.equal(q.index, 0);
  });

  it("liste qui ne contient pas le morceau : on ne joue pas une file qui l'ignore", () => {
    const q = startQueue(t("x"), album);
    assert.deepEqual(q.items.map((i) => i.id), ["x"]);
    assert.equal(q.index, 0);
  });

  it("liste vide : seulement ce morceau", () => {
    assert.deepEqual(startQueue(t("x"), []).items.map((i) => i.id), ["x"]);
  });
});

describe("suivant et précédent disponibles", () => {
  it("file vide : rien", () => {
    assert.equal(hasNext(EMPTY_QUEUE), false);
    assert.equal(hasPrevious(EMPTY_QUEUE), false);
    assert.equal(nextIndex(EMPTY_QUEUE), null);
  });

  it("premier, milieu, dernier", () => {
    const first = startQueue(t("a"), album);
    const middle = startQueue(t("b"), album);
    const last = startQueue(t("c"), album);
    assert.deepEqual([hasPrevious(first), hasNext(first)], [false, true]);
    assert.deepEqual([hasPrevious(middle), hasNext(middle)], [true, true]);
    assert.deepEqual([hasPrevious(last), hasNext(last)], [true, false]);
  });

  it("nextIndex : le suivant, ou null en fin de file", () => {
    assert.equal(nextIndex(startQueue(t("a"), album)), 1);
    assert.equal(nextIndex(startQueue(t("c"), album)), null);
  });

  it("un seul morceau : ni suivant ni précédent", () => {
    const q = startQueue(t("x"));
    assert.deepEqual([hasPrevious(q), hasNext(q)], [false, false]);
  });
});

describe("previousAction", () => {
  it("moins de 3 s écoulées : recule d'un cran", () => {
    assert.deepEqual(previousAction(startQueue(t("b"), album), 1.2), { kind: "goto", index: 0 });
    assert.deepEqual(previousAction(startQueue(t("c"), album), 3), { kind: "goto", index: 1 });
  });

  it("plus de 3 s écoulées : relance le morceau en cours", () => {
    assert.deepEqual(previousAction(startQueue(t("b"), album), 3.01), { kind: "restart" });
    assert.deepEqual(previousAction(startQueue(t("b"), album), 120), { kind: "restart" });
  });

  it("au premier morceau : relance, même au tout début", () => {
    assert.deepEqual(previousAction(startQueue(t("a"), album), 0), { kind: "restart" });
  });
});

describe("moveTo", () => {
  it("change la position sans toucher à la liste", () => {
    const q = startQueue(t("a"), album);
    const moved = moveTo(q, 2);
    assert.equal(moved.index, 2);
    assert.equal(moved.items, q.items);
    assert.equal(q.index, 0);
  });

  it("enchaîner jusqu'au bout : la file s'arrête à la fin", () => {
    let q = startQueue(t("a"), album);
    const played = [q.items[q.index].id];
    for (let next = nextIndex(q); next !== null; next = nextIndex(q)) {
      q = moveTo(q, next);
      played.push(q.items[q.index].id);
    }
    assert.deepEqual(played, ["a", "b", "c"]);
    assert.equal(hasNext(q), false);
  });
});
