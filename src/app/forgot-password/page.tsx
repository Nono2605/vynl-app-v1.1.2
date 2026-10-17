import Link from "next/link";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

// Mot de passe oublié : on demande son adresse, on envoie un lien (voir /auth/callback).
export default async function ForgotPasswordPage({ searchParams }: { searchParams: Promise<{ expired?: string }> }) {
  const expired = (await searchParams).expired === "1";

  return (
    <div className="bg-signature surface-calme" style={authPanelStyle}>
      <h1 className="display-title" style={{ marginBottom: "var(--space-sm)" }}>Forgot password</h1>
      <p style={{ color: "var(--vynl-texte-2)", marginBottom: "var(--space-md)" }}>
        Enter your email and we&apos;ll send you a link to choose a new password.
      </p>
      {expired && (
        <p role="alert" style={{ color: "var(--vynl-erreur)", marginBottom: "var(--space-sm)" }}>
          That link has expired, or was opened in another browser. Ask for a new one and open it in the same browser.
        </p>
      )}
      <ForgotPasswordForm />
      <p style={{ marginTop: "var(--space-md)", color: "var(--vynl-texte-2)" }}>
        <Link href="/login" className="text-link">
          Back to log in
        </Link>
      </p>
    </div>
  );
}

const authPanelStyle: React.CSSProperties = {
  maxWidth: 440,
  width: "calc(100% - 2 * var(--space-sm))",
  margin: "var(--space-xl) auto",
  padding: "var(--space-lg)",
};
