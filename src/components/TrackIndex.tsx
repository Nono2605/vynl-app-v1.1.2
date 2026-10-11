"use client";

import { usePlayer } from "@/lib/player/PlayerContext";

// Numéro d'un morceau dans une liste (album, playlist). Quand c'est le morceau en
// cours, le numéro passe en cyan ; pendant la lecture, il devient un petit égaliseur.
export function TrackIndex({ id, n }: { id: string; n: number }) {
  const { track, isPlaying } = usePlayer();
  const active = track?.id === id;

  return (
    <span className="track-index" data-active={active || undefined}>
      {active && isPlaying ? (
        <span className="eq" role="img" aria-label="Playing">
          <i />
          <i />
          <i />
        </span>
      ) : (
        n
      )}
    </span>
  );
}
