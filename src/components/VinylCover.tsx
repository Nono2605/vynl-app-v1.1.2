import type { CSSProperties } from "react";

// Pochette d'une release telle qu'elle apparaît dans l'app d'écoute : un disque picture, c'est-à-dire
// un vinyle dont l'image du créateur est imprimée sur le disque (sillons, étiquette, reflet par-dessus).
// Sans image : le vinyle vide de la charte. Le carré s'adapte à la largeur du conteneur
// (ou à `size`). Les styles sont `.vinyl-cover*` dans globals.css, identiques à ceux de l'app d'écoute.
export function VinylCover({
  src,
  size,
  small,
  label,
  style,
}: {
  src: string | null;
  size?: number;
  small?: boolean;
  label?: string;
  style?: CSSProperties;
}) {
  const className = ["vinyl-cover", src ? "" : "vinyl-cover--empty", small ? "vinyl-cover--sm" : ""]
    .filter(Boolean)
    .join(" ");
  return (
    <span
      className={className}
      style={{ ...(size ? { width: size, height: size } : null), ...style }}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {/* Image distante du stockage : <img> simple, sans l'optimiseur de next/image. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {src && <img className="vinyl-cover__img" src={src} alt="" loading="lazy" decoding="async" draggable={false} />}
      <span className="vinyl-cover__label" />
    </span>
  );
}
