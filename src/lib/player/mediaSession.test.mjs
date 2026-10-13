import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { FALLBACK_ARTWORK, MEDIA_ALBUM, absoluteHttpUrl, mediaMetadataInit, positionStateInit } from "./mediaSession.ts";

const base = "https://vynl.example/discover";

describe("absoluteHttpUrl", () => {
  it("garde une URL http(s) absolue, résout une URL relative", () => {
    assert.equal(absoluteHttpUrl("https://cdn.example/c.jpg", base), "https://cdn.example/c.jpg");
    assert.equal(absoluteHttpUrl("http://cdn.example/c.jpg", base), "http://cdn.example/c.jpg");
    assert.equal(absoluteHttpUrl("/img/c.png", base), "https://vynl.example/img/c.png");
  });

  it("refuse le reste : vide, data:, javascript:, texte illisible", () => {
    for (const bad of [null, undefined, "", "data:image/png;base64,AAAA", "javascript:alert(1)", "blob:https://x/1"]) {
      assert.equal(absoluteHttpUrl(bad, base), null, String(bad));
    }
    assert.equal(absoluteHttpUrl("http://", base), null);
  });
});

describe("mediaMetadataInit", () => {
  it("titre, artiste, album « Vynl » et la pochette du morceau", () => {
    const init = mediaMetadataInit(
      { title: "Hybrid-e", artistName: "RAFALE", coverUrl: "https://cdn.example/rafale.jpg" },
      base
    );
    assert.equal(init.title, "Hybrid-e");
    assert.equal(init.artist, "RAFALE");
    assert.equal(init.album, MEDIA_ALBUM);
    assert.deepEqual(init.artwork, [{ src: "https://cdn.example/rafale.jpg", sizes: "512x512" }]);
  });

  it("sans pochette, ou avec une pochette inutilisable : le vinyle par défaut, en URL absolue", () => {
    const expected = [{ src: new URL(FALLBACK_ARTWORK, base).href, sizes: "512x512" }];
    assert.deepEqual(mediaMetadataInit({ title: "a", artistName: "b", coverUrl: null }, base).artwork, expected);
    assert.deepEqual(mediaMetadataInit({ title: "a", artistName: "b", coverUrl: "data:image/svg+xml,xx" }, base).artwork, expected);
    assert.equal(expected[0].src, "https://vynl.example/brand/vynl-cover-512.png");
  });
});

describe("positionStateInit", () => {
  it("durée, position et vitesse valides", () => {
    assert.deepEqual(positionStateInit(213, 100.5), { duration: 213, position: 100.5, playbackRate: 1 });
  });

  it("une position au-delà de la durée est ramenée à la durée", () => {
    assert.equal(positionStateInit(10, 12).position, 10);
  });

  it("durée inconnue, infinie ou nulle : rien à envoyer", () => {
    for (const duration of [NaN, Infinity, 0, -5]) assert.equal(positionStateInit(duration, 3), null, String(duration));
  });

  it("position illisible ou négative : rien à envoyer", () => {
    for (const position of [NaN, -1, Infinity]) assert.equal(positionStateInit(100, position), null, String(position));
  });

  it("vitesse invalide : 1", () => {
    assert.equal(positionStateInit(100, 1, 0).playbackRate, 1);
    assert.equal(positionStateInit(100, 1, NaN).playbackRate, 1);
    assert.equal(positionStateInit(100, 1, 1.5).playbackRate, 1.5);
  });
});
