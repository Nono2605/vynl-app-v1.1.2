"use client";

import { useActionState } from "react";
import { openBillingPortal, startCheckout } from "@/app/actions/billing";

export function SubscribeForm({ plan, label }: { plan: string; label: string }) {
  const [state, action, pending] = useActionState(startCheckout, undefined);

  return (
    <form action={action} style={{ display: "flex", flexDirection: "column", gap: "var(--space-xs)", alignItems: "flex-start" }}>
      <input type="hidden" name="plan" value={plan} />
      <button type="submit" disabled={pending} className="btn btn-primary">
        {pending ? "Opening checkout…" : label}
      </button>
      {state?.error && <p style={{ color: "var(--vynl-erreur)" }}>{state.error}</p>}
    </form>
  );
}

export function PortalForm() {
  const [state, action, pending] = useActionState(openBillingPortal, undefined);

  return (
    <form action={action} style={{ display: "flex", flexDirection: "column", gap: "var(--space-xs)", alignItems: "flex-start" }}>
      <button type="submit" disabled={pending} className="btn btn-secondary">
        {pending ? "Opening…" : "Manage subscription"}
      </button>
      {state?.error && <p style={{ color: "var(--vynl-erreur)" }}>{state.error}</p>}
    </form>
  );
}
