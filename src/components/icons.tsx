// Icônes de la DA Vynl. Celles du jeu Phosphor viennent du sprite du site
// (public/icons.svg, mêmes symboles que vynl.com) via <Icon name="…" />.
// Le sprite n'a pas de cœur, de globe, de cadenas ni de spinner : ceux-là sont
// dessinés ici en trait de 1,75 px à bouts arrondis, plein seulement pour un
// état actif (cœur sauvegardé). À basculer sur le sprite quand il les aura.

interface IconProps {
  size?: number;
}

/** Identifiants présents dans public/icons.svg que l'app utilise. */
export type IconName = "play" | "pause" | "menu" | "close" | "check" | "history" | "headphones" | "vinyl" | "music";

export function Icon({ name, size = 20 }: IconProps & { name: IconName }) {
  return (
    <svg className="icon" width={size} height={size} aria-hidden focusable="false">
      <use href={`/icons.svg#${name}`} />
    </svg>
  );
}

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

export function PlayIcon({ size = 20 }: IconProps) {
  return <Icon name="play" size={size} />;
}

export function PauseIcon({ size = 20 }: IconProps) {
  return <Icon name="pause" size={size} />;
}

// Précédent / suivant : pas dans le sprite, dessinés pleins comme lecture et pause.
export function SkipNextIcon({ size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden focusable="false">
      <path d="M5.5 6.4v11.2a1 1 0 0 0 1.52.85l8.9-5.6a1 1 0 0 0 0-1.7l-8.9-5.6a1 1 0 0 0-1.52.85Z" />
      <rect x="17" y="5.5" width="2.5" height="13" rx="1.25" />
    </svg>
  );
}

export function SkipPreviousIcon({ size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden focusable="false">
      <path d="M18.5 6.4v11.2a1 1 0 0 1-1.52.85l-8.9-5.6a1 1 0 0 1 0-1.7l8.9-5.6a1 1 0 0 1 1.52.85Z" />
      <rect x="4.5" y="5.5" width="2.5" height="13" rx="1.25" />
    </svg>
  );
}

export function SpinnerIcon({ size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke} aria-hidden>
      <path d="M12 3a9 9 0 1 0 9 9" opacity={0.9}>
        <animateTransform
          attributeName="transform"
          type="rotate"
          from="0 12 12"
          to="360 12 12"
          dur="0.9s"
          repeatCount="indefinite"
        />
      </path>
    </svg>
  );
}

export function HeartIcon({ size = 20, filled = false }: IconProps & { filled?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      {...stroke}
      fill={filled ? "currentColor" : "none"}
      aria-hidden
    >
      <path d="M12 20.5s-7.5-4.6-9.2-9.4C1.7 7.9 3.4 4.5 6.9 4.5c2 0 3.5 1.1 5.1 3 1.6-1.9 3.1-3 5.1-3 3.5 0 5.2 3.4 4.1 6.6-1.7 4.8-9.2 9.4-9.2 9.4Z" />
    </svg>
  );
}

export function ShuffleIcon({ size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke} aria-hidden focusable="false">
      <path d="M3 7h3.2c1.5 0 2.8.7 3.7 1.9l4.2 6.2c.9 1.2 2.2 1.9 3.7 1.9H21" />
      <path d="m18 14 3 3-3 3" />
      <path d="M3 17h3.2c1.5 0 2.8-.7 3.7-1.9" />
      <path d="M14.1 8.9C15 7.7 16.3 7 17.8 7H21" />
      <path d="m18 4 3 3-3 3" />
    </svg>
  );
}

/** La file d'attente : une liste avec une flèche de lecture. */
export function QueueIcon({ size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke} aria-hidden focusable="false">
      <path d="M4 6h11" />
      <path d="M4 12h7" />
      <path d="M4 18h7" />
      <path d="M15 13.2v6.6a.6.6 0 0 0 .9.5l5.3-3.3a.6.6 0 0 0 0-1l-5.3-3.3a.6.6 0 0 0-.9.5Z" />
    </svg>
  );
}

/** Trois points horizontaux : le menu d'options d'un morceau. */
export function MoreIcon({ size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden focusable="false">
      <circle cx="5.5" cy="12" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <circle cx="18.5" cy="12" r="1.8" />
    </svg>
  );
}

export function SpeakerIcon({ size = 20, level }: IconProps & { level: "mute" | "low" | "high" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke} aria-hidden focusable="false">
      <path d="M4 9.5h3.2L12 5.5v13l-4.8-4H4Z" />
      {level === "mute" && <path d="m16 9.5 5 5m0-5-5 5" />}
      {level !== "mute" && <path d="M15.6 9.2a4 4 0 0 1 0 5.6" />}
      {level === "high" && <path d="M18.4 6.6a8 8 0 0 1 0 10.8" />}
    </svg>
  );
}

export function PlusIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke} aria-hidden focusable="false">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function ChevronLeftIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke} aria-hidden focusable="false">
      <path d="m14 6-6 6 6 6" />
    </svg>
  );
}

export function SearchIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke} aria-hidden focusable="false">
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-4.2-4.2" />
    </svg>
  );
}

export function GlobeIcon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke} aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3Z" />
    </svg>
  );
}

export function LockIcon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke} aria-hidden>
      <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" />
      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
    </svg>
  );
}
