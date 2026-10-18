"use client";

import { useState, useTransition } from "react";
import { saveToLibrary, removeFromLibrary } from "@/app/actions/library";
import { HeartIcon } from "@/components/icons";
import { formatLikes, likesLabel } from "@/lib/formatLikes";

export function SaveButton({
  itemType,
  itemId,
  initialSaved,
  size = 18,
  className = "",
  likesCount = null,
}: {
  itemType: string;
  itemId: string;
  initialSaved: boolean;
  /** Taille du cœur en px (les lignes de liste gardent 18, une page de détail peut en vouloir plus). */
  size?: number;
  /** Classe en plus (ex. la taille tactile de la platine). */
  className?: string;
  /**
   * Nombre de « j'aime » du morceau (celui d'avant le clic), affiché à côté du cœur. Il bouge tout de
   * suite quand on aime ou qu'on retire : +1 / -1 par rapport à l'état de départ. Rien tant qu'il vaut zéro.
   */
  likesCount?: number | null;
}) {
  const [saved, setSaved] = useState(initialSaved);
  const [pending, startTransition] = useTransition();

  function toggle() {
    const next = !saved;
    setSaved(next); // optimiste — on réconcilie si l'appel échoue
    startTransition(async () => {
      try {
        if (next) await saveToLibrary(itemType, itemId);
        else await removeFromLibrary(itemType, itemId);
      } catch {
        setSaved(!next);
      }
    });
  }

  const likes = likesCount === null ? null : Math.max(0, likesCount - (initialSaved ? 1 : 0) + (saved ? 1 : 0));

  return (
    <button
      onClick={toggle}
      disabled={pending}
      aria-label={`${saved ? "Remove from library" : "Save to library"}${likes ? ` (${likesLabel(likes)})` : ""}`}
      aria-pressed={saved}
      className={`icon-btn ${className}`.trim()}
      style={{
        background: "none",
        border: "none",
        cursor: pending ? "default" : "pointer",
        padding: 0,
        display: "flex",
        alignItems: "center",
        gap: 4,
        // Favori : cyan, cœur plein uniquement à l'état actif.
        color: saved ? "var(--vynl-cyan)" : "var(--vynl-texte-2)",
        opacity: pending ? 0.6 : 1,
      }}
    >
      <HeartIcon size={size} filled={saved} />
      {likes ? <span className="like-count like-count--btn">{formatLikes(likes)}</span> : null}
    </button>
  );
}
