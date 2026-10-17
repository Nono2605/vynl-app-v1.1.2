import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { LIBRARY_PAGE_SIZE, libraryItems, mayHaveMore } from "./libraryItems.ts";

describe("libraryItems", () => {
  it("ignore les lignes dont l'élément n'est plus disponible", () => {
    const rows = [{ item: { id: "a" } }, { item: null }, { item: { id: "b" } }];
    assert.deepEqual(libraryItems(rows), [{ id: "a" }, { id: "b" }]);
  });

  it("une page vide donne une liste vide", () => {
    assert.deepEqual(libraryItems([]), []);
  });
});

describe("mayHaveMore", () => {
  it("vrai seulement quand la page est pleine", () => {
    assert.equal(mayHaveMore(LIBRARY_PAGE_SIZE), true);
    assert.equal(mayHaveMore(LIBRARY_PAGE_SIZE - 1), false);
    assert.equal(mayHaveMore(0), false);
  });
});
