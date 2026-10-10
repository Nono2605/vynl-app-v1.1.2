"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signup } from "@/app/actions/auth";

export default function SignupPage() {
  const [state, action, pending] = useActionState(signup, undefined);

  return (
    <div className="bg-signature surface-calme" style={authPanelStyle}>
      <h1 className="display-title" style={{ marginBottom: "var(--space-md)" }}>Sign up</h1>
      <form action={action} style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
        <input type="email" name="email" placeholder="Email" aria-label="Email" required className="input-field" />
        <input
          type="password"
          name="password"
          placeholder="Password (min. 8 characters)" aria-label="Password (min. 8 characters)"
          required
          minLength={8}
          className="input-field"
        />
        {state?.error && <p style={{ color: "var(--vynl-erreur)" }}>{state.error}</p>}
        {state?.message && <p style={{ color: "var(--vynl-cyan)" }}>{state.message}</p>}
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? "Creating account…" : "Sign up"}
        </button>
      </form>
      <p style={{ marginTop: "var(--space-md)", color: "var(--vynl-texte-2)" }}>
        Already have an account?{" "}
        <Link href="/login" className="text-link">
          Log in
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
