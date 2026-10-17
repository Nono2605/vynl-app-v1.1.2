import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { MAX_FAVORITE_GENRES, parseFavoriteGenres, selectedGenreCodes } from "./genres.ts";

const options = [
  { code: "house", label: "House" },
  { code: "hip_hop", label: "Hip-Hop" },
  { code: "jazz", label: "Jazz" },
];

describe("selectedGenreCodes", () => {
  it("reconnaît les codes enregistrés", () => {
    assert.deepEqual([...selectedGenreCodes(["house", "jazz"], options)], ["house", "jazz"]);
  });

  it("reprend les anciennes valeurs libres qui correspondent au nom d'un genre", () => {
    assert.deepEqual([...selectedGenreCodes(["House", " hip-hop "], options)], ["house", "hip_hop"]);
  });

  it("ignore ce qui n'est pas dans la liste", () => {
    assert.deepEqual([...selectedGenreCodes(["polka", ""], options)], []);
  });
});

describe("parseFavoriteGenres", () => {
  it("garde les cases cochées valides, sans doublon", () => {
    assert.deepEqual(parseFavoriteGenres(["house", "house", "jazz"], ""), ["house", "jazz"]);
  });

  it("écarte une valeur cochée qui n'a pas la forme d'un code", () => {
    assert.deepEqual(parseFavoriteGenres(["House!", "../x", "jazz"], ""), ["jazz"]);
  });

  it("le champ libre de secours est découpé à la virgule", () => {
    assert.deepEqual(parseFavoriteGenres([], " House, Jazz ,, "), ["House", "Jazz"]);
  });

  it("plafonne le nombre de genres", () => {
    const many = Array.from({ length: 40 }, (_, i) => `genre_${i}`);
    assert.equal(parseFavoriteGenres(many, "").length, MAX_FAVORITE_GENRES);
  });
});
