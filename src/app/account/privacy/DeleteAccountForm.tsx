"use client";

import { useActionState } from "react";
import { deleteAccount } from "@/app/actions/privacy";

// Suppression du compte : irréversible, donc deux gestes volontaires (taper son adresse e-mail et cocher).
// L'API revérifie tout ; ce formulaire ne fait que le demander clairement.
export function DeleteAccountForm({ email }: { email: string }) {
  const [state, action, pending] = useActionState(deleteAccount, undefined);

  return (
    <form action={action} style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)", maxWidth: 420 }}>
      <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
        <span style={{ fontSize: "0.8125rem", color: "var(--vynl-texte-2)" }}>
          Type your email address ({email}) to confirm
        </span>
        <input type="email" name="confirm_email" required autoComplete="off" className="input-field" />
      </label>
      <label style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", color: "var(--vynl-texte-2)" }}>
        <input type="checkbox" name="understand" required style={{ marginTop: "0.25rem" }} />
        <span>I understand that this cannot be undone.</span>
      </label>
      {state?.error && <p style={{ color: "var(--vynl-erreur)" }}>{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="btn btn-secondary"
        style={{ alignSelf: "flex-start", color: "var(--vynl-erreur)", borderColor: "var(--vynl-erreur)" }}
      >
        {pending ? "Deleting…" : "Delete my account"}
      </button>
    </form>
  );
}
