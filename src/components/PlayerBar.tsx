"use client";

import { usePlayer } from "@/lib/player/PlayerContext";
import { formatDuration } from "@/lib/formatDuration";
import { PlayIcon, PauseIcon, SpinnerIcon } from "@/components/icons";

// La mise en page (grille desktop, deux lignes sur mobile) est dans
// globals.css (.player-bar*) ; ici, seulement l'apparence des éléments.
export function PlayerBar() {
  const { track, isPlaying, isLoading, currentTime, duration, error, toggle, seek } = usePlayer();

  if (!track) return null;

  const progress = duration ? Math.min(currentTime / duration, 1) * 100 : 0;

  return (
    <div role="region" aria-label="Player" className="player-bar">
      <div className="player-bar__track">
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "var(--radius-sm)",
            flex: "none",
            background: track.coverUrl ? `url(${track.coverUrl}) center/cover` : "var(--vynl-pochette-vide)",
          }}
        />
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
          {isLoading ? <SpinnerIcon size={20} /> : isPlaying ? <PauseIcon size={20} /> : <PlayIcon size={20} />}
        </button>
        <div className="player-bar__seek">
          <span style={{ ...timeStyle, textAlign: "right" }}>{formatDuration(Math.floor(currentTime))}</span>
          <input
            type="range"
            min={0}
            max={duration || 0}
            value={Math.min(currentTime, duration || 0)}
            onChange={(e) => seek(Number(e.target.value))}
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

const timeStyle: React.CSSProperties = {
  color: "var(--vynl-texte-3)",
  fontSize: "0.75rem",
  fontWeight: 500,
  fontVariantNumeric: "tabular-nums",
  width: 36,
  flex: "none",
};
