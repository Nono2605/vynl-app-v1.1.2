"use client";

import { usePlayer } from "@/lib/player/PlayerContext";
import { Record } from "@/components/Record";
import { PlayerRecord } from "@/components/PlayerRecord";

// Le grand disque du hero de Découvrir. Au repos, il montre la dernière sortie et
// tourne lentement, son arc avance tout seul (décor, comme sur le site). Dès qu'un
// morceau est chargé il devient le vrai lecteur : pochette, rotation et arc suivent
// ce qui joue.
export function HeroRecord({ cover, label }: { cover: string | null; label: string }) {
  const { track } = usePlayer();

  if (track) return <PlayerRecord turn={14} />;
  return <Record cover={cover} label={label} idle playing turn={40} />;
}
