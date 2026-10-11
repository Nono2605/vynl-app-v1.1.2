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
}: {
  track: PlayerTrack;
  source?: PlaySource;
  saved: boolean;
}) {
  return (
    <div className="track-actions">
      <SaveButton itemType="track" itemId={track.id} initialSaved={saved} size={20} />
      <TrackMenu track={track} source={source} />
    </div>
  );
}
