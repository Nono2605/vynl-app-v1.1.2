"use client";

import { usePlayer } from "@/lib/player/PlayerContext";
import { Record } from "@/components/Record";

// Le grand disque du hero de Découvrir. Au repos, il montre la dernière sortie et
// tourne lentement, son arc avance tout seul (décor, comme sur le site). Dès qu'un
// morceau est chargé il devient le vrai lecteur : pochette, rotation et arc suivent
// ce qui joue.
export function HeroRecord({ cover, label }: { cover: string | null; label: string }) {
  const { track, isPlaying, currentTime, duration } = usePlayer();

  if (track) {
    return (
      <Record
        cover={track.coverUrl}
        label={track.title}
        progress={duration ? currentTime / duration : 0}
        playing={isPlaying}
        turn={14}
      />
    );
  }
  return <Record cover={cover} label={label} idle playing turn={40} />;
}
