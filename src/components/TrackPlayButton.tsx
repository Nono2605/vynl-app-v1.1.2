"use client";

import { usePlayer, type PlayerTrack } from "@/lib/player/PlayerContext";
import { PlayIcon, PauseIcon } from "@/components/icons";

export function TrackPlayButton({
  track,
  size = 36,
}: {
  track: PlayerTrack;
  /** Diamètre en px — plus petit pour les listes en ligne, plus grand pour les cartes. */
  size?: number;
}) {
  const { track: current, isPlaying, play, toggle } = usePlayer();
  const isCurrent = current?.id === track.id;
  const showPause = isCurrent && isPlaying;

  function handleClick() {
    if (isCurrent) toggle();
    else play(track);
  }

  return (
    <button
      onClick={handleClick}
      aria-label={showPause ? "Pause" : "Play"}
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
      {showPause ? <PauseIcon size={size * 0.45} /> : <PlayIcon size={size * 0.45} />}
    </button>
  );
}
