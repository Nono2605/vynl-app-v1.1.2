import { NextResponse } from "next/server";
import { POLICY_COOKIE, safeNext } from "@/lib/privacyGate";
import { POLICY_COOKIE_OPTIONS, loadPrivacyState, policyVersion } from "@/lib/privacy";
import { createClient } from "@/lib/supabase/server";

// Pose le cookie « version acceptée » pour un compte dont l'API confirme l'acceptation (par
// exemple faite sur un autre appareil). Sans cette vérification, il suffirait d'ouvrir cette
// adresse pour contourner l'écran d'accueil.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const next = safeNext(url.searchParams.get("next"));
  const version = policyVersion();
  if (!version) return NextResponse.redirect(new URL(next, url));

  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return NextResponse.redirect(new URL("/login", url));

  const result = await loadPrivacyState(session.access_token, version);
  if ("unavailable" in result || result.state.needs_acceptance) {
    return NextResponse.redirect(new URL(`/welcome?next=${encodeURIComponent(next)}`, url));
  }

  const response = NextResponse.redirect(new URL(next, url));
  response.cookies.set(POLICY_COOKIE, version, POLICY_COOKIE_OPTIONS);
  return response;
}
