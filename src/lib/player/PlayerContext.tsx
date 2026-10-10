"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { sendHeartbeat, startPlay } from "@/app/actions/player";
import type { HeartbeatState, PlayFailure, PlaySource, StartPlayResult } from "@/lib/player/types";

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
  /** `source` : d'où vient la lecture (album, playlist…), conservé avec l'écoute. */
  play: (track: PlayerTrack, source?: PlaySource) => void;
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

const PLAY_ERRORS: Record<PlayFailure, string> = {
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

// Identifiant d'UNE tentative de lecture : si la requête est rejouée (réseau
// instable), le serveur rend la même lecture au lieu d'en créer une seconde.
function newClientSessionId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
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
//
// Mesure de l'écoute (docs/SPEC_REMUNERATION.md) : chaque lecture démarre côté
// serveur (startPlay) et envoie des battements de cœur — au démarrage, toutes
// les ~15 s, à la pause, à la reprise, aux sauts, à la fin. Le serveur en tire
// les secondes écoutées ; le client n'en déclare aucune. Un battement perdu ne
// fait rien perdre : le suivant crédite tout l'intervalle d'après la position.
// Limite connue : à la fermeture brutale de l'onglet, les secondes écoulées
// depuis le dernier battement (15 s au plus) ne sont pas comptées.
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

  // Suivi de la lecture côté serveur.
  /** Lecture ouverte côté serveur ; null = aucune (il faudra en démarrer une). */
  const playIdRef = useRef<string | null>(null);
  const seqRef = useRef(0);
  const beatTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const beatEveryRef = useRef(15);
  /** Dernier état envoyé : évite de répéter « playing » à chaque fin de mise en mémoire tampon. */
  const beatStateRef = useRef<"playing" | "paused" | null>(null);
  const sourceRef = useRef<PlaySource | undefined>(undefined);

  const [state, setState] = useState<PlayerState>(initialState);

  const fail = useCallback((message: string) => {
    setState((s) => ({ ...s, isLoading: false, isBuffering: false, error: message }));
  }, []);

  const stopBeatTimer = useCallback(() => {
    if (beatTimerRef.current !== null) {
      clearInterval(beatTimerRef.current);
      beatTimerRef.current = null;
    }
  }, []);

  useEffect(() => stopBeatTimer, [stopBeatTimer]);

  // Envoie un battement. Ne bloque jamais l'écoute et n'échoue jamais.
  const beat = useCallback(
    (heartbeat: HeartbeatState, position?: number) => {
      const playId = playIdRef.current;
      const audio = audioRef.current;
      if (!playId || !audio) return;

      const at = position ?? audio.currentTime; // lu tout de suite, avant tout changement de source
      const seq = ++seqRef.current;
      beatStateRef.current = heartbeat === "playing" || heartbeat === "paused" ? heartbeat : null;

      void sendHeartbeat(playId, seq, Number.isFinite(at) ? at : 0, heartbeat).then((result) => {
        // Le serveur a clos cette lecture alors que nous n'avons rien demandé : un
        // autre appareil a pris le relais (un seul flux par compte). On arrête de
        // compter, et on met en pause plutôt que de laisser jouer sans être compté.
        if (result.status === "closed" && playIdRef.current === playId) {
          stopBeatTimer();
          playIdRef.current = null;
          beatStateRef.current = null;
          const current = audioRef.current;
          if (current && !current.paused) {
            current.pause();
            setState((s) => ({ ...s, error: "Playback moved to another device." }));
          }
        }
      });
    },
    [stopBeatTimer]
  );

  const startBeatTimer = useCallback(() => {
    stopBeatTimer();
    beatTimerRef.current = setInterval(() => {
      const audio = audioRef.current;
      if (audio && !audio.paused) beat("playing");
    }, beatEveryRef.current * 1000);
  }, [beat, stopBeatTimer]);

  // Clôt la lecture en cours : dernier battement (crédite la fin de l'intervalle),
  // puis on oublie la lecture. À appeler AVANT de toucher à la source de l'<audio>.
  const endPlay = useCallback(
    (heartbeat: "ended" | "closed", position?: number) => {
      stopBeatTimer();
      if (playIdRef.current) beat(heartbeat, position);
      playIdRef.current = null;
      beatStateRef.current = null;
    },
    [beat, stopBeatTimer]
  );

  const load = useCallback(
    async (
      track: PlayerTrack,
      opts: { resumeAt?: number; autoplay?: boolean; refresh?: boolean; source?: PlaySource } = {}
    ) => {
      const audio = audioRef.current;
      if (!audio) return;
      const { resumeAt = 0, autoplay = true, refresh = false } = opts;
      // `play()` passe toujours la clé `source` (même sans valeur) : un nouveau
      // morceau repart de SA source, il n'hérite pas de celle du précédent. Un
      // nouvel essai du même morceau (toggle, rechargement après panne) n'a pas la
      // clé et garde la source d'origine.
      if ("source" in opts) sourceRef.current = opts.source;

      const request = ++requestRef.current;
      if (!refresh) refreshedIdRef.current = null;

      // La lecture précédente se clôt avant que l'<audio> perde sa source : sinon
      // la position (et donc les dernières secondes écoutées) serait perdue.
      endPlay("closed");

      trackRef.current = track;
      loadedIdRef.current = null;
      fetchingIdRef.current = track.id;

      // Couper tout de suite l'ancien morceau : sans ça il reste audible
      // pendant toute la récupération de l'URL (long si l'API est à froid).
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      setState({ ...initialState, track, isLoading: true, currentTime: resumeAt });

      let result: StartPlayResult;
      try {
        result = await startPlay(track.id, sourceRef.current, newClientSessionId());
      } catch {
        result = { ok: false, reason: "unavailable" };
      }
      if (requestRef.current !== request) return; // un autre morceau a été choisi entre-temps
      fetchingIdRef.current = null;
      if (!result.ok) {
        fail(PLAY_ERRORS[result.reason]);
        return;
      }

      playIdRef.current = result.playId;
      seqRef.current = 0;
      beatStateRef.current = null;
      beatEveryRef.current = result.heartbeatEverySeconds;

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
    [endPlay, fail]
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
    (track: PlayerTrack, source?: PlaySource) => {
      const audio = audioRef.current;
      if (!audio) return;
      if (fetchingIdRef.current === track.id) return; // déjà en cours de chargement
      // Même morceau, source valide ET lecture encore ouverte : on reprend. Sinon
      // (échec, ou morceau terminé : réécouter = nouvelle lecture) on recharge.
      if (loadedIdRef.current === track.id && playIdRef.current !== null) {
        resume(audio);
        return;
      }
      void load(track, { source }); // la clé `source` est toujours présente, même si elle vaut undefined
    },
    [load, resume]
  );

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    const track = trackRef.current;
    if (!audio || !track || fetchingIdRef.current) return;
    if (loadedIdRef.current !== track.id || playIdRef.current === null) {
      void load(track); // le chargement précédent a échoué, ou le morceau est terminé
      return;
    }
    if (audio.paused) resume(audio);
    else audio.pause();
  }, [load, resume]);

  const seek = useCallback(
    (seconds: number) => {
      const audio = audioRef.current;
      if (!audio || !loadedIdRef.current) return;
      // Un saut change la position d'un coup : on date le départ AVANT de bouger
      // (position réelle d'avant le saut), l'arrivée étant posée par `seeked`. Sans
      // ça, un saut en arrière ferait perdre jusqu'à 15 s d'écoute déjà faite.
      // (On ne peut pas déduire cette position d'un événement : le navigateur peut
      // émettre `timeupdate` avant `seeking`, avec déjà la nouvelle position.)
      if (playIdRef.current && beatStateRef.current === "playing") beat("playing", audio.currentTime);
      audio.currentTime = seconds;
      setState((s) => ({ ...s, currentTime: seconds }));
    },
    [beat]
  );

  const stop = useCallback(() => {
    const audio = audioRef.current;
    endPlay("closed"); // avant de vider l'<audio> : on a besoin de sa position
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
  }, [endPlay]);

  const handleError = useCallback(
    (audio: HTMLAudioElement) => {
      // Sans source, c'est un reset volontaire (stop, changement de morceau),
      // pas une panne.
      if (!audio.getAttribute("src")) return;
      const track = trackRef.current;
      const code = audio.error?.code;
      if (!track || code === 1) return;

      // Réseau coupé ou URL signée expirée (valable 6 h) : on redemande une
      // URL et on reprend là où on en était — une seule fois par morceau. La
      // reprise ouvre une nouvelle lecture ; l'ancienne est close par load().
      if (loadedIdRef.current === track.id && refreshedIdRef.current !== track.id && (code === 2 || code === 4)) {
        refreshedIdRef.current = track.id;
        void load(track, { resumeAt: audio.currentTime, autoplay: playingRef.current, refresh: true });
        return;
      }

      endPlay("closed", audio.currentTime); // la panne met fin à cette lecture
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
    [endPlay, load]
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
          if (playIdRef.current && beatStateRef.current === "playing") {
            stopBeatTimer();
            beat("paused");
          }
        }}
        onWaiting={() => setState((s) => ({ ...s, isBuffering: true }))}
        onPlaying={() => {
          setState((s) => ({ ...s, isBuffering: false }));
          // Démarrage ou reprise réels : on pose la ligne de départ du chronométrage
          // côté serveur. Une fin de mise en mémoire tampon ne renvoie rien.
          if (playIdRef.current && beatStateRef.current !== "playing") {
            beat("playing");
            startBeatTimer();
          }
        }}
        onCanPlay={() => setState((s) => ({ ...s, isBuffering: false }))}
        // Fin d'un saut : on repart de la nouvelle position (le départ a été daté
        // par seek(), avant le saut).
        onSeeked={() => {
          if (playIdRef.current && beatStateRef.current === "playing") beat("playing");
        }}
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
        onEnded={(e) => {
          playingRef.current = false;
          setState((s) => ({ ...s, isPlaying: false, currentTime: 0 }));
          // Morceau terminé : la lecture se clôt. Réécouter ouvrira une nouvelle lecture.
          endPlay("ended", e.currentTarget.currentTime);
        }}
        onError={(e) => handleError(e.currentTarget)}
      />
    </PlayerContext.Provider>
  );
}
