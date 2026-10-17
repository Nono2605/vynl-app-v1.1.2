import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { MAX_SKIPS, isSkippable, shouldSkip, skipMessage } from "./skip.ts";

describe("isSkippable", () => {
  it("saute ce qui tient au morceau", () => {
    assert.equal(isSkippable("not_found"), true);
    assert.equal(isSkippable("explicit_blocked"), true);
  });

  it("ne saute pas une session expirée ni une API injoignable", () => {
    assert.equal(isSkippable("unauthenticated"), false);
    assert.equal(isSkippable("unavailable"), false);
  });
});

describe("shouldSkip", () => {
  it("saute tant que la série n'a pas atteint le plafond", () => {
    for (let streak = 0; streak < MAX_SKIPS; streak++) assert.equal(shouldSkip("not_found", streak), true);
    assert.equal(shouldSkip("not_found", MAX_SKIPS), false);
  });

  it("jamais pour un échec qui n'est pas lié au morceau", () => {
    assert.equal(shouldSkip("unavailable", 0), false);
  });
});

describe("skipMessage", () => {
  it("dit pourquoi le morceau est sauté", () => {
    assert.match(skipMessage("Night Drive", "explicit_blocked"), /Night Drive.*explicit/);
    assert.match(skipMessage("Night Drive", "not_found"), /Night Drive.*no longer available/);
  });
});
