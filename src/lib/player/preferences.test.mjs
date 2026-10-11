import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseVolume } from "./preferences.ts";

describe("parseVolume", () => {
  it("lit un volume valide", () => {
    assert.equal(parseVolume("0.35"), 0.35);
    assert.equal(parseVolume("0"), 0);
    assert.equal(parseVolume("1"), 1);
  });

  it("absent ou illisible : plein volume", () => {
    for (const raw of [null, "", "  ", "abc", "NaN", "Infinity"]) assert.equal(parseVolume(raw), 1, String(raw));
  });

  it("borne entre 0 et 1", () => {
    assert.equal(parseVolume("7"), 1);
    assert.equal(parseVolume("-2"), 0);
  });
});
