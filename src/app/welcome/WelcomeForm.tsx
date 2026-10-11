"use client";

import { useActionState } from "react";
import { acceptPrivacy } from "@/app/actions/privacy";

export function WelcomeForm({
  minAge,
  next,
  policyUrl,
  termsUrl,
}: {
  minAge: number;
  next: string;
  policyUrl: string | null;
  termsUrl: string | null;
}) {
  const [state, action, pending] = useActionState(acceptPrivacy, undefined);

  const link = (href: string | null, label: string) =>
    href ? (
      <a href={href} target="_blank" rel="noopener noreferrer" className="text-link">
        {label}
      </a>
    ) : (
      label
    );

  return (
    <form action={action} style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
      <input type="hidden" name="next" value={next} />

      <label style={{ display: "flex", gap: "0.65rem", alignItems: "flex-start", cursor: "pointer" }}>
        <input type="checkbox" name="age" required style={{ marginTop: "0.25rem" }} />
        <span>I am at least {minAge} years old.</span>
      </label>

      <label style={{ display: "flex", gap: "0.65rem", alignItems: "flex-start", cursor: "pointer" }}>
        <input type="checkbox" name="terms" required style={{ marginTop: "0.25rem" }} />
        <span>
          I have read the {link(policyUrl, "Privacy Policy")} and I accept the {link(termsUrl, "Terms of Use")}.
        </span>
      </label>

      {state?.error && <p style={{ color: "var(--vynl-erreur)" }}>{state.error}</p>}

      <button type="submit" disabled={pending} className="btn btn-primary">
        {pending ? "Saving…" : "Continue"}
      </button>
    </form>
  );
}
