"use client";

import { useEffect, useRef } from "react";
import { usePlayer } from "@/lib/player/PlayerContext";
import { Icon, PlayIcon, PauseIcon, SpinnerIcon, SkipNextIcon, SkipPreviousIcon } from "@/components/icons";
import { PlayerRecord } from "@/components/PlayerRecord";
import { SeekControl } from "@/components/SeekControl";
import { ProvenanceBadge } from "@/components/ProvenanceBadge";
import { ExplicitBadge } from "@/components/ExplicitBadge";
import { ShuffleButton } from "@/components/ShuffleButton";
import { UpcomingList } from "@/components/UpcomingList";
import { VolumeControl } from "@/components/VolumeControl";

const MAX_UPCOMING = 8;
const FOCUSABLE = 'button:not(:disabled), [href], input:not(:disabled), [tabindex]:not([tabindex="-1"])';

// La platine : le morceau en cours en plein écran. Un grand disque dont l'anneau
// cyan est la position dans le morceau, qui tourne pendant la lecture et ralentit
// à la pause ; à côté, les commandes et la suite de la file. S'ouvre depuis le
// mini-disque du lecteur.
export function NowPlaying() {
  const {
    track,
    nowPlayingOpen,
    closeNowPlaying,
    isPlaying,
    isLoading,
    isBuffering,
    error,
    hasNext,
    toggle,
    next,
    previous,
    upcoming,
    jumpTo,
    removeUpcoming,
    clearUpcoming,
  } = usePlayer();

  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  const frame = useRef(0);

  // Ouverture : le focus entre dans la boîte, la page dessous ne défile plus ;
  // à la fermeture, tout revient où c'était.
  useEffect(() => {
    if (!nowPlayingOpen) return;
    const opener = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = overflow;
      if (opener && document.contains(opener)) opener.focus();
    };
  }, [nowPlayingOpen]);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  if (!nowPlayingOpen || !track) return null;

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      e.stopPropagation();
      closeNowPlaying();
      return;
    }
    if (e.key !== "Tab") return;
    // Le focus reste dans la boîte : Tab du dernier élément revient au premier.
    const items = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []);
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  // Le disque s'incline vers le curseur (souris seulement, jamais au toucher ni
  // avec « réduire les animations ») : un peu de profondeur, rien de plus.
  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType !== "mouse") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = tiltRef.current;
    if (!el) return;
    const { clientX, clientY } = e;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      const rect = el.getBoundingClientRect();
      const nx = ((clientX - rect.left) / rect.width - 0.5) * 2;
      const ny = ((clientY - rect.top) / rect.height - 0.5) * 2;
      el.style.setProperty("--tilt-x", `${(-ny * 5).toFixed(2)}deg`);
      el.style.setProperty("--tilt-y", `${(nx * 5).toFixed(2)}deg`);
    });
  }

  function onPointerLeave() {
    cancelAnimationFrame(frame.current);
    tiltRef.current?.style.setProperty("--tilt-x", "0deg");
    tiltRef.current?.style.setProperty("--tilt-y", "0deg");
  }

  return (
    <div
      ref={dialogRef}
      className="np"
      role="dialog"
      aria-modal="true"
      aria-labelledby="np-title"
      onKeyDown={onKeyDown}
    >
      <div className="np__glow" aria-hidden="true" />

      <button ref={closeRef} type="button" className="np__close icon-btn" onClick={closeNowPlaying} aria-label="Close now playing">
        <Icon name="close" size={24} />
      </button>

      <div className="np__stage" onPointerMove={onPointerMove} onPointerLeave={onPointerLeave}>
        <div ref={tiltRef} className="np__disc">
          <PlayerRecord turn={11} />
        </div>
      </div>

      <div className="np__info">
        <p className="np__eyebrow">Now playing</p>
        <h2 id="np-title" className="np__title">
          {track.title}
          <ExplicitBadge explicit={track.explicit} className="explicit-badge--lg" />
        </h2>
        <p className="np__artist">{track.artistName}</p>
        <ProvenanceBadge provenance={track.provenance} size="md" className="np__badge" />

        <SeekControl className="np__seek" />

        <div className="np__controls">
          <ShuffleButton className="skip-btn--lg" size={22} />
          <button onClick={previous} disabled={isLoading} aria-label="Previous track" className="icon-btn skip-btn skip-btn--lg">
            <SkipPreviousIcon size={24} />
          </button>
          <button
            onClick={toggle}
            disabled={isLoading}
            aria-label={isPlaying ? "Pause" : "Play"}
            className="icon-btn np__play"
          >
            {isLoading || isBuffering ? <SpinnerIcon size={28} /> : isPlaying ? <PauseIcon size={28} /> : <PlayIcon size={28} />}
          </button>
          <button
            onClick={next}
            disabled={isLoading || !hasNext}
            aria-label="Next track"
            className="icon-btn skip-btn skip-btn--lg"
          >
            <SkipNextIcon size={24} />
          </button>
          <span className="np__spacer" aria-hidden="true" />
        </div>
        <VolumeControl className="np__volume" />

        {error && (
          <p role="alert" className="np__error">
            {error}
          </p>
        )}

        {upcoming.length > 0 && (
          <section className="np__queue" aria-label="Up next">
            <div className="np__queue-head">
              <h3 className="np__queue-title">Up next</h3>
              <button type="button" className="btn-plain np__queue-clear" onClick={clearUpcoming}>
                Clear
              </button>
            </div>
            <UpcomingList
              items={upcoming}
              onJump={jumpTo}
              onRemove={removeUpcoming}
              limit={MAX_UPCOMING}
              disabled={isLoading}
            />
          </section>
        )}
      </div>
    </div>
  );
}
