"use client";

import { useEffect, useState } from "react";
import { getTrackContext } from "@/app/actions/nowPlaying";
import type { TrackContext } from "@/lib/nowPlaying";

export type TrackContextState =
  | { status: "loading" }
  | { status: "error" }
  // `version` change à chaque lecture fraîche : les boutons qui s'en servent comme `key` repartent de l'état à jour.
  | { status: "ready"; context: TrackContext; version: number };

interface Settled {
  trackId: string;
  attempt: number;
  version: number;
  context: TrackContext | null;
}

// Charge le contexte du morceau tant que `enabled` (la platine est ouverte), et le recharge à
// chaque changement de morceau ou de réouverture : on a pu aimer ou suivre ailleurs entre-temps.
// `retry` relance après un échec.
export function useTrackContext(trackId: string | null, enabled: boolean): TrackContextState & { retry: () => void } {
  const [settled, setSettled] = useState<Settled | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!enabled || !trackId) return;
    let cancelled = false;
    getTrackContext(trackId).then((result) => {
      if (cancelled) return;
      setSettled((previous) => ({
        trackId,
        attempt,
        version: (previous?.version ?? 0) + 1,
        context: result.ok ? result.context : null,
      }));
    });
    return () => {
      cancelled = true;
    };
  }, [enabled, trackId, attempt]);

  const retry = () => setAttempt((n) => n + 1);

  // Un résultat vaut pour SON morceau seulement : celui d'un morceau précédent, ou d'une tentative
  // plus ancienne, n'est jamais montré comme celui-ci.
  if (!settled || settled.trackId !== trackId) return { status: "loading", retry };
  if (!settled.context) return settled.attempt === attempt ? { status: "error", retry } : { status: "loading", retry };
  return { status: "ready", context: settled.context, version: settled.version, retry };
}
