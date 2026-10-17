"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface AuthFormState {
  error?: string;
  message?: string;
}

export async function login(
  _state: AuthFormState | undefined,
  formData: FormData
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  redirect("/");
}

export async function signup(
  _state: AuthFormState | undefined,
  formData: FormData
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    return { error: error.message };
  }

  if (!data.session) {
    return { message: "Check your email to confirm your account, then log in." };
  }

  redirect("/onboarding");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

// L'adresse du site telle que le visiteur la voit : sert à construire le lien du courriel de
// réinitialisation. Supabase n'accepte que les adresses de sa liste « Redirect URLs » : une valeur
// détournée ne mènerait nulle part.
async function siteOrigin(): Promise<string> {
  const h = await headers();
  const origin = h.get("origin");
  if (origin) return origin;
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

// « Mot de passe oublié » : envoie un lien par courriel. La réponse est la même que le compte
// existe ou non, pour ne pas révéler qui est inscrit.
export async function requestPasswordReset(
  _state: AuthFormState | undefined,
  formData: FormData
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Enter your email address." };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${await siteOrigin()}/auth/callback?next=/reset-password`,
  });

  if (error) {
    if (error.status === 429 || error.code === "over_email_send_rate_limit") {
      return { error: "Please wait a minute before asking for another link." };
    }
    // Un compte inconnu n'est pas une erreur (Supabase répond ok) : ici c'est une vraie panne.
    if (!error.status || error.status >= 500) {
      return { error: "We couldn't send the email right now. Try again in a few minutes." };
    }
  }

  return { message: "If an account exists for this email, we've sent a link to choose a new password. It can take a minute." };
}

// Après le lien du courriel (voir /auth/callback) : l'utilisateur a une session de récupération
// et choisit son nouveau mot de passe. Les autres appareils sont déconnectés.
export async function resetPassword(
  _state: AuthFormState | undefined,
  formData: FormData
): Promise<AuthFormState> {
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirm_password") ?? "");

  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  if (password !== confirmPassword) return { error: "Passwords do not match." };

  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return { error: "This link has expired. Ask for a new one." };

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };

  await supabase.auth.signOut({ scope: "others" });
  redirect("/");
}
