"use client";

import { usePlayer } from "@/lib/player/PlayerContext";
import { SpeakerIcon } from "@/components/icons";

// Coupure du son + curseur de volume. Le curseur reprend l'aspect de la barre de
// position. Caché sur les appareils tactiles (voir .volume dans globals.css) : le
// volume y est celui du téléphone et iOS ignore celui de la page.
export function VolumeControl({ className = "" }: { className?: string }) {
  const { volume, muted, setVolume, toggleMute } = usePlayer();
  const shown = muted ? 0 : volume;
  const level = shown === 0 ? "mute" : shown < 0.5 ? "low" : "high";

  return (
    <div className={`volume ${className}`}>
      <button
        type="button"
        className="icon-btn skip-btn"
        onClick={() => (volume === 0 ? setVolume(0.5) : toggleMute())}
        aria-label={shown === 0 ? "Unmute" : "Mute"}
        aria-pressed={shown === 0}
      >
        <SpeakerIcon size={20} level={level} />
      </button>
      <input
        type="range"
        className="seek-bar volume__slider"
        min={0}
        max={1}
        step={0.01}
        value={shown}
        onChange={(e) => setVolume(Number(e.target.value))}
        aria-label="Volume"
        aria-valuetext={`${Math.round(shown * 100)} percent`}
        style={{ "--progress": `${shown * 100}%` } as React.CSSProperties}
      />
    </div>
  );
}
