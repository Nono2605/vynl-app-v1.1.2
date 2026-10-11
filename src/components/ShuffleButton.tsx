"use client";

import { usePlayer } from "@/lib/player/PlayerContext";
import { ShuffleIcon } from "@/components/icons";

// Aléatoire : la suite de la liste est jouée dans le désordre. Cyan quand c'est actif
// (le cyan marque ce qui est actif), avec un point sous l'icône pour ne pas dépendre de la couleur.
export function ShuffleButton({ className = "", size = 18 }: { className?: string; size?: number }) {
  const { shuffle, toggleShuffle } = usePlayer();
  return (
    <button
      type="button"
      onClick={toggleShuffle}
      aria-pressed={shuffle}
      aria-label="Shuffle"
      title={shuffle ? "Shuffle on" : "Shuffle off"}
      className={`icon-btn skip-btn toggle-btn ${className}`}
    >
      <ShuffleIcon size={size} />
    </button>
  );
}
