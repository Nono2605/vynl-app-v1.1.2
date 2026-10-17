"use client";

import { useState, useTransition } from "react";
import { followArtist, unfollowArtist } from "@/app/actions/follow";
import { formatFollowers } from "@/lib/formatFollowers";

// Bouton Follow d'une page artiste, avec le nombre de followers à côté (un nombre seulement : la
// liste de qui suit n'est visible de personne). Le nombre bouge tout de suite quand on clique,
// et revient en arrière si l'appel échoue. `followersCount` à null : le nombre n'a pas pu être lu, on n'affiche rien.
export function FollowButton({
  artistId,
  initialFollowing,
  followersCount = null,
}: {
  artistId: string;
  initialFollowing: boolean;
  followersCount?: number | null;
}) {
  const [following, setFollowing] = useState(initialFollowing);
  const [count, setCount] = useState(followersCount);
  const [pending, startTransition] = useTransition();

  function toggle() {
    const next = !following;
    const step = next ? 1 : -1;
    setFollowing(next); // optimiste — on réconcilie si l'appel échoue
    setCount((current) => (current === null ? null : Math.max(0, current + step)));
    startTransition(async () => {
      try {
        if (next) await followArtist(artistId);
        else await unfollowArtist(artistId);
      } catch {
        setFollowing(!next);
        setCount((current) => (current === null ? null : Math.max(0, current - step)));
      }
    });
  }

  // Le bouton et le nombre vont ensemble : sur un petit écran c'est le titre qui passe à la ligne, pas le nombre seul.
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-md)" }}>
      <button
        onClick={toggle}
        disabled={pending}
        className={`btn ${following ? "btn-secondary" : "btn-primary"}`}
      >
        {following ? "Following" : "Follow"}
      </button>
      {count !== null && (
        <span style={{ color: "var(--vynl-texte-2)", fontSize: "0.9375rem", whiteSpace: "nowrap" }} aria-live="polite">
          {formatFollowers(count)}
        </span>
      )}
    </div>
  );
}
