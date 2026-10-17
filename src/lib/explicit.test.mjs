import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { withExplicitFilter } from "./explicit.ts";

describe("withExplicitFilter", () => {
  it("contenu explicite accepté : la requête ne change pas", () => {
    assert.equal(withExplicitFilter("limit=12", true), "limit=12");
    assert.equal(withExplicitFilter("", true), "");
  });

  it("contenu explicite refusé : on demande à l'API de l'écarter", () => {
    assert.equal(withExplicitFilter("limit=12", false), "limit=12&explicit=false");
    assert.equal(withExplicitFilter("limit=24&q=blue", false), "limit=24&q=blue&explicit=false");
    assert.equal(withExplicitFilter("", false), "explicit=false");
  });
});
