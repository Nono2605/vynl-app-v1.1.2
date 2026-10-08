"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateProfile } from "@/app/actions/account";

interface Props {
  username: string;
  displayName: string;
  bio: string;
}

export function EditProfilePanel({ username, displayName, bio }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError(null);

    const result = await updateProfile(undefined, formData);

    setPending(false);
    if (result?.error) {
      setError(result.error);
      return;
    }

    setEditing(false);
    const newUsername = String(formData.get("username") ?? username).trim();
    router.push(`/users/${newUsername}`);
    router.refresh();
  }

  if (!editing) {
    return (
      <button onClick={() => setEditing(true)} className="btn btn-secondary" style={{ marginBottom: "var(--space-lg)" }}>
        Edit profile
      </button>
    );
  }

  return (
    <form
      action={handleSubmit}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-sm)",
        maxWidth: 420,
        marginBottom: "var(--space-lg)",
      }}
    >
      <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
        <span style={{ fontSize: "0.8125rem", color: "var(--vynl-texte-2)" }}>Username</span>
        <input type="text" name="username" defaultValue={username} required minLength={3} className="input-field" />
      </label>
      <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
        <span style={{ fontSize: "0.8125rem", color: "var(--vynl-texte-2)" }}>Display name</span>
        <input type="text" name="display_name" defaultValue={displayName} className="input-field" />
      </label>
      <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
        <span style={{ fontSize: "0.8125rem", color: "var(--vynl-texte-2)" }}>Bio</span>
        <textarea name="bio" defaultValue={bio} rows={3} className="input-field" style={{ resize: "vertical" }} />
      </label>
      {error && <p style={{ color: "var(--vynl-erreur)" }}>{error}</p>}
      <div style={{ display: "flex", gap: "var(--space-sm)" }}>
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? "Saving…" : "Save"}
        </button>
        <button type="button" onClick={() => setEditing(false)} className="btn btn-secondary">
          Cancel
        </button>
      </div>
    </form>
  );
}
