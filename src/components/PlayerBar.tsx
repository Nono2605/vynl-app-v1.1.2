"use client";

import { usePlayer } from "@/lib/player/PlayerContext";
import { PlayIcon, PauseIcon, SpinnerIcon, SkipNextIcon, SkipPreviousIcon } from "@/components/icons";
import { Record } from "@/components/Record";
import { SeekControl } from "@/components/SeekControl";

// La mise en page (grille desktop, deux lignes sur mobile) est dans
// globals.css (.player-bar*) ; ici, seulement l'apparence des éléments.
// Le morceau en cours est un mini-disque qui tourne (son anneau avance avec la
// lecture) ; cliquer dessus ouvre la platine (NowPlaying).
export function PlayerBar() {
  const {
    track,
    isPlaying,
    isLoading,
    isBuffering,
    currentTime,
    duration,
    error,
    hasNext,
    toggle,
    next,
    previous,
    openNowPlaying,
  } = usePlayer();

  if (!track) return null;

  const progress = duration ? Math.min(currentTime / duration, 1) : 0;

  return (
    <div role="region" aria-label="Player" className="player-bar">
      <div className="player-bar__track">
        <button
          type="button"
          onClick={openNowPlaying}
          className="player-bar__open"
          aria-label={`Open now playing: ${track.title}, ${track.artistName}`}
        >
          <span className="player-bar__disc">
            <Record small cover={track.coverUrl} label={track.title} progress={progress} playing={isPlaying} turn={9} />
          </span>
          <span style={{ minWidth: 0 }}>
            <span style={titleStyle}>{track.title}</span>
            <span style={artistStyle}>{track.artistName}</span>
          </span>
        </button>
      </div>

      <div className="player-bar__controls">
        <div className="player-bar__buttons">
          <button
            onClick={previous}
            disabled={isLoading}
            aria-label="Previous track"
            className="icon-btn skip-btn"
          >
            <SkipPreviousIcon size={18} />
          </button>
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
          <button
            onClick={next}
            disabled={isLoading || !hasNext}
            aria-label="Next track"
            className="icon-btn skip-btn"
          >
            <SkipNextIcon size={18} />
          </button>
        </div>
        <SeekControl className="player-bar__seek" />
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
  display: "block",
  fontWeight: 600,
  fontSize: "0.875rem",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const artistStyle: React.CSSProperties = {
  display: "block",
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
