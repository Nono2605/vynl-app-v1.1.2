import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { api } from "@/lib/api";
import { billingEnabled, formatPrice, type BillingPlan } from "@/lib/billing";
import { PortalForm, SubscribeForm } from "./BillingButtons";
import { PasswordForm } from "./PasswordForm";
import { PreferencesForm } from "./PreferencesForm";
import type { GenreOption } from "@/lib/genres";

interface Me {
  email: string;
  profile: {
    username: string;
    explicit_content: boolean;
    favorite_genres: string[] | null;
  } | null;
}

interface Subscription {
  plan: string;
  status: string;
  current_period_end: string | null;
}

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ checkout?: string }> }) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  const [me, { subscription }, genres] = await Promise.all([
    api.get<Me>("/me", { accessToken: session.access_token }),
    api.get<{ subscription: Subscription | null }>("/subscriptions/me", { accessToken: session.access_token }),
    // La liste fermée des genres ; indisponible (503 avant la migration, API injoignable) : champ libre de secours.
    api
      .get<{ genres: GenreOption[] }>("/genres")
      .then((result) => result.genres)
      .catch((): GenreOption[] => []),
  ]);

  // Boutons d'achat : seulement si l'interrupteur BILLING_UI est « on ». Une API qui ne répond pas
  // ou pas encore prête n'empêche jamais d'afficher la page : on n'affiche simplement pas l'offre.
  const billing = billingEnabled();
  const checkout = (await searchParams).checkout;
  const premium = billing
    ? await api
        .get<{ plans: BillingPlan[] }>("/billing/plans", { accessToken: session.access_token })
        .then((result) => result.plans.find((plan) => plan.purchasable) ?? null)
        .catch(() => null)
    : null;
  // Un abonnement Stripe en cours (actif, essai, paiement en retard) se gère dans le portail.
  const managed = subscription !== null && ["active", "trialing", "past_due"].includes(subscription.status);

  return (
    <div style={{ padding: "var(--space-lg)", display: "flex", flexDirection: "column", gap: "var(--space-xl)" }}>
      <h1 className="display-title">Settings</h1>

      <section className="surface-calme" style={{ padding: "var(--space-lg)" }}>
        <h2 style={{ fontSize: "1.125rem", marginBottom: "var(--space-md)" }}>Private info</h2>
        <p style={{ color: "var(--vynl-texte-2)", marginBottom: "var(--space-md)" }}>{me.email}</p>
        <PasswordForm />
      </section>

      <section className="surface-calme" style={{ padding: "var(--space-lg)" }}>
        <h2 style={{ fontSize: "1.125rem", marginBottom: "var(--space-md)" }}>Music preferences</h2>
        <PreferencesForm
          explicitContent={me.profile?.explicit_content ?? true}
          favoriteGenres={me.profile?.favorite_genres ?? []}
          genres={genres}
        />
      </section>

      <section className="surface-calme" style={{ padding: "var(--space-lg)" }}>
        <h2 style={{ fontSize: "1.125rem", marginBottom: "var(--space-sm)" }}>Privacy &amp; data</h2>
        <p style={{ color: "var(--vynl-texte-2)", marginBottom: "var(--space-sm)" }}>
          What we collect, your choices and your rights.
        </p>
        <Link href="/account/privacy" className="text-link">
          Open Privacy &amp; data
        </Link>
      </section>

      <section className="surface-calme" style={{ padding: "var(--space-lg)" }}>
        <h2 style={{ fontSize: "1.125rem", marginBottom: "var(--space-md)" }}>Subscription</h2>
        {subscription ? (
          <p style={{ color: "var(--vynl-texte-2)" }}>
            {subscription.plan} · {subscription.status}
            {subscription.current_period_end &&
              ` (renews ${new Date(subscription.current_period_end).toLocaleDateString()})`}
          </p>
        ) : (
          <p style={{ color: "var(--vynl-texte-2)" }}>No active subscription yet.</p>
        )}

        {checkout === "success" && (
          <p style={{ color: "var(--vynl-cyan)", marginTop: "var(--space-sm)" }}>
            Thank you! Your subscription is being activated: it can take a few seconds to appear here.
          </p>
        )}
        {checkout === "cancelled" && (
          <p style={{ color: "var(--vynl-texte-2)", marginTop: "var(--space-sm)" }}>Checkout cancelled: nothing was charged.</p>
        )}

        {billing && (
          <div style={{ marginTop: "var(--space-md)" }}>
            {managed ? (
              <PortalForm />
            ) : premium ? (
              <>
                <SubscribeForm
                  plan={premium.code}
                  label={`Go ${premium.name}: ${formatPrice(premium.price_cents, premium.currency)} / ${premium.interval}`}
                />
                <p style={{ color: "var(--vynl-texte-3)", fontSize: "0.8125rem", marginTop: "var(--space-xs)" }}>
                  {premium.tax_behavior === "inclusive" ? "Tax included. " : ""}Cancel any time from here.
                </p>
              </>
            ) : null}
          </div>
        )}
      </section>
    </div>
  );
}
