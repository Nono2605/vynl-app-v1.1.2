import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { api } from "@/lib/api";
import { PasswordForm } from "./PasswordForm";
import { PreferencesForm } from "./PreferencesForm";

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

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  const [me, { subscription }] = await Promise.all([
    api.get<Me>("/me", { accessToken: session.access_token }),
    api.get<{ subscription: Subscription | null }>("/subscriptions/me", { accessToken: session.access_token }),
  ]);

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
        />
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
      </section>
    </div>
  );
}
