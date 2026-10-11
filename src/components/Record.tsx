"use client";

import { useEffect, useId, useRef } from "react";

// Le disque de Vynl, repris du site vitrine : un vinyle dont l'arc cyan est la
// position dans le morceau, avec une tête qui en suit le bout. Il sert de platine
// dans « Now playing », de mini-disque dans le lecteur et de décor dans l'accueil.
//
// Avec une pochette, l'image est imprimée sur le disque et tourne sous des sillons
// et un reflet qui, eux, restent fixes (comme la lumière sur un vrai disque). Sans
// pochette, c'est l'étiquette dégradée du site, avec le titre écrit en cercle.
//
// Décoratif (aria-hidden) : l'information est lue ailleurs (titre, barre de lecture).

interface RecordProps {
  /** Pochette de la release ; absente, le disque porte l'étiquette dégradée. */
  cover?: string | null;
  /** Texte de l'étiquette quand il n'y a pas de pochette (titre, artiste…). */
  label?: string;
  /** Position dans le morceau, de 0 à 1 : longueur de l'arc cyan. */
  progress?: number;
  /** Le disque tourne. Au passage à faux il ralentit jusqu'à s'arrêter, il ne se fige pas d'un coup. */
  playing?: boolean;
  /** Durée d'un tour, en secondes. */
  turn?: number;
  /** Arc de progression qui avance tout seul (décor d'accueil), sans lecture réelle derrière. */
  idle?: boolean;
  /** Petite taille (lecteur) : arc plus épais, sans sillons fins. */
  small?: boolean;
  className?: string;
}

// L'étiquette écrite en cercle : ni trop courte (les lettres s'écarteraient trop),
// ni coupée au milieu d'un mot. On répète « VYNL · TITRE · » jusqu'à ~40 signes.
function labelText(label: string): string {
  const unit = `VYNL - ${label.trim().toUpperCase().slice(0, 22)} - `;
  const repeats = Math.max(1, Math.round(40 / unit.length));
  return unit.repeat(repeats).trimEnd();
}

// Rotation pilotée par l'API Web Animations : on change la VITESSE (playbackRate)
// avec une inertie, au lieu de poser/retirer une animation CSS. Le disque prend sa
// vitesse en un instant et s'arrête en ralentissant, comme un plateau.
function useSpin(ref: React.RefObject<HTMLElement | null>, playing: boolean, turn: number) {
  const animation = useRef<Animation | null>(null);
  const rate = useRef(0);
  const frame = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof el.animate !== "function") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const spin = el.animate([{ transform: "rotate(0turn)" }, { transform: "rotate(1turn)" }], {
      duration: turn * 1000,
      iterations: Infinity,
    });
    spin.pause();
    rate.current = 0;
    animation.current = spin;
    return () => {
      cancelAnimationFrame(frame.current);
      spin.cancel();
      animation.current = null;
    };
  }, [ref, turn]);

  useEffect(() => {
    const spin = animation.current;
    if (!spin) return;

    const target = playing ? 1 : 0;
    cancelAnimationFrame(frame.current);
    if (target === 1 && spin.playState === "paused") spin.play();

    let last = performance.now();
    const step = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      // Lissage exponentiel vers la vitesse cible (constante de temps ~0,45 s).
      rate.current += (target - rate.current) * (1 - Math.exp(-dt / 0.45));
      if (Math.abs(target - rate.current) < 0.01) rate.current = target;
      spin.updatePlaybackRate(rate.current);
      if (rate.current === target) {
        if (target === 0) spin.pause();
        return;
      }
      frame.current = requestAnimationFrame(step);
    };
    frame.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame.current);
  }, [playing, turn]);
}

export function Record({
  cover = null,
  label = "New releases",
  progress = 0,
  playing = false,
  turn = 12,
  idle = false,
  small = false,
  className,
}: RecordProps) {
  const spinRef = useRef<HTMLDivElement>(null);
  const pathId = useId();
  useSpin(spinRef, playing, turn);

  const clamped = Math.min(1, Math.max(0, Number.isFinite(progress) ? progress : 0));
  const classes = ["record", small ? "record--sm" : "", idle ? "record--idle" : "", className ?? ""]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes} aria-hidden="true">
      <div className="record__disc" />

      <div ref={spinRef} className={`record__spin${cover ? "" : " record__spin--label"}`}>
        {cover ? (
          // Image distante du stockage : <img> simple, sans l'optimiseur de next/image.
          // eslint-disable-next-line @next/next/no-img-element
          <img className="record__cover" src={cover} alt="" decoding="async" draggable={false} />
        ) : (
          <svg viewBox="0 0 100 100" className="record__label">
            <defs>
              <linearGradient id={`${pathId}-grad`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#19E3FF" />
                <stop offset="1" stopColor="#0059F9" />
              </linearGradient>
              <path id={`${pathId}-path`} d="M50,50 m-37,0 a37,37 0 1,1 74,0 a37,37 0 1,1 -74,0" />
            </defs>
            <circle cx="50" cy="50" r="50" fill={`url(#${pathId}-grad)`} />
            <circle cx="50" cy="50" r="45" fill="none" stroke="#050816" strokeOpacity=".3" strokeWidth=".5" />
            <circle cx="50" cy="50" r="28" fill="none" stroke="#050816" strokeOpacity=".3" strokeWidth=".5" />
            {!small && (
              <text className="record__text">
                <textPath href={`#${pathId}-path`} textLength="228" lengthAdjust="spacing">
                  {labelText(label)}
                </textPath>
              </text>
            )}
          </svg>
        )}
      </div>

      <div className="record__grooves" />
      <div className="record__sheen" />
      <div className="record__spindle" />

      <svg className="record__ring" viewBox="0 0 100 100">
        <circle className="record__track" cx="50" cy="50" r="45.6" />
        <circle
          className="record__arc"
          cx="50"
          cy="50"
          r="45.6"
          pathLength="100"
          transform="rotate(-90 50 50)"
          style={idle ? undefined : { strokeDashoffset: 100 - clamped * 100 }}
        />
        <g className="record__head" style={idle ? undefined : { transform: `rotate(${clamped * 360}deg)` }}>
          <circle cx="50" cy="4.4" r={small ? 3 : 1.5} />
        </g>
      </svg>
    </div>
  );
}
