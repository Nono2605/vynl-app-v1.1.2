"use client";

import { useActionState } from "react";
import { createPlaylist } from "@/app/actions/playlists";

export function CreatePlaylistForm() {
  const [state, action, pending] = useActionState(createPlaylist, undefined);

  return (
    <form action={action} style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
      <div style={{ display: "flex", gap: "var(--space-sm)" }}>
        <input
          type="text"
          name="title"
          placeholder="New playlist name" aria-label="New playlist name"
          required
          className="input-field"
          style={{ flex: 1 }}
        />
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? "Creating…" : "Create"}
        </button>
      </div>
      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          color: "var(--vynl-texte-2)",
          fontSize: "0.875rem",
        }}
      >
        <input type="checkbox" name="is_public" />
        Make this playlist public
      </label>
      {state?.error && <p style={{ color: "var(--vynl-erreur)" }}>{state.error}</p>}
    </form>
  );
}
