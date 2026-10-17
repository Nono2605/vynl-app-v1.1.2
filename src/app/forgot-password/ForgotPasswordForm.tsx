"use client";

import { useActionState } from "react";
import { requestPasswordReset } from "@/app/actions/auth";

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, undefined);

  return (
    <form action={action} style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
      <input type="email" name="email" placeholder="Email" aria-label="Email" required autoComplete="email" className="input-field" />
      {state?.error && <p style={{ color: "var(--vynl-erreur)" }}>{state.error}</p>}
      {state?.message && <p role="status" style={{ color: "var(--vynl-cyan)" }}>{state.message}</p>}
      <button type="submit" disabled={pending} className="btn btn-primary">
        {pending ? "Sending…" : "Send me a link"}
      </button>
    </form>
  );
}
