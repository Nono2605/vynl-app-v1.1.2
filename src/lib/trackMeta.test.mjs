import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  artistLine,
  featuredCredits,
  otherCreditsLine,
  parseGenreParam,
  parseTagParam,
  searchHref,
  topTags,
} from "./trackMeta.ts";

const credit = (role, name, slug = null) => ({ role, name, slug });

describe("artistLine", () => {
  it("le nom seul quand il n'y a pas d'invité", () => {
    assert.equal(artistLine("Nova", []), "Nova");
    assert.equal(artistLine("Nova", undefined), "Nova");
  });

  it("ajoute les invités, dans l'ordre", () => {
    assert.equal(artistLine("Nova", [credit("featured", "Kid"), credit("featured", "Sam")]), "Nova feat. Kid, Sam");
  });

  it("n'ajoute que les invités : un producteur n'est pas dans la ligne d'artiste", () => {
    assert.equal(artistLine("Nova", [credit("producer", "Pro"), credit("featured", "Kid")]), "Nova feat. Kid");
    assert.equal(artistLine("Nova", [credit("writer", "Lou")]), "Nova");
  });

  it("au-delà de trois invités, le reste est compté", () => {
    const guests = ["A1", "B2", "C3", "D4", "E5"].map((name) => credit("featured", name));
    assert.equal(artistLine("Nova", guests), "Nova feat. A1, B2, C3 +2");
  });

  it("sans nom d'artiste : « Unknown artist », comme avant", () => {
    assert.equal(artistLine(null, []), "Unknown artist");
    assert.equal(artistLine("  ", [credit("featured", "Kid")]), "Unknown artist feat. Kid");
  });
});

describe("featuredCredits", () => {
  it("ne garde que les invités", () => {
    assert.deepEqual(
      featuredCredits([credit("producer", "Pro"), credit("featured", "Kid")]).map((c) => c.name),
      ["Kid"]
    );
    assert.deepEqual(featuredCredits(undefined), []);
  });
});

describe("otherCreditsLine", () => {
  it("un libellé par rôle", () => {
    assert.equal(
      otherCreditsLine([credit("producer", "Sam"), credit("writer", "Lou"), credit("producer", "Max")]),
      "Produced by Sam, Max · Written by Lou"
    );
  });

  it("les invités et les rôles inconnus n'y sont pas ; vide sinon", () => {
    assert.equal(otherCreditsLine([credit("featured", "Kid"), credit("dj", "X")]), "");
    assert.equal(otherCreditsLine(undefined), "");
  });
});

describe("topTags", () => {
  it("les styles les plus fréquents d'abord", () => {
    const tags = topTags([{ tags: ["dark", "late night"] }, { tags: ["late night"] }, { tags: ["dark", "calm"] }, {}]);
    assert.deepEqual(tags, ["dark", "late night", "calm"]);
  });

  it("borne le nombre de styles", () => {
    assert.equal(topTags([{ tags: ["a1", "b2", "c3"] }], 2).length, 2);
    assert.deepEqual(topTags([]), []);
  });
});

describe("parseGenreParam et parseTagParam", () => {
  it("un genre est un code de la liste fermée", () => {
    assert.equal(parseGenreParam("hip_hop_rap"), "hip_hop_rap");
    assert.equal(parseGenreParam("Hip Hop"), null);
    assert.equal(parseGenreParam(["pop"]), null);
    assert.equal(parseGenreParam(undefined), null);
  });

  it("un style est mis en forme comme à l'API", () => {
    assert.equal(parseTagParam(" #Late   Night "), "late night");
    assert.equal(parseTagParam("<b>"), null);
    assert.equal(parseTagParam(undefined), null);
  });
});

describe("searchHref", () => {
  it("construit l'adresse de recherche, avec ce qu'il faut échapper", () => {
    assert.equal(searchHref({}), "/search");
    assert.equal(searchHref({ genre: "pop" }), "/search?genre=pop");
    assert.equal(searchHref({ tag: "late night" }), "/search?tag=late+night");
    assert.equal(searchHref({ q: "a&b", genre: "pop" }), "/search?q=a%26b&genre=pop");
  });
});
