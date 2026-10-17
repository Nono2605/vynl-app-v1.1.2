import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ResetPasswordForm } from "./ResetPasswordForm";

// Choisir un nouveau mot de passe, après le lien du courriel (la session de récupération vient de
// /auth/callback). Sans session, le lien n'a pas servi ou a expiré : on en redemande un.
export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/forgot-password?expired=1");
  }

  return (
    <div className="bg-signature surface-calme" style={authPanelStyle}>
      <h1 className="display-title" style={{ marginBottom: "var(--space-sm)" }}>New password</h1>
      <p style={{ color: "var(--vynl-texte-2)", marginBottom: "var(--space-md)" }}>
        Choose a new password for your account. Your other devices will be logged out.
      </p>
      <ResetPasswordForm />
    </div>
  );
}

const authPanelStyle: React.CSSProperties = {
  maxWidth: 440,
  width: "calc(100% - 2 * var(--space-sm))",
  margin: "var(--space-xl) auto",
  padding: "var(--space-lg)",
};
