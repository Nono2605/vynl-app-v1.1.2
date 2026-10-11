import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { gateRedirect, isGateExempt, isValidVersion, safeNext } from "./privacyGate.ts";

const base = {
  enabled: true,
  version: "2026-10",
  hasUser: true,
  method: "GET",
  pathname: "/discover",
  search: "",
  cookieValue: undefined,
};

describe("gateRedirect", () => {
  it("connecté sans cookie : renvoi vers l'écran d'accueil, avec la page demandée", () => {
    assert.equal(gateRedirect(base), "/welcome?next=%2Fdiscover");
    assert.equal(gateRedirect({ ...base, pathname: "/search", search: "?q=a b" }), "/welcome?next=%2Fsearch%3Fq%3Da%20b");
  });

  it("cookie à jour : on laisse passer", () => {
    assert.equal(gateRedirect({ ...base, cookieValue: "2026-10" }), null);
  });

  it("nouvelle version du texte : le vieux cookie ne suffit plus", () => {
    assert.equal(gateRedirect({ ...base, cookieValue: "2026-09" }), "/welcome?next=%2Fdiscover");
  });

  it("interrupteur éteint : jamais de redirection", () => {
    assert.equal(gateRedirect({ ...base, enabled: false }), null);
  });

  it("version absente ou invalide : on laisse passer plutôt que d'enfermer tout le monde", () => {
    assert.equal(gateRedirect({ ...base, version: undefined }), null);
    assert.equal(gateRedirect({ ...base, version: "" }), null);
    assert.equal(gateRedirect({ ...base, version: "a b" }), null);
  });

  it("visiteur non connecté : rien (c'est la connexion qui s'en charge)", () => {
    assert.equal(gateRedirect({ ...base, hasUser: false }), null);
  });

  it("seulement les navigations GET : un envoi de formulaire n'est jamais détourné", () => {
    assert.equal(gateRedirect({ ...base, method: "POST" }), null);
    assert.equal(gateRedirect({ ...base, method: "HEAD" }), null);
  });

  it("les pages exemptées ne sont jamais détournées", () => {
    for (const pathname of ["/welcome", "/welcome/ok", "/login", "/signup", "/account/privacy", "/api/plays/close", "/api/search"]) {
      assert.equal(gateRedirect({ ...base, pathname }), null, pathname);
    }
  });
});

describe("isGateExempt", () => {
  it("préfixes exacts, pas de faux positifs sur un nom qui commence pareil", () => {
    assert.equal(isGateExempt("/welcome"), true);
    assert.equal(isGateExempt("/welcomes"), false);
    assert.equal(isGateExempt("/login-help"), false);
    assert.equal(isGateExempt("/account"), false);
    assert.equal(isGateExempt("/account/privacy"), true);
    assert.equal(isGateExempt("/account/privacy/export"), true);
    assert.equal(isGateExempt("/apiary"), false);
    assert.equal(isGateExempt("/api/anything"), true);
  });
});

describe("safeNext", () => {
  it("un chemin du site est conservé, avec sa requête", () => {
    assert.equal(safeNext("/discover"), "/discover");
    assert.equal(safeNext("/search?q=rock"), "/search?q=rock");
    assert.equal(safeNext("/albums/123"), "/albums/123");
  });

  it("redirection ouverte refusée", () => {
    for (const bad of ["https://evil.com", "//evil.com", "/\\evil.com", "javascript:alert(1)", "evil.com", "", null, undefined]) {
      assert.equal(safeNext(bad), "/", String(bad));
    }
  });

  it("jamais de retour vers l'écran d'accueil lui-même (boucle)", () => {
    assert.equal(safeNext("/welcome"), "/");
    assert.equal(safeNext("/welcome/ok"), "/");
    assert.equal(safeNext("/welcome?next=/x"), "/");
  });
});

describe("isValidVersion", () => {
  it("étiquettes sûres seulement", () => {
    assert.equal(isValidVersion("2026-10"), true);
    assert.equal(isValidVersion("2026-10-draft"), true);
    assert.equal(isValidVersion("v1.2_a"), true);
    assert.equal(isValidVersion("x".repeat(41)), false);
    assert.equal(isValidVersion("<b>"), false);
    assert.equal(isValidVersion(undefined), false);
  });
});
