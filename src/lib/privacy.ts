import { api, ApiError } from "@/lib/api";
import { isValidVersion } from "@/lib/privacyGate";

// Ce que l'API répond à GET /me/privacy (API/src/lib/consents.ts, PrivacyState).
export interface PrivacyState {
  policy_version: string;
  min_age: number;
  needs_acceptance: boolean;
  terms_accepted_at: string | null;
  age_confirmed: boolean;
  choices: { purpose: string; granted: boolean | null }[];
}

// Version du texte (politique + conditions) que l'app affiche : une étiquette choisie par
// l'équipe, ex. « 2026-10 ». Tant qu'elle n'est pas définie, l'écran d'accueil n'existe pas.
export function policyVersion(): string | null {
  const version = process.env.PRIVACY_POLICY_VERSION;
  return isValidVersion(version) ? version : null;
}

// Interrupteur : « on » pour exiger l'écran d'accueil (âge + conditions) de tout le monde.
// À n'activer qu'une fois la politique PUBLIÉE : l'écran renvoie vers elle.
export function gateEnabled(): boolean {
  return process.env.PRIVACY_GATE === "on";
}

export function privacyLinks() {
  return {
    policy: process.env.PRIVACY_POLICY_URL || null,
    terms: process.env.TERMS_URL || null,
    contact: process.env.PRIVACY_CONTACT_EMAIL || null,
  };
}

// Options du cookie « version acceptée » : illisible par le navigateur, un an.
export const POLICY_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
};

// L'état de vie privée du compte. « unavailable » : le service n'est pas prêt côté API
// (migration pas appliquée) : on le dit, on ne plante pas.
export async function loadPrivacyState(
  accessToken: string,
  version: string
): Promise<{ state: PrivacyState } | { unavailable: true }> {
  try {
    return { state: await api.get<PrivacyState>(`/me/privacy?version=${encodeURIComponent(version)}`, { accessToken }) };
  } catch (error) {
    // 503 : migration pas appliquée. 404 : l'API déployée n'a pas encore ces routes. Dans les
    // deux cas le service n'est « pas prêt », ce qui ne doit jamais faire planter une page.
    if (error instanceof ApiError && (error.status === 503 || error.status === 404)) return { unavailable: true };
    throw error;
  }
}
