"use client";

import { usePlayer, type PlayerTrack } from "@/lib/player/PlayerContext";
import { PlayIcon, PauseIcon, SpinnerIcon } from "@/components/icons";
import type { PlaySource } from "@/lib/player/types";

// « Play » d'un album ou d'une playlist : lance la liste depuis le premier morceau,
// la file d'attente enchaîne ensuite. Si un morceau de cette liste est déjà en
// cours, le bouton devient Pause / Play sur ce morceau, sans repartir de zéro.
export function PlayAllButton({
  tracks,
  source,
  label = "Play",
}: {
  tracks: PlayerTrack[];
  source?: PlaySource;
  /** Texte du bouton à l'arrêt ; il passe à « Pause » quand un morceau de la liste joue. */
  label?: string;
}) {
  const { track: current, isPlaying, isLoading, play, toggle } = usePlayer();
  const inList = current !== null && tracks.some((t) => t.id === current.id);
  const showLoading = inList && isLoading;
  const showPause = inList && isPlaying && !showLoading;

  function handleClick() {
    if (inList) toggle();
    else if (tracks.length > 0) play(tracks[0], source, tracks);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={tracks.length === 0}
      aria-busy={showLoading}
      className="btn btn-primary"
    >
      {showLoading ? <SpinnerIcon size={18} /> : showPause ? <PauseIcon size={18} /> : <PlayIcon size={18} />}
      {showPause ? "Pause" : label}
    </button>
  );
}
