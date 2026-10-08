"use client";

import { useActionState } from "react";
import { changePassword } from "@/app/actions/account";

export function PasswordForm() {
  const [state, action, pending] = useActionState(changePassword, undefined);

  return (
    <form action={action} style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)", maxWidth: 420 }}>
      <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
        <span style={{ fontSize: "0.8125rem", color: "var(--vynl-texte-2)" }}>New password</span>
        <input
          type="password"
          name="password"
          required
          minLength={8}
          placeholder="Min. 8 characters"
          className="input-field"
        />
      </label>
      <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
        <span style={{ fontSize: "0.8125rem", color: "var(--vynl-texte-2)" }}>Confirm new password</span>
        <input type="password" name="confirm_password" required minLength={8} className="input-field" />
      </label>
      {state?.error && <p style={{ color: "var(--vynl-erreur)" }}>{state.error}</p>}
      {state?.message && <p style={{ color: "var(--vynl-succes)" }}>{state.message}</p>}
      <button
        type="submit"
        disabled={pending}
        className="btn btn-primary"
        style={{ alignSelf: "flex-start" }}
      >
        {pending ? "Updating…" : "Update password"}
      </button>
    </form>
  );
}
