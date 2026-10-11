// Réglages du lecteur gardés d'une visite à l'autre : volume, muet, aléatoire.
// localStorage peut manquer ou lever (navigation privée, stockage bloqué) : tout est
// protégé, et sans lui le lecteur repart simplement des valeurs par défaut.

const VOLUME_KEY = "vynl.player.volume";
const MUTED_KEY = "vynl.player.muted";
const SHUFFLE_KEY = "vynl.player.shuffle";

function read(key: string): string | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // stockage indisponible : le réglage vaut pour cette visite seulement
  }
}

/** Volume de 0 à 1 ; une valeur absente ou illisible donne le plein volume. */
export function parseVolume(raw: string | null): number {
  if (raw === null || raw.trim() === "") return 1;
  const value = Number(raw);
  return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 1;
}

export const readVolume = () => parseVolume(read(VOLUME_KEY));
export const readMuted = () => read(MUTED_KEY) === "1";
export const readShuffle = () => read(SHUFFLE_KEY) === "1";

export const writeVolume = (volume: number) => write(VOLUME_KEY, String(volume));
export const writeMuted = (muted: boolean) => write(MUTED_KEY, muted ? "1" : "0");
export const writeShuffle = (shuffle: boolean) => write(SHUFFLE_KEY, shuffle ? "1" : "0");
