"use client";

import { useRef, useState } from "react";
import { usePlayer, usePlayerProgress } from "@/lib/player/PlayerContext";
import { formatDuration } from "@/lib/formatDuration";

// Heure écoulée, curseur de position, durée. Partagé par le lecteur du bas et la
// platine (« Now playing ») : la mise en page vient de la classe passée.
export function SeekControl({ className }: { className?: string }) {
  const { seek } = usePlayer();
  const { currentTime, duration } = usePlayerProgress();

  // Pendant un glissement du curseur on affiche la valeur du doigt, pas
  // currentTime (que timeupdate réécrit en continu et qui faisait sauter le
  // curseur) ; on ne seek qu'au relâchement. Au clavier : seek immédiat.
  const [dragTime, setDragTime] = useState<number | null>(null);
  const draggingRef = useRef(false);

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
    <div className={className}>
      <span className="seek-time seek-time--elapsed">{formatDuration(Math.floor(shownTime))}</span>
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
      <span className="seek-time">{duration ? formatDuration(Math.floor(duration)) : "--:--"}</span>
    </div>
  );
}
