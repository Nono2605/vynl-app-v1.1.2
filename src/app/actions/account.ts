"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { api } from "@/lib/api";
import type { AuthFormState } from "@/app/actions/auth";
import { parseFavoriteGenres } from "@/lib/genres";

export async function updateProfile(
  _state: AuthFormState | undefined,
  formData: FormData
): Promise<AuthFormState> {
  const username = String(formData.get("username") ?? "").trim();
  const displayName = String(formData.get("display_name") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();

  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return { error: "Not authenticated" };

  try {
    await api.post(
      "/profile",
      { username, display_name: displayName || null, bio: bio || null },
      { accessToken: session.access_token }
    );
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not update profile." };
  }

  revalidatePath("/account");
  return { message: "Profile updated." };
}

export async function changePassword(
  _state: AuthFormState | undefined,
  formData: FormData
): Promise<AuthFormState> {
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirm_password") ?? "");

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return { error: "Not authenticated" };

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };

  return { message: "Password updated." };
}

interface Me {
  profile: { username: string } | null;
}

export async function updatePreferences(
  _state: AuthFormState | undefined,
  formData: FormData
): Promise<AuthFormState> {
  const explicitContent = formData.get("explicit_content") === "on";
  // Cases cochées (liste fermée de l'API) ; le champ libre n'existe que si la liste n'a pas pu être chargée.
  const favoriteGenres = parseFavoriteGenres(
    formData.getAll("favorite_genres").map(String),
    String(formData.get("favorite_genres_text") ?? "")
  );

  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return { error: "Not authenticated" };

  try {
    // username est requis par /profile (upsert par user_id, mais l'identifiant
    // stable pour la contrainte unique) — on récupère la valeur actuelle plutôt
    // que d'exposer un champ redondant dans ce formulaire de préférences.
    const me = await api.get<Me>("/me", { accessToken: session.access_token });
    if (!me.profile?.username) return { error: "Complete your profile first." };

    await api.post(
      "/profile",
      { username: me.profile.username, explicit_content: explicitContent, favorite_genres: favoriteGenres },
      { accessToken: session.access_token }
    );
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not update preferences." };
  }

  revalidatePath("/account");
  return { message: "Preferences updated." };
}
