// Écran d'accueil « âge + conditions » : quand faut-il y envoyer un visiteur connecté ?
// Logique PURE (aucun import, aucune variable d'environnement) pour être testée seule ;
// le middleware (src/middleware.ts) l'appelle.
//
// Le cookie ne prouve rien : c'est un simple « cette version a été acceptée sur cet
// appareil », posé uniquement après vérification auprès de l'API (voir /welcome/ok). La
// preuve, c'est la table `consents` de l'API.

export const POLICY_COOKIE = "vynl_policy";

// Même forme que l'API (lib/consents.ts, VERSION_PATTERN) : une étiquette sûre.
const VERSION_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,39}$/;

export function isValidVersion(version: string | undefined): version is string {
  return typeof version === "string" && VERSION_PATTERN.test(version);
}

// Pages qui ne passent jamais par l'écran d'accueil : l'écran lui-même, la connexion et
// l'inscription, la page « Privacy & data » (on doit pouvoir lire ses droits avant d'accepter)
// et les routes d'API internes (lecteur : fermeture de lecture, recherche).
const EXEMPT_PREFIXES = ["/welcome", "/login", "/signup", "/account/privacy", "/api/"];

export function isGateExempt(pathname: string): boolean {
  return EXEMPT_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(prefix.endsWith("/") ? prefix : `${prefix}/`));
}

export interface GateInput {
  // Interrupteur : tant qu'il est « on », rien n'est demandé à personne.
  enabled: boolean;
  version: string | undefined;
  hasUser: boolean;
  method: string;
  pathname: string;
  search: string;
  cookieValue: string | undefined;
}

// L'adresse vers laquelle renvoyer, ou null si on laisse passer.
//  * Interrupteur éteint ou version invalide : on laisse passer (une mauvaise configuration ne
//    doit jamais enfermer tout le monde dehors).
//  * Seulement les navigations GET : un envoi de formulaire (déconnexion, lecture…) n'est
//    jamais détourné.
export function gateRedirect(input: GateInput): string | null {
  if (!input.enabled || !isValidVersion(input.version)) return null;
  if (!input.hasUser || input.method !== "GET") return null;
  if (isGateExempt(input.pathname)) return null;
  if (input.cookieValue === input.version) return null;

  return `/welcome?next=${encodeURIComponent(input.pathname + input.search)}`;
}

// Où retourner après l'écran d'accueil. Uniquement un chemin du site : jamais une adresse
// complète, ni « //evil.com », ni un chemin avec un antislash (redirection ouverte).
export function safeNext(raw: string | null | undefined): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\")) return "/";
  // Pas de retour vers l'écran d'accueil lui-même (boucle).
  if (raw === "/welcome" || raw.startsWith("/welcome/") || raw.startsWith("/welcome?")) return "/";
  return raw;
}
