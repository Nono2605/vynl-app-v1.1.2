"use client";

import { useRef, useState } from "react";
import { usePlayer } from "@/lib/player/PlayerContext";
import { formatDuration } from "@/lib/formatDuration";
import { PlayIcon, PauseIcon, SpinnerIcon } from "@/components/icons";
import { VinylCover } from "@/components/VinylCover";

// La mise en page (grille desktop, deux lignes sur mobile) est dans
// globals.css (.player-bar*) ; ici, seulement l'apparence des éléments.
export function PlayerBar() {
  const { track, isPlaying, isLoading, isBuffering, currentTime, duration, error, toggle, seek } = usePlayer();

  // Pendant un glissement du curseur on affiche la valeur du doigt, pas
  // currentTime (que timeupdate réécrit en continu et qui faisait sauter le
  // curseur) ; on ne seek qu'au relâchement. Au clavier : seek immédiat.
  const [dragTime, setDragTime] = useState<number | null>(null);
  const draggingRef = useRef(false);

  if (!track) return null;

  const shownTime = dragTime ?? currentTime;
  const progress = duration ? Math.min(shownTime / duration, 1) * 100 : 0;

  function commitDrag() {
    draggingRef.current = false;
    if (dragTime !== null) {
      seek(dragTime);
      setDragTime(null);
    }
  }

  return (
    <div role="region" aria-label="Player" className="player-bar">
      <div className="player-bar__track">
        <VinylCover src={track.coverUrl} size={48} small style={{ borderRadius: "var(--radius-sm)" }} />
        <div style={{ minWidth: 0 }}>
          <p style={titleStyle}>{track.title}</p>
          <p style={artistStyle}>{track.artistName}</p>
        </div>
      </div>

      <div className="player-bar__controls">
        <button
          onClick={toggle}
          disabled={isLoading}
          aria-label={isPlaying ? "Pause" : "Play"}
          className="icon-btn player-bar__play"
          style={playButtonStyle}
        >
          {isLoading || isBuffering ? (
            <SpinnerIcon size={20} />
          ) : isPlaying ? (
            <PauseIcon size={20} />
          ) : (
            <PlayIcon size={20} />
          )}
        </button>
        <div className="player-bar__seek">
          <span style={{ ...timeStyle, textAlign: "right" }}>{formatDuration(Math.floor(shownTime))}</span>
          <input
            type="range"
            min={0}
            max={duration || 0}
            step="any"
            value={Math.min(shownTime, duration || 0)}
            onChange={(e) => {
              const value = Number(e.target.value);
              if (draggingRef.current) setDragTime(value);
              else seek(value);
            }}
            onPointerDown={() => {
              draggingRef.current = true;
            }}
            onPointerUp={commitDrag}
            onPointerCancel={commitDrag}
            onBlur={commitDrag}
            className="seek-bar"
            style={{ flex: 1, "--progress": `${progress}%` } as React.CSSProperties}
            aria-label="Seek"
          />
          <span style={timeStyle}>{duration ? formatDuration(Math.floor(duration)) : "--:--"}</span>
        </div>
      </div>

      {error && (
        <div className="player-bar__status">
          <span style={{ color: "var(--vynl-erreur)", fontSize: "0.8125rem" }}>{error}</span>
        </div>
      )}
    </div>
  );
}

const titleStyle: React.CSSProperties = {
  fontWeight: 600,
  fontSize: "0.875rem",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const artistStyle: React.CSSProperties = {
  color: "var(--vynl-texte-2)",
  fontSize: "0.75rem",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

// Bouton Lecture : dégradé Vague + lueur bleue. C'est la lueur forte de
// l'écran — les autres boutons de lecture n'en ont pas (voir TrackPlayButton).
const playButtonStyle: React.CSSProperties = {
  width: 48,
  height: 48,
  borderRadius: "50%",
  border: "none",
  background: "var(--vynl-degrade-vague)",
  boxShadow: "var(--vynl-lueur)",
  color: "#fff",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

// texte-2 et non texte-3 : le lecteur est un verre, pas le fond Nuit, où texte-3 manque de contraste.
const timeStyle: React.CSSProperties = {
  color: "var(--vynl-texte-2)",
  fontSize: "0.75rem",
  fontWeight: 500,
  fontVariantNumeric: "tabular-nums",
  width: 36,
  flex: "none",
};
