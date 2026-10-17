"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login } from "@/app/actions/auth";

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <div className="bg-signature surface-calme" style={authPanelStyle}>
      <h1 className="display-title" style={{ marginBottom: "var(--space-md)" }}>Log in</h1>
      <form action={action} style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
        <input type="email" name="email" placeholder="Email" aria-label="Email" required className="input-field" />
        <input type="password" name="password" placeholder="Password" aria-label="Password" required className="input-field" />
        {state?.error && <p style={{ color: "var(--vynl-erreur)" }}>{state.error}</p>}
        <Link href="/forgot-password" className="text-link" style={{ alignSelf: "flex-start", fontSize: "0.875rem" }}>
          Forgot your password?
        </Link>
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? "Logging in…" : "Log in"}
        </button>
      </form>
      <p style={{ marginTop: "var(--space-md)", color: "var(--vynl-texte-2)" }}>
        No account?{" "}
        <Link href="/signup" className="text-link">
          Sign up
        </Link>
      </p>
    </div>
  );
}

// Panneau « calme » centré : le formulaire se détache du fond, la lueur du
// bg-signature reste visible autour. La largeur laisse 16 px de chaque côté sur mobile.
const authPanelStyle: React.CSSProperties = {
  maxWidth: 440,
  width: "calc(100% - 2 * var(--space-sm))",
  margin: "var(--space-xl) auto",
  padding: "var(--space-lg)",
};
