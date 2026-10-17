import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { provenanceHint, provenanceLabel, toProvenance } from "./provenance.ts";

describe("toProvenance", () => {
  it("garde ai et hybrid", () => {
    assert.equal(toProvenance("ai"), "ai");
    assert.equal(toProvenance("hybrid"), "hybrid");
  });

  it("tout le reste devient null : human, vide, nombre, absent", () => {
    for (const value of ["human", "", "AI", " ai", 1, true, null, undefined, {}]) {
      assert.equal(toProvenance(value), null, String(value));
    }
  });
});

describe("libellés", () => {
  it("les deux étiquettes de la charte", () => {
    assert.equal(provenanceLabel("ai"), "AI-generated");
    assert.equal(provenanceLabel("hybrid"), "AI-assisted");
  });

  it("une explication pour chacune", () => {
    assert.match(provenanceHint("ai"), /entirely with AI/);
    assert.match(provenanceHint("hybrid"), /AI assistance/);
  });
});
