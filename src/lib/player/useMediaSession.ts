"use client";

import { useEffect, type RefObject } from "react";
import { mediaMetadataInit, positionStateInit, type MediaTrackInfo } from "@/lib/player/mediaSession";

// Branche le lecteur sur l'API Media Session du navigateur : l'écran verrouillé de l'iPhone ou
// d'Android, le centre de contrôle, les écouteurs et les touches média du clavier affichent le
// titre, l'artiste et la pochette, la barre de progression, et pilotent la lecture
// (lecture, pause, précédent, suivant, saut dans le morceau).
//
// Tout est facultatif : un navigateur sans Media Session, ou qui refuse une action, ne change
// rien à l'application (chaque appel est protégé).

interface Params {
  audioRef: RefObject<HTMLAudioElement | null>;
  track: MediaTrackInfo | null;
  isPlaying: boolean;
  hasNext: boolean;
  onPlay: () => void;
  onPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onSeek: (seconds: number) => void;
}

function supported(): boolean {
  return typeof navigator !== "undefined" && "mediaSession" in navigator;
}

function setHandler(action: MediaSessionAction, handler: MediaSessionActionHandler | null) {
  try {
    navigator.mediaSession.setActionHandler(action, handler);
  } catch {
    // action inconnue de ce navigateur
  }
}

export function useMediaSession({ audioRef, track, isPlaying, hasNext, onPlay, onPause, onNext, onPrevious, onSeek }: Params) {
  // Titre, artiste, pochette.
  useEffect(() => {
    if (!supported()) return;
    try {
      navigator.mediaSession.metadata = track ? new MediaMetadata(mediaMetadataInit(track, window.location.href)) : null;
    } catch {
      // pochette ou champ refusé : le morceau joue quand même, sans affichage enrichi
    }
  }, [track]);

  // Lecture ou pause (le téléphone l'utilise pour choisir l'icône du bouton).
  useEffect(() => {
    if (!supported()) return;
    navigator.mediaSession.playbackState = !track ? "none" : isPlaying ? "playing" : "paused";
  }, [track, isPlaying]);

  // Les boutons. « Suivant » n'existe que s'il y a un morceau après ; « précédent » existe
  // toujours quand un morceau joue (au-delà de 3 s il relance le morceau, comme dans l'app).
  const hasTrack = track !== null;
  useEffect(() => {
    if (!supported()) return;
    setHandler("play", hasTrack ? onPlay : null);
    setHandler("pause", hasTrack ? onPause : null);
    setHandler("previoustrack", hasTrack ? onPrevious : null);
    setHandler("nexttrack", hasTrack && hasNext ? onNext : null);
    setHandler("seekto", hasTrack ? (details) => typeof details.seekTime === "number" && onSeek(details.seekTime) : null);
    return () => {
      (["play", "pause", "previoustrack", "nexttrack", "seekto"] as const).forEach((action) => setHandler(action, null));
    };
  }, [hasTrack, hasNext, onPlay, onPause, onNext, onPrevious, onSeek]);

  // Barre de progression : le système avance tout seul à partir de cette position ; on la
  // renvoie quand quelque chose la change (durée connue, lecture, pause, saut).
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !supported() || !("setPositionState" in navigator.mediaSession)) return;
    const update = () => {
      try {
        const state = positionStateInit(audio.duration, audio.currentTime, audio.playbackRate);
        if (state) navigator.mediaSession.setPositionState(state);
        else navigator.mediaSession.setPositionState();
      } catch {
        // valeurs refusées par le navigateur
      }
    };
    const events = ["loadedmetadata", "durationchange", "play", "pause", "seeked", "ratechange"] as const;
    events.forEach((event) => audio.addEventListener(event, update));
    update();
    return () => events.forEach((event) => audio.removeEventListener(event, update));
  }, [audioRef]);
}
