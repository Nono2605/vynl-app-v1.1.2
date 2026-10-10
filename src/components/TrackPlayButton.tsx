"use client";

import { usePlayer, type PlayerTrack } from "@/lib/player/PlayerContext";
import { PlayIcon, PauseIcon, SpinnerIcon } from "@/components/icons";
import type { PlaySource } from "@/lib/player/types";

export function TrackPlayButton({
  track,
  size = 36,
  source,
}: {
  track: PlayerTrack;
  /** Diamètre en px — plus petit pour les listes en ligne, plus grand pour les cartes. */
  size?: number;
  /** D'où vient la lecture (album, playlist, découverte…) : enregistré avec l'écoute. */
  source?: PlaySource;
}) {
  const { track: current, isPlaying, isLoading, play, toggle } = usePlayer();
  const isCurrent = current?.id === track.id;
  const showLoading = isCurrent && isLoading;
  const showPause = isCurrent && isPlaying && !showLoading;

  function handleClick() {
    if (isCurrent) toggle();
    else play(track, source);
  }

  return (
    <button
      onClick={handleClick}
      aria-label={showLoading ? "Loading" : showPause ? "Pause" : "Play"}
      aria-busy={showLoading}
      className="icon-btn"
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        border: "none",
        background: "var(--vynl-degrade-vague)",
        color: "#fff",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flex: "none",
        // Pas de lueur forte ici (une seule par écran, sur le lecteur) : le
        // morceau en cours est signalé par une petite lueur cyan.
        boxShadow: isCurrent ? "var(--vynl-lueur-cyan)" : "none",
      }}
    >
      {showLoading ? (
        <SpinnerIcon size={size * 0.45} />
      ) : showPause ? (
        <PauseIcon size={size * 0.45} />
      ) : (
        <PlayIcon size={size * 0.45} />
      )}
    </button>
  );
}
