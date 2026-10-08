"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login } from "@/app/actions/auth";

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <div className="bg-signature" style={{ maxWidth: 400, margin: "var(--space-xl) auto", padding: "0 var(--space-md)" }}>
      <h1 className="display-title" style={{ marginBottom: "var(--space-md)" }}>Log in</h1>
      <form action={action} style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
        <input type="email" name="email" placeholder="Email" required className="input-field" />
        <input type="password" name="password" placeholder="Password" required className="input-field" />
        {state?.error && <p style={{ color: "var(--vynl-erreur)" }}>{state.error}</p>}
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
