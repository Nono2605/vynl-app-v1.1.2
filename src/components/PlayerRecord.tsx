"use client";

import { usePlayer, usePlayerProgress } from "@/lib/player/PlayerContext";
import { Record } from "@/components/Record";

// Le disque du morceau en cours : pochette, rotation à la lecture, et un arc qui avance avec la
// position. Il est seul à lire la position (plusieurs fois par seconde) : la barre du lecteur, la
// platine et le hero qui le contiennent ne se redessinent pas à chaque tick.
export function PlayerRecord({ small = false, turn }: { small?: boolean; turn: number }) {
  const { track, isPlaying } = usePlayer();
  const { currentTime, duration } = usePlayerProgress();
  if (!track) return null;

  const progress = duration ? Math.min(currentTime / duration, 1) : 0;
  return <Record small={small} cover={track.coverUrl} label={track.title} progress={progress} playing={isPlaying} turn={turn} />;
}
