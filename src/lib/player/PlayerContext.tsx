"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { getStreamUrl, type StreamFailure, type StreamResult } from "@/app/actions/player";

export interface PlayerTrack {
  id: string;
  title: string;
  artistName: string;
  coverUrl: string | null;
}

interface PlayerState {
  track: PlayerTrack | null;
  /** L'<audio> joue (ou tente de jouer) — piloté par ses événements play/pause. */
  isPlaying: boolean;
  /** L'URL signée est en cours de récupération, ou la lecture démarre. */
  isLoading: boolean;
  /** L'<audio> attend des données (réseau lent, après un seek). */
  isBuffering: boolean;
  currentTime: number;
  duration: number;
  error: string | null;
}

interface PlayerContextValue extends PlayerState {
  play: (track: PlayerTrack) => void;
  toggle: () => void;
  seek: (seconds: number) => void;
  /** Arrête la lecture et vide le lecteur (ex. à la déconnexion). */
  stop: () => void;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function usePlayer(): PlayerContextValue {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used within PlayerProvider");
  return ctx;
}

const initialState: PlayerState = {
  track: null,
  isPlaying: false,
  isLoading: false,
  isBuffering: false,
  currentTime: 0,
  duration: 0,
  error: null,
};

const STREAM_ERRORS: Record<StreamFailure, string> = {
  unauthenticated: "Your session has expired. Log in again to keep listening.",
  not_found: "This track isn't available.",
  unavailable: "Couldn't reach the server. Press play to retry.",
};

// MediaError.code : 1 interrompu, 2 réseau, 3 décodage, 4 source inutilisable.
function mediaErrorMessage(code: number | undefined): string {
  if (code === 2) return "Connection lost. Press play to retry.";
  if (code === 3) return "This file couldn't be decoded.";
  return "This track couldn't be played.";
}

function isAbortError(err: unknown): boolean {
  return err instanceof DOMException && err.name === "AbortError";
}

function playErrorMessage(err: unknown): string {
  if (err instanceof DOMException && err.name === "NotAllowedError") {
    return "Playback was blocked by the browser. Press play to start.";
  }
  return "This track couldn't be played.";
}

// Le <audio> vit ici, monté une seule fois dans le layout racine : la
// lecture survit à la navigation client-side tant que ce Provider reste
// monté, ce qui est le cas puisqu'il enveloppe {children} au niveau racine.
//
// Deux sources de vérité distinctes :
//  - le state (affichage) est piloté par les événements de l'<audio> — ainsi
//    une touche média, un casque ou les contrôles du navigateur qui mettent en
//    pause restent reflétés dans l'interface ;
//  - les refs (décisions) disent ce qu'est réellement l'<audio> : quel morceau
//    a une source valide, lequel est en cours de chargement. Les callbacks
//    sont stables (useCallback sans dépendance au state), donc ils les lisent
//    plutôt que le state.
export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const trackRef = useRef<PlayerTrack | null>(null);
  /** Morceau dont l'<audio> a une source valide ; null après un échec ou stop(). */
  const loadedIdRef = useRef<string | null>(null);
  /** Morceau dont l'URL signée est en cours de récupération. */
  const fetchingIdRef = useRef<string | null>(null);
  /** Numéro de chargement : un résultat qui arrive après un autre choix est ignoré. */
  const requestRef = useRef(0);
  const playingRef = useRef(false);
  /** Morceau déjà rechargé automatiquement après une panne (une seule fois). */
  const refreshedIdRef = useRef<string | null>(null);
  const [state, setState] = useState<PlayerState>(initialState);

  const fail = useCallback((message: string) => {
    setState((s) => ({ ...s, isLoading: false, isBuffering: false, error: message }));
  }, []);

  const load = useCallback(
    async (track: PlayerTrack, opts: { resumeAt?: number; autoplay?: boolean; refresh?: boolean } = {}) => {
      const audio = audioRef.current;
      if (!audio) return;
      const { resumeAt = 0, autoplay = true, refresh = false } = opts;

      const request = ++requestRef.current;
      if (!refresh) refreshedIdRef.current = null;
      trackRef.current = track;
      loadedIdRef.current = null;
      fetchingIdRef.current = track.id;

      // Couper tout de suite l'ancien morceau : sans ça il reste audible
      // pendant toute la récupération de l'URL (long si l'API est à froid).
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      setState({ ...initialState, track, isLoading: true, currentTime: resumeAt });

      let result: StreamResult;
      try {
        result = await getStreamUrl(track.id);
      } catch {
        result = { ok: false, reason: "unavailable" };
      }
      if (requestRef.current !== request) return; // un autre morceau a été choisi entre-temps
      fetchingIdRef.current = null;
      if (!result.ok) {
        fail(STREAM_ERRORS[result.reason]);
        return;
      }

      audio.src = result.url;
      loadedIdRef.current = track.id;
      if (resumeAt > 0) {
        audio.addEventListener(
          "loadedmetadata",
          () => {
            if (requestRef.current === request) audio.currentTime = resumeAt;
          },
          { once: true }
        );
      }
      if (!autoplay) {
        setState((s) => ({ ...s, isLoading: false }));
        return;
      }

      try {
        await audio.play();
      } catch (err) {
        if (requestRef.current !== request) return;
        if (isAbortError(err)) {
          // Mis en pause pendant le démarrage : rien à signaler, juste finir le chargement.
          setState((s) => ({ ...s, isLoading: false }));
          return;
        }
        fail(playErrorMessage(err));
        return;
      }
      if (requestRef.current !== request) return;
      setState((s) => ({ ...s, isLoading: false }));
    },
    [fail]
  );

