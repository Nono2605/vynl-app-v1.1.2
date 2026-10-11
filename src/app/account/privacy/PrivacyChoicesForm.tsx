"use client";

import { useActionState } from "react";
import { savePrivacyChoices } from "@/app/actions/privacy";

// Libellés des choix facultatifs. Une finalité que l'API active sans libellé ici s'affiche
// sous son identifiant : on ne la cache pas.
const LABELS: Record<string, { title: string; description: string }> = {
  ads_personalization: {
    title: "Personalised advertising",
    description: "Let advertising on free plans be tailored to what you listen to. Off by default.",
  },
  analytics: {
    title: "Usage analytics",
    description: "Help us improve Vynl by measuring how the app is used. Off by default.",
  },
};

export function PrivacyChoicesForm({ choices }: { choices: { purpose: string; granted: boolean | null }[] }) {
  const [state, action, pending] = useActionState(savePrivacyChoices, undefined);

  return (
    <form action={action} style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
      {choices.map((choice) => {
        const label = LABELS[choice.purpose] ?? { title: choice.purpose, description: "" };
        return (
          <label key={choice.purpose} style={{ display: "flex", gap: "0.65rem", alignItems: "flex-start", cursor: "pointer" }}>
            <input type="hidden" name="purpose" value={choice.purpose} />
            <input
              type="checkbox"
              name={`choice_${choice.purpose}`}
              defaultChecked={choice.granted === true}
              style={{ marginTop: "0.25rem" }}
            />
            <span>
              <strong>{label.title}</strong>
              {label.description && (
                <span style={{ display: "block", color: "var(--vynl-texte-2)", fontSize: "0.875rem" }}>{label.description}</span>
              )}
            </span>
          </label>
        );
      })}
      {state?.error && <p style={{ color: "var(--vynl-erreur)" }}>{state.error}</p>}
      {state?.message && <p style={{ color: "var(--vynl-cyan)" }}>{state.message}</p>}
      <div>
        <button type="submit" disabled={pending} className="btn btn-primary btn-sm">
          {pending ? "Saving…" : "Save my choices"}
        </button>
      </div>
    </form>
  );
}
