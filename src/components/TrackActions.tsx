"use client";

import type { PlayerTrack } from "@/lib/player/PlayerContext";
import type { PlaySource } from "@/lib/player/types";
import { SaveButton } from "@/components/SaveButton";
import { TrackMenu } from "@/components/TrackMenu";

// Ce qu'on peut faire d'un morceau depuis une liste : le mettre en favori (cœur), et le
// menu « ⋯ » (file d'attente, playlists). Les deux sont côte à côte.
export function TrackActions({
  track,
  source,
  saved,
  likesCount,
}: {
  track: PlayerTrack;
  source?: PlaySource;
  saved: boolean;
  /** Nombre de « j'aime » du morceau, affiché à côté du cœur. */
  likesCount?: number | null;
}) {
  return (
    <div className="track-actions">
      <SaveButton itemType="track" itemId={track.id} initialSaved={saved} size={20} likesCount={likesCount ?? null} />
      <TrackMenu track={track} source={source} />
    </div>
  );
}
