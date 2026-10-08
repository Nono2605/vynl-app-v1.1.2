"use client";

import { useActionState } from "react";
import { searchTracksForPlaylist, addTrackToPlaylist } from "@/app/actions/playlists";

export function AddTrackSearch({ playlistId }: { playlistId: string }) {
  const [state, action, pending] = useActionState(searchTracksForPlaylist, undefined);

  return (
    <div>
      <form action={action} style={{ display: "flex", gap: "var(--space-sm)", marginBottom: "var(--space-sm)" }}>
        <input
          type="text"
          name="q"
          placeholder="Search tracks to add"
          className="input-field"
          style={{ flex: 1, padding: "0.6rem 0.9rem" }}
        />
        <button type="submit" disabled={pending} className="btn btn-secondary btn-sm">
          Search
        </button>
      </form>

      {state?.results && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
          {state.results.length === 0 ? (
            <p style={{ color: "var(--vynl-texte-2)", fontSize: "0.875rem" }}>
              No tracks match &quot;{state.query}&quot;.
            </p>
          ) : (
            state.results.map((track) => (
              <div
                key={track.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0.5rem 0.75rem",
                  borderRadius: "var(--radius-sm)",
                  background: "var(--vynl-vinyle)",
                }}
              >
                <span>
                  {track.title}{" "}
                  <span style={{ color: "var(--vynl-texte-2)" }}>— {track.artists?.name ?? "Unknown"}</span>
                </span>
                <form action={addTrackToPlaylist.bind(null, playlistId, track.id)}>
                  <button
                    type="submit"
                    className="btn-plain"
                    style={{ color: "var(--vynl-bleu)", fontWeight: 600 }}
                  >
                    Add
                  </button>
                </form>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
