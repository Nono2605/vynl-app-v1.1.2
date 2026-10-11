import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { splitMatch } from "./searchMatch.ts";

describe("splitMatch", () => {
  it("marque la première occurrence, sans tenir compte de la casse", () => {
    assert.deepEqual(splitMatch("Night Drive", "drive"), [
      { text: "Night ", match: false },
      { text: "Drive", match: true },
    ]);
  });

  it("garde la casse du texte d'origine", () => {
    assert.equal(splitMatch("MARA vance", "ra").find((p) => p.match).text, "RA");
  });

  it("occurrence au début, au milieu, à la fin, ou le texte entier", () => {
    assert.deepEqual(splitMatch("Low Tide", "low").map((p) => p.text), ["Low", " Tide"]);
    assert.deepEqual(splitMatch("Low Tide", "w T").map((p) => p.text), ["Lo", "w T", "ide"]);
    assert.deepEqual(splitMatch("Low Tide", "tide").map((p) => p.text), ["Low ", "Tide"]);
    assert.deepEqual(splitMatch("Aube", "aube"), [{ text: "Aube", match: true }]);
  });

  it("sans occurrence ou sans recherche : un seul morceau, rien de marqué", () => {
    assert.deepEqual(splitMatch("Night Drive", "xyz"), [{ text: "Night Drive", match: false }]);
    assert.deepEqual(splitMatch("Night Drive", ""), [{ text: "Night Drive", match: false }]);
    assert.deepEqual(splitMatch("Night Drive", "   "), [{ text: "Night Drive", match: false }]);
  });

  it("ignore les espaces autour de la recherche", () => {
    assert.deepEqual(splitMatch("Night Drive", "  night "), [
      { text: "Night", match: true },
      { text: " Drive", match: false },
    ]);
  });

  it("ne casse pas sur un texte dont la mise en minuscules change la longueur", () => {
    assert.deepEqual(splitMatch("İstanbul", "stan"), [{ text: "İstanbul", match: false }]);
  });

  it("les caractères spéciaux sont du texte, pas une expression régulière", () => {
    assert.deepEqual(splitMatch("100% (live)", "(live)").map((p) => p.text), ["100% ", "(live)"]);
    assert.equal(splitMatch("a.b", ".").find((p) => p.match).text, ".");
  });
});
