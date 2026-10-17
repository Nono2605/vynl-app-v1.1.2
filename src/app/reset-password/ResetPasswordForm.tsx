"use client";

import { useActionState } from "react";
import { resetPassword } from "@/app/actions/auth";

export function ResetPasswordForm() {
  const [state, action, pending] = useActionState(resetPassword, undefined);

  return (
    <form action={action} style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
      <input
        type="password"
        name="password"
        placeholder="New password (min. 8 characters)"
        aria-label="New password (min. 8 characters)"
        required
        minLength={8}
        autoComplete="new-password"
        className="input-field"
      />
      <input
        type="password"
        name="confirm_password"
        placeholder="Confirm new password"
        aria-label="Confirm new password"
        required
        minLength={8}
        autoComplete="new-password"
        className="input-field"
      />
      {state?.error && <p role="alert" style={{ color: "var(--vynl-erreur)" }}>{state.error}</p>}
      <button type="submit" disabled={pending} className="btn btn-primary">
        {pending ? "Saving…" : "Save new password"}
      </button>
    </form>
  );
}
