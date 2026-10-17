"use client";

import { useActionState } from "react";
import { updatePreferences } from "@/app/actions/account";
import { selectedGenreCodes, type GenreOption } from "@/lib/genres";

interface Props {
  explicitContent: boolean;
  favoriteGenres: string[];
  /** La liste fermée des genres ; vide si elle n'a pas pu être chargée (champ libre de secours). */
  genres: GenreOption[];
}

export function PreferencesForm({ explicitContent, favoriteGenres, genres }: Props) {
  const [state, action, pending] = useActionState(updatePreferences, undefined);
  const selected = selectedGenreCodes(favoriteGenres, genres);

  return (
    <form action={action} style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)", maxWidth: 520 }}>
      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          color: "var(--vynl-texte-2)",
          fontSize: "0.875rem",
        }}
      >
        <input type="checkbox" name="explicit_content" defaultChecked={explicitContent} />
        Allow explicit content
      </label>
      <p style={{ color: "var(--vynl-texte-3)", fontSize: "0.8125rem", marginTop: "-0.25rem" }}>
        When off, explicit tracks and releases (marked E) are hidden from Discover and search, and skipped in playlists.
      </p>

      {genres.length > 0 ? (
        <fieldset className="genre-chips">
          <legend style={{ fontSize: "0.8125rem", color: "var(--vynl-texte-2)", marginBottom: "0.5rem" }}>
            Favorite genres
          </legend>
          <div className="genre-chips__list">
            {genres.map((genre) => (
              <label key={genre.code} className="genre-chip">
                <input type="checkbox" name="favorite_genres" value={genre.code} defaultChecked={selected.has(genre.code)} />
                <span>{genre.label}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ) : (
        <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
          <span style={{ fontSize: "0.8125rem", color: "var(--vynl-texte-2)" }}>
            Favorite genres (comma separated)
          </span>
          <input
            type="text"
            name="favorite_genres_text"
            defaultValue={favoriteGenres.join(", ")}
            placeholder="House, Hip-Hop, Jazz…"
            className="input-field"
          />
        </label>
      )}

      {state?.error && <p style={{ color: "var(--vynl-erreur)" }}>{state.error}</p>}
      {state?.message && <p style={{ color: "var(--vynl-succes)" }}>{state.message}</p>}
      <button
        type="submit"
        disabled={pending}
        className="btn btn-primary"
        style={{ alignSelf: "flex-start" }}
      >
        {pending ? "Saving…" : "Save preferences"}
      </button>
    </form>
  );
}
