import { redirect } from "next/navigation";
import { logout } from "@/app/actions/auth";
import { loadPrivacyState, policyVersion, privacyLinks } from "@/lib/privacy";
import { safeNext } from "@/lib/privacyGate";
import { createClient } from "@/lib/supabase/server";
import { WelcomeForm } from "./WelcomeForm";

// Écran d'accueil : confirmer son âge et accepter les conditions. Affiché par le middleware
// (lib/privacyGate.ts) quand PRIVACY_GATE est « on » et que ce compte n'a pas encore
// accepté la version actuelle du texte.
export default async function WelcomePage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeNext((await searchParams).next);
  const version = policyVersion();
  // Pas de version configurée : l'écran n'a pas lieu d'être.
  if (!version) redirect(next);

  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) redirect("/login");

  const result = await loadPrivacyState(session.access_token, version);
  // Déjà accepté (sur un autre appareil, par exemple) : on pose le cookie et on continue.
  if ("state" in result && !result.state.needs_acceptance) {
    redirect(`/welcome/ok?next=${encodeURIComponent(next)}`);
  }

  const links = privacyLinks();

  return (
    <div className="bg-signature surface-calme" style={panelStyle}>
      <h1 className="display-title" style={{ marginBottom: "var(--space-sm)" }}>Welcome</h1>

      {"unavailable" in result ? (
        <p style={{ color: "var(--vynl-texte-2)" }}>
          This step is temporarily unavailable. Please try again in a few minutes.
        </p>
      ) : (
        <>
          <p style={{ color: "var(--vynl-texte-2)", marginBottom: "var(--space-md)" }}>
            Before you start listening, two quick things.
          </p>
          <WelcomeForm minAge={result.state.min_age} next={next} policyUrl={links.policy} termsUrl={links.terms} />
          <p style={{ marginTop: "var(--space-md)", color: "var(--vynl-texte-3)", fontSize: "0.8125rem" }}>
            We keep a record of your acceptance (date and version of the text). You can see what we collect, and make your
            choices, in Settings under Privacy &amp; data.
          </p>
        </>
      )}

      <form action={logout} style={{ marginTop: "var(--space-md)" }}>
        <button type="submit" className="btn-plain text-link">
          Log out
        </button>
      </form>
    </div>
  );
}

const panelStyle: React.CSSProperties = {
  maxWidth: 440,
  width: "calc(100% - 2 * var(--space-sm))",
  margin: "var(--space-xl) auto",
  padding: "var(--space-lg)",
};
