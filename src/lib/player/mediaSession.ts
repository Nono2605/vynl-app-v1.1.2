// Ce que le téléphone (écran verrouillé, centre de contrôle), les écouteurs et les touches
// média du clavier affichent du morceau en cours. Fonctions pures, testées par
// mediaSession.test.mjs ; useMediaSession.ts les branche sur l'API du navigateur.

export interface MediaTrackInfo {
  title: string;
  artistName: string;
  coverUrl: string | null;
}

/** Pochette quand le morceau n'en a pas : le vinyle vide de la charte, en 512 px. */
export const FALLBACK_ARTWORK = "/brand/vynl-cover-512.png";
/** Affiché à la place du nom d'album, que le lecteur ne connaît pas. */
export const MEDIA_ALBUM = "Vynl";

/** URL absolue en http(s), sinon null (data:, javascript:, texte illisible…). */
export function absoluteHttpUrl(value: string | null | undefined, base: string): string | null {
  if (!value) return null;
  try {
    const url = new URL(value, base);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
}

/** Les champs de `new MediaMetadata(...)` pour ce morceau. `base` : l'adresse de la page. */
export function mediaMetadataInit(track: MediaTrackInfo, base: string) {
  const cover = absoluteHttpUrl(track.coverUrl, base);
  return {
    title: track.title,
    artist: track.artistName,
    album: MEDIA_ALBUM,
    // Une pochette du créateur a une taille inconnue : on annonce 512 px, le système la met à l'échelle.
    artwork: [{ src: cover ?? new URL(FALLBACK_ARTWORK, base).href, sizes: "512x512" }],
  };
}

/**
 * La position envoyée au système (barre de progression de l'écran verrouillé), ou null si
 * elle n'est pas valide : `setPositionState` lève une erreur quand la durée est inconnue,
 * infinie ou nulle, ou quand la position dépasse la durée.
 */
export function positionStateInit(duration: number, position: number, playbackRate = 1) {
  if (!Number.isFinite(duration) || duration <= 0) return null;
  if (!Number.isFinite(position) || position < 0) return null;
  const rate = Number.isFinite(playbackRate) && playbackRate !== 0 ? playbackRate : 1;
  return { duration, position: Math.min(position, duration), playbackRate: rate };
}
