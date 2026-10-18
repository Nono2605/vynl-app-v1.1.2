import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { formatCount, likesLabel } from "./formatCount.ts";

describe("formatCount", () => {
  it("garde le nombre exact sous 1 000, puis l'abrège", () => {
    assert.equal(formatCount(0), "0");
    assert.equal(formatCount(999), "999");
    assert.equal(formatCount(1000), "1K");
    assert.equal(formatCount(1500), "1.5K");
    assert.equal(formatCount(2_300_000), "2.3M");
  });

  it("une valeur invalide ou négative donne 0", () => {
    assert.equal(formatCount(-3), "0");
    assert.equal(formatCount(Number.NaN), "0");
  });
});

describe("likesLabel", () => {
  it("accorde le mot au nombre exact", () => {
    assert.equal(likesLabel(0), "0 likes");
    assert.equal(likesLabel(1), "1 like");
    assert.equal(likesLabel(1500), "1500 likes");
  });
});
