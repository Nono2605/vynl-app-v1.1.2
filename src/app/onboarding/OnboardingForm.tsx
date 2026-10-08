"use client";

import { useActionState } from "react";
import { completeOnboarding } from "@/app/actions/onboarding";

export function OnboardingForm() {
  const [state, action, pending] = useActionState(completeOnboarding, undefined);

  return (
    <form action={action} style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
      <input
        type="text"
        name="username"
        placeholder="Username"
        required
        minLength={3}
        className="input-field"
      />
      {state?.error && <p style={{ color: "var(--vynl-erreur)" }}>{state.error}</p>}
      <button type="submit" disabled={pending} className="btn btn-primary">
        {pending ? "Saving…" : "Continue"}
      </button>
    </form>
  );
}
