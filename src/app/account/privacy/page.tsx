import Link from "next/link";
import { redirect } from "next/navigation";
import { loadPrivacyState, policyVersion, privacyLinks } from "@/lib/privacy";
import { createClient } from "@/lib/supabase/server";
import { DeleteAccountForm } from "./DeleteAccountForm";
import { PrivacyChoicesForm } from "./PrivacyChoicesForm";

// « Privacy & data » : ce que Vynl collecte, les choix de l'utilisateur et ses droits. Les
// phrases sur ce qui est collecté décrivent ce que l'app fait AUJOURD'HUI ; tant que la
// politique officielle n'est pas publiée, c'est un résumé, pas un engagement juridique.
export default async function PrivacyPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) redirect("/login");

  const configuredVersion = policyVersion();
  const result = await loadPrivacyState(session.access_token, configuredVersion ?? "unversioned");
  const state = "state" in result ? result.state : null;
  const links = privacyLinks();

  const sectionStyle = { padding: "var(--space-lg)" } as const;
  const muted = { color: "var(--vynl-texte-2)" } as const;

  return (
    <div style={{ padding: "var(--space-lg)", display: "flex", flexDirection: "column", gap: "var(--space-xl)" }}>
      <div>
        <h1 className="display-title">Privacy &amp; data</h1>
        <p style={{ ...muted, marginTop: "var(--space-xs)" }}>
          <Link href="/account" className="text-link">
            Back to settings
          </Link>
        </p>
      </div>

      {configuredVersion && (
        <section className="surface-calme" style={sectionStyle}>
          <h2 style={{ fontSize: "1.125rem", marginBottom: "var(--space-sm)" }}>Your acceptance</h2>
          {!state ? (
            <p style={muted}>This is temporarily unavailable.</p>
          ) : state.terms_accepted_at ? (
            <p style={muted}>
              You accepted the Privacy Policy and Terms (version {state.policy_version}) on{" "}
              {new Date(state.terms_accepted_at).toLocaleDateString()}.
            </p>
          ) : (
            <p style={muted}>You have not accepted the current version yet.</p>
          )}
        </section>
      )}

      <section className="surface-calme" style={sectionStyle}>
        <h2 style={{ fontSize: "1.125rem", marginBottom: "var(--space-sm)" }}>Your choices</h2>
        {state && state.choices.length > 0 ? (
          <PrivacyChoicesForm choices={state.choices} />
        ) : (
          <p style={muted}>
            We do not use any optional tracking or personalised advertising. If that changes, for example advertising on free
            plans, we will ask you here first.
          </p>
        )}
      </section>

      <section className="surface-calme" style={sectionStyle}>
        <h2 style={{ fontSize: "1.125rem", marginBottom: "var(--space-sm)" }}>What we collect</h2>
        <ul style={{ ...muted, paddingLeft: "1.2rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <li>
            <strong style={{ color: "var(--vynl-texte)" }}>Your account:</strong> your email, your password (stored in a form we
            cannot read), your username and the profile details you choose.
          </li>
          <li>
            <strong style={{ color: "var(--vynl-texte)" }}>Your activity:</strong> your playlists, library and follows, and your
            listening history: which track, when, for how long, where you started it from (album, playlist, search…), the kind of
            device (mobile, tablet or computer) and a country worked out from your IP address. We do not store your IP address.
          </li>
          <li>
            <strong style={{ color: "var(--vynl-texte)" }}>Cookies:</strong> only the ones needed to keep you signed in. No
            advertising or tracking cookies.
          </li>
          <li>
            <strong style={{ color: "var(--vynl-texte)" }}>Why:</strong> to run the service, to pay artists fairly according to
            what is listened to, and to show artists aggregated statistics about their audience.
          </li>
        </ul>
        {(links.policy || links.terms) && (
          <p style={{ marginTop: "var(--space-sm)" }}>
            {links.policy && (
              <a href={links.policy} target="_blank" rel="noopener noreferrer" className="text-link">
                Privacy Policy
              </a>
            )}
            {links.policy && links.terms && " · "}
            {links.terms && (
              <a href={links.terms} target="_blank" rel="noopener noreferrer" className="text-link">
                Terms of Use
              </a>
            )}
          </p>
        )}
      </section>

      <section className="surface-calme" style={sectionStyle}>
        <h2 style={{ fontSize: "1.125rem", marginBottom: "var(--space-sm)" }}>Download your data</h2>
        <p style={muted}>
          Get a copy of the data Vynl holds on your account: your profile, choices, library, playlists, follows, plan and payments,
          listening history and, if you are an artist, what you published. It is a JSON file. Internal security data and what our
          payment provider holds are not included.
        </p>
        <p style={{ marginTop: "var(--space-sm)" }}>
          <a href="/account/privacy/export" className="btn btn-secondary" download>
            Download my data
          </a>
        </p>
      </section>

      <section className="surface-calme" style={sectionStyle}>
        <h2 style={{ fontSize: "1.125rem", marginBottom: "var(--space-sm)" }}>Delete your account</h2>
        <p style={{ ...muted, marginBottom: "var(--space-sm)" }}>
          This permanently deletes your account and your personal data: profile, library, playlists, follows and choices. If you have
          a subscription, it ends immediately, with no refund for the current period. Your listening history stays, without any link to
          you, because it is used to pay artists; payment records are kept for accounting, also without a link to you. If you are an
          artist, your artist page is made anonymous and your tracks are removed from Vynl. This cannot be undone.
        </p>
        <DeleteAccountForm email={session.user.email ?? "your email"} />
      </section>

      <section className="surface-calme" style={sectionStyle}>
        <h2 style={{ fontSize: "1.125rem", marginBottom: "var(--space-sm)" }}>Your rights</h2>
        <p style={muted}>
          You can download your data and delete your account above. To correct something or ask any other question about your data,
          get in touch.{" "}
          {links.contact ? (
            <>
              Write to{" "}
              <a href={`mailto:${links.contact}`} className="text-link">
                {links.contact}
              </a>
              .
            </>
          ) : (
            "Contact the Vynl team."
          )}
        </p>
      </section>
    </div>
  );
}
