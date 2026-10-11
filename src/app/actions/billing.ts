"use server";

import { redirect } from "next/navigation";
import { ApiError, api } from "@/lib/api";
import { createClient } from "@/lib/supabase/server";

export interface BillingFormState {
  error?: string;
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
    return error.status === 503 ? "Payments are not available yet. Please try again later." : error.message;
  }
  throw error;
}

// Ouvre la page de paiement Stripe pour un plan : l'API crée la session, on y envoie le visiteur.
// redirect() lève une exception de contrôle : il ne doit jamais être dans le try.
export async function startCheckout(
  _state: BillingFormState | undefined,
  formData: FormData
): Promise<BillingFormState> {
  const plan = String(formData.get("plan") ?? "");
  const token = await accessToken();

  let url: string;
  try {
    ({ url } = await api.post<{ url: string }>("/billing/checkout", { plan }, { accessToken: token }));
  } catch (error) {
    return { error: explain(error) };
  }
  redirect(url);
}

// Ouvre le portail client de Stripe (carte, factures, résiliation).
export async function openBillingPortal(): Promise<BillingFormState> {
  const token = await accessToken();

  let url: string;
  try {
    ({ url } = await api.post<{ url: string }>("/billing/portal", undefined, { accessToken: token }));
  } catch (error) {
    return { error: explain(error) };
  }
  redirect(url);
}
