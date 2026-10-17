import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/privacyGate";

// Arrivée du lien d'un courriel Supabase (réinitialisation du mot de passe) : on échange le
// code contre une session, puis on envoie l'utilisateur à `next` (un chemin du site, jamais une
// adresse extérieure). Le code ne vaut que dans le navigateur où le lien a été demandé : ailleurs,
// ou une fois expiré, on renvoie vers la demande d'un nouveau lien.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeNext(url.searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, url));
  }

  return NextResponse.redirect(new URL("/forgot-password?expired=1", url));
}
