"use client";

import { useState, useTransition } from "react";
import { saveToLibrary, removeFromLibrary } from "@/app/actions/library";
import { HeartIcon } from "@/components/icons";

export function SaveButton({
  itemType,
  itemId,
  initialSaved,
  size = 18,
}: {
  itemType: string;
  itemId: string;
  initialSaved: boolean;
  /** Taille du cœur en px (les lignes de liste gardent 18, une page de détail peut en vouloir plus). */
  size?: number;
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

  return (
    <button
      onClick={toggle}
      disabled={pending}
      aria-label={saved ? "Remove from library" : "Save to library"}
      aria-pressed={saved}
      className="icon-btn"
      style={{
        background: "none",
        border: "none",
        cursor: pending ? "default" : "pointer",
        padding: 0,
        display: "flex",
        // Favori : cyan, cœur plein uniquement à l'état actif.
        color: saved ? "var(--vynl-cyan)" : "var(--vynl-texte-2)",
        opacity: pending ? 0.6 : 1,
      }}
    >
      <HeartIcon size={size} filled={saved} />
    </button>
  );
}
