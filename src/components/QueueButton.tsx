"use client";

import { useEffect, useId, useRef, useState } from "react";
import { usePlayer } from "@/lib/player/PlayerContext";
import { QueueIcon } from "@/components/icons";
import { UpcomingList } from "@/components/UpcomingList";
import { VinylCover } from "@/components/VinylCover";
import { ExplicitBadge } from "@/components/ExplicitBadge";

// Petit bouton du lecteur qui ouvre une fenêtre avec les morceaux suivants : on y voit ce
// qui va jouer, on peut sauter à un morceau, en retirer, ou tout vider. Se ferme avec
// Échap, en cliquant ailleurs, ou en rappuyant sur le bouton.
export function QueueButton() {
  const { track, upcoming, isLoading, jumpTo, removeUpcoming, clearUpcoming } = usePlayer();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popId = useId();

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      setOpen(false);
      buttonRef.current?.focus();
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className="queue-wrap">
      <button
        ref={buttonRef}
        type="button"
        className="icon-btn skip-btn queue-btn"
        aria-expanded={open}
        aria-controls={open ? popId : undefined}
        aria-label={upcoming.length > 0 ? `Next up, ${upcoming.length} in the queue` : "Next up"}
        onClick={() => setOpen((value) => !value)}
      >
        <QueueIcon size={20} />
        {upcoming.length > 0 && (
          <span className="queue-btn__count" aria-hidden="true">
            {upcoming.length > 99 ? "99+" : upcoming.length}
          </span>
        )}
      </button>

      {open && (
        <div id={popId} className="queue-pop" role="dialog" aria-label="Next up">
          <div className="queue-pop__head">
            <h2 className="queue-pop__title">Next up</h2>
            {upcoming.length > 0 && (
              <button type="button" className="btn-plain queue-pop__clear" onClick={clearUpcoming}>
                Clear
              </button>
            )}
          </div>

          {track && (
            <div className="queue-pop__now">
              <span className="upcoming__thumb">
                <VinylCover src={track.coverUrl} small />
              </span>
              <span className="upcoming__text">
                <span className="queue-pop__label">Now playing</span>
                <span className="upcoming__name">
                  {track.title}
                  <ExplicitBadge explicit={track.explicit} />
                </span>
                <span className="upcoming__artist">{track.artistName}</span>
              </span>
            </div>
          )}

          {upcoming.length > 0 ? (
            <UpcomingList items={upcoming} onJump={jumpTo} onRemove={removeUpcoming} disabled={isLoading} />
          ) : (
            <p className="queue-pop__empty">Nothing queued. Use the ⋯ menu on a track to add it here.</p>
          )}
        </div>
      )}
    </div>
  );
}
