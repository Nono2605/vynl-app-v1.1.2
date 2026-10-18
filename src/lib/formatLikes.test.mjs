import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { formatLikes, likesLabel } from "./formatLikes.ts";

describe("formatLikes", () => {
  it("garde le nombre exact sous 1 000", () => {
    assert.equal(formatLikes(0), "0");
    assert.equal(formatLikes(1), "1");
    assert.equal(formatLikes(999), "999");
  });

  it("passe par paliers d'une puissance de dix, avec un « + »", () => {
    assert.equal(formatLikes(1000), "1k+");
    assert.equal(formatLikes(9999), "1k+");
    assert.equal(formatLikes(10_000), "10k+");
    assert.equal(formatLikes(99_999), "10k+");
    assert.equal(formatLikes(100_000), "100k+");
    assert.equal(formatLikes(999_999), "100k+");
  });

  it("continue avec les millions et au-delà", () => {
    assert.equal(formatLikes(1_000_000), "1M+");
    assert.equal(formatLikes(12_500_000), "10M+");
    assert.equal(formatLikes(250_000_000), "100M+");
    assert.equal(formatLikes(1_000_000_000), "1B+");
  });

  it("une valeur invalide ou négative donne 0", () => {
    assert.equal(formatLikes(-3), "0");
    assert.equal(formatLikes(Number.NaN), "0");
    assert.equal(formatLikes(Number.POSITIVE_INFINITY), "0");
  });
});

describe("likesLabel", () => {
  it("accorde le mot au nombre", () => {
    assert.equal(likesLabel(0), "0 likes");
    assert.equal(likesLabel(1), "1 like");
    assert.equal(likesLabel(12), "12 likes");
  });

  it("suit les mêmes paliers que l'affichage, sans révéler le nombre exact", () => {
    assert.equal(likesLabel(1500), "1k+ likes");
    assert.equal(likesLabel(250_000), "100k+ likes");
    assert.equal(likesLabel(3_000_000), "1M+ likes");
  });
});
