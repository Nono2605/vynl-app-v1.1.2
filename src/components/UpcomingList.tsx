"use client";

import type { PlayerTrack } from "@/lib/player/PlayerContext";
import { Icon } from "@/components/icons";
import { VinylCover } from "@/components/VinylCover";

// Les morceaux à venir : cliquer sur l'un le joue tout de suite (les précédents sont
// enjambés), la croix le retire de la file. Partagé par la fenêtre « Next up » du lecteur
// et la platine.
export function UpcomingList({
  items,
  onJump,
  onRemove,
  limit,
  disabled = false,
}: {
  items: readonly PlayerTrack[];
  onJump: (k: number) => void;
  onRemove: (k: number) => void;
  /** Nombre maximum de lignes affichées ; le reste est résumé en « and N more ». */
  limit?: number;
  disabled?: boolean;
}) {
  const shown = limit === undefined ? items : items.slice(0, limit);
  const hidden = items.length - shown.length;

  return (
    <>
      <ol className="upcoming">
        {shown.map((item, k) => (
          // Un même morceau peut être dans la file plusieurs fois : la position fait partie de la clé.
          <li key={`${item.id}-${k}`} className="upcoming__item">
            <button type="button" className="upcoming__main" onClick={() => onJump(k)} disabled={disabled}>
              <span className="upcoming__thumb">
                <VinylCover src={item.coverUrl} small />
              </span>
              <span className="upcoming__text">
                <span className="upcoming__name">{item.title}</span>
                <span className="upcoming__artist">{item.artistName}</span>
              </span>
            </button>
            <button
              type="button"
              className="upcoming__remove icon-btn"
              onClick={() => onRemove(k)}
              aria-label={`Remove ${item.title} from the queue`}
            >
              <Icon name="close" size={14} />
            </button>
          </li>
        ))}
      </ol>
      {hidden > 0 && <p className="upcoming__more">and {hidden} more</p>}
    </>
  );
}
