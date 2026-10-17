import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { formatFollowers } from "./formatFollowers.ts";

describe("formatFollowers", () => {
  it("accorde le mot au nombre", () => {
    assert.equal(formatFollowers(0), "0 followers");
    assert.equal(formatFollowers(1), "1 follower");
    assert.equal(formatFollowers(12), "12 followers");
  });

  it("garde le nombre exact sous 1 000, puis l'abrège", () => {
    assert.equal(formatFollowers(999), "999 followers");
    assert.equal(formatFollowers(1000), "1K followers");
    assert.equal(formatFollowers(1500), "1.5K followers");
    assert.equal(formatFollowers(2_300_000), "2.3M followers");
  });

  it("une valeur invalide ou négative donne zéro", () => {
    assert.equal(formatFollowers(-4), "0 followers");
    assert.equal(formatFollowers(Number.NaN), "0 followers");
  });
});