  const resume = useCallback(
    (audio: HTMLAudioElement) => {
      setState((s) => ({ ...s, error: null }));
      audio.play().catch((err) => {
        if (!isAbortError(err)) fail(playErrorMessage(err));
      });
    },
    [fail]
  );

  const play = useCallback(
    (track: PlayerTrack) => {
      const audio = audioRef.current;
      if (!audio) return;
      if (fetchingIdRef.current === track.id) return; // déjà en cours de chargement
      if (loadedIdRef.current === track.id) {
        resume(audio);
        return;
      }
      void load(track); // nouveau morceau, ou nouvel essai après un échec
    },
    [load, resume]
  );

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    const track = trackRef.current;
    if (!audio || !track || fetchingIdRef.current) return;
    if (loadedIdRef.current !== track.id) {
      void load(track); // le chargement précédent a échoué : on réessaie
      return;
    }
    if (audio.paused) resume(audio);
    else audio.pause();
  }, [load, resume]);

  const seek = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (!audio || !loadedIdRef.current) return;
    audio.currentTime = seconds;
    setState((s) => ({ ...s, currentTime: seconds }));
  }, []);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    requestRef.current++; // invalide tout chargement en cours
    trackRef.current = null;
    loadedIdRef.current = null;
    fetchingIdRef.current = null;
    refreshedIdRef.current = null;
    playingRef.current = false;
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }
    setState(initialState);
  }, []);

  const handleError = useCallback(
    (audio: HTMLAudioElement) => {
      // Sans source, c'est un reset volontaire (stop, changement de morceau),
      // pas une panne.
      if (!audio.getAttribute("src")) return;
      const track = trackRef.current;
      const code = audio.error?.code;
      if (!track || code === 1) return;

      // Réseau coupé ou URL signée expirée (valable 6 h) : on redemande une
      // URL et on reprend là où on en était — une seule fois par morceau.
      if (loadedIdRef.current === track.id && refreshedIdRef.current !== track.id && (code === 2 || code === 4)) {
        refreshedIdRef.current = track.id;
        void load(track, { resumeAt: audio.currentTime, autoplay: playingRef.current, refresh: true });
        return;
      }

      loadedIdRef.current = null; // le prochain clic sur lecture rechargera le morceau
      playingRef.current = false;
      setState((s) => ({
        ...s,
        isPlaying: false,
        isLoading: false,
        isBuffering: false,
        error: mediaErrorMessage(code),
      }));
    },
    [load]
  );

  return (
    <PlayerContext.Provider value={{ ...state, play, toggle, seek, stop }}>
      {children}
      <audio
        ref={audioRef}
        onPlay={() => {
          playingRef.current = true;
          setState((s) => ({ ...s, isPlaying: true, error: null }));
        }}
        onPause={() => {
          playingRef.current = false;
          setState((s) => ({ ...s, isPlaying: false, isBuffering: false }));
        }}
        onWaiting={() => setState((s) => ({ ...s, isBuffering: true }))}
        onPlaying={() => setState((s) => ({ ...s, isBuffering: false }))}
        onCanPlay={() => setState((s) => ({ ...s, isBuffering: false }))}
        // Lire currentTarget tout de suite : la fonction de mise à jour du
        // state passée à setState s'exécute de façon différée, et React a
        // déjà recyclé l'événement synthétique à ce moment-là (currentTarget
        // devient null) — d'où le crash "Cannot read properties of null".
        onTimeUpdate={(e) => {
          const currentTime = e.currentTarget.currentTime;
          setState((s) => ({ ...s, currentTime }));
        }}
        onDurationChange={(e) => {
          // NaN sans source, Infinity pour un flux sans durée : on affiche --:--.
          const duration = e.currentTarget.duration;
          setState((s) => ({ ...s, duration: Number.isFinite(duration) ? duration : 0 }));
        }}
        onEnded={() => {
          playingRef.current = false;
          setState((s) => ({ ...s, isPlaying: false, currentTime: 0 }));
        }}
        onError={(e) => handleError(e.currentTarget)}
      />
    </PlayerContext.Provider>
  );
}
