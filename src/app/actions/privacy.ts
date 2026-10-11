"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ApiError, api } from "@/lib/api";
import { POLICY_COOKIE, safeNext } from "@/lib/privacyGate";
import { POLICY_COOKIE_OPTIONS, policyVersion, type PrivacyState } from "@/lib/privacy";
import { createClient } from "@/lib/supabase/server";

export interface PrivacyFormState {
  error?: string;
  message?: string;
}

async function accessToken(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) redirect("/login");
  return session.access_token;
}

function explain(error: unknown): string {
  if (error instanceof ApiError) {
    return error.status === 503 ? "This is not available yet. Please try again later." : error.message;
  }
  throw error;
}

// Écran d'accueil : l'âge et les conditions. Les deux cases sont revérifiées ICI (le
// navigateur ne suffit pas), l'API enregistre la décision, et seulement ensuite on pose le
// cookie « version acceptée » et on renvoie où le visiteur allait.
export async function acceptPrivacy(
  _state: PrivacyFormState | undefined,
  formData: FormData
): Promise<PrivacyFormState> {
  const version = policyVersion();
  if (!version) redirect("/");

  const next = safeNext(String(formData.get("next") ?? ""));
  if (formData.get("age") !== "on" || formData.get("terms") !== "on") {
    return { error: "Please tick both boxes to continue." };
  }

  const token = await accessToken();
  try {
    const state = await api.post<PrivacyState>(
      "/me/consents",
      { policy_version: version, accept_terms: true, age_attested: true, source: "welcome" },
      { accessToken: token }
    );
    if (state.needs_acceptance) return { error: "We could not record your acceptance. Please try again." };
  } catch (error) {
    return { error: explain(error) };
  }

  (await cookies()).set(POLICY_COOKIE, version, POLICY_COOKIE_OPTIONS);
  redirect(next);
}

// Choix facultatifs (ex. publicité personnalisée), seulement ceux que l'API a activés : elle
// refuse toute autre finalité.
export async function savePrivacyChoices(
  _state: PrivacyFormState | undefined,
  formData: FormData
): Promise<PrivacyFormState> {
  const purposes = formData.getAll("purpose").map(String);
  if (purposes.length === 0) return { error: "Nothing to save." };

  const choices: Record<string, boolean> = {};
  for (const purpose of purposes) choices[purpose] = formData.get(`choice_${purpose}`) === "on";

  const token = await accessToken();
  try {
    await api.post<PrivacyState>(
      "/me/consents",
      { policy_version: policyVersion() ?? "unversioned", choices, source: "settings" },
      { accessToken: token }
    );
  } catch (error) {
    return { error: explain(error) };
  }

  return { message: "Your choices are saved." };
}
