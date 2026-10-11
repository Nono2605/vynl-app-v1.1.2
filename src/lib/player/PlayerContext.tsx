"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { sendHeartbeat, startPlay } from "@/app/actions/player";
import type { HeartbeatState, PlayFailure, PlaySource, StartPlayResult } from "@/lib/player/types";
import {
  advance,
  clearUpcoming,
  emptyQueue,
  enqueue as enqueueInQueue,
  hasNext,
  hasPrevious,
  jump,
  previousAction,
  removeUpcoming,
  retreat,
  setShuffled,
  startQueue,
  upcoming as upcomingOf,
  type Queue,
} from "@/lib/player/queue";
import {
  readMuted,
  readShuffle,
  readVolume,
  writeMuted,
  writeShuffle,
  writeVolume,
} from "@/lib/player/preferences";

export interface PlayerTrack {
  id: string;
  title: string;
  artistName: string;
  coverUrl: string | null;
  /** D'où vient ce morceau quand il a été ajouté à la main à la file (sinon celle de la lecture en cours). */
  source?: PlaySource;
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
  /**
   * `source` : d'où vient la lecture (album, playlist…), conservé avec l'écoute.
   * `queue` : la liste d'où vient le morceau ; à la fin du morceau, le suivant de
   * cette liste démarre tout seul. Sans elle, le morceau joue seul.
   */
  play: (track: PlayerTrack, source?: PlaySource, queue?: readonly PlayerTrack[]) => void;
  toggle: () => void;
  seek: (seconds: number) => void;
  /** Morceau suivant de la file. Sans effet en fin de file ou pendant un chargement. */
  next: () => void;
  /** Relance le morceau s'il est entamé depuis plus de 3 s, sinon revient au précédent. */
  previous: () => void;
  hasNext: boolean;
  hasPrevious: boolean;
  /** La suite, dans l'ordre où elle sera jouée (ajouts manuels d'abord, puis la liste d'origine). */
  upcoming: readonly PlayerTrack[];
  /** Saute au k-ième morceau de la suite (ex. depuis la liste « Next up »). */
  jumpTo: (k: number) => void;
  /** Retire le k-ième morceau de la suite. */
  removeUpcoming: (k: number) => void;
  /** Vide la suite : le morceau en cours est le dernier. */
  clearUpcoming: () => void;
  /**
   * Ajoute un morceau à la file : « next » le joue juste après le morceau en cours, « last »
   * après les ajouts précédents. Si rien ne joue, il démarre.
   */
  enqueue: (track: PlayerTrack, mode: "next" | "last", source?: PlaySource) => void;
  /** Aléatoire : la suite de la liste est jouée dans le désordre. */
  shuffle: boolean;
  toggleShuffle: () => void;
  /** Volume de 0 à 1, et coupure du son (le volume réglé est gardé). */
  volume: number;
  muted: boolean;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  /** Vue « Now playing » (la platine) ouverte par-dessus l'app. */
  nowPlayingOpen: boolean;
  openNowPlaying: () => void;
  closeNowPlaying: () => void;
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
// Fermeture ou rechargement de la page : un dernier battement « closed » part en
// beacon (/api/plays/close) pour clore la lecture et créditer les secondes depuis
// le dernier battement. Seule une coupure brutale (crash, batterie, réseau) laisse
// la lecture ouverte ; elle est alors close au prochain démarrage, sans ces secondes.
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
  /** Source de la liste d'où vient la lecture (album, playlist…), pour les morceaux de la file. */
  const contextSourceRef = useRef<PlaySource | undefined>(undefined);

  // File d'attente : la liste d'où vient la lecture et la position dans cette liste.
  // La ref sert aux décisions (callbacks stables), le state seulement à l'affichage
  // des boutons Précédent / Suivant.
  // Réglages gardés d'une visite à l'autre. Rien ne s'affiche avant qu'un morceau soit
  // chargé (le lecteur est null au rendu serveur) : les lire ici ne désaccorde pas l'hydratation.
  const [initialQueue] = useState(() => emptyQueue<PlayerTrack>(readShuffle()));
  const queueRef = useRef<Queue<PlayerTrack>>(initialQueue);
  const [queueView, setQueueView] = useState<Queue<PlayerTrack>>(initialQueue);
  const [nowPlayingOpen, setNowPlayingOpen] = useState(false);
  const [volume, setVolumeState] = useState(readVolume);
  const [muted, setMuted] = useState(readMuted);

  const [state, setState] = useState<PlayerState>(initialState);

  const setQueue = useCallback((queue: Queue<PlayerTrack>) => {
    queueRef.current = queue;
    setQueueView(queue);
  }, []);

  // Le volume et le muet s'appliquent à l'<audio> (ignorés par iOS, qui garde le volume système).
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = Math.min(1, Math.max(0, volume));
    audio.muted = muted;
  }, [volume, muted]);

  const setVolume = useCallback((next: number) => {
    const value = Math.min(1, Math.max(0, Number.isFinite(next) ? next : 1));
    setVolumeState(value);
    writeVolume(value);
    // Monter le curseur depuis le muet rend le son, comme partout.
    if (value > 0) {
      setMuted(false);
      writeMuted(false);
    }
  }, []);

  const toggleMute = useCallback(() => {
    setMuted((current) => {
      writeMuted(!current);
      return !current;
    });
  }, []);

  const toggleShuffle = useCallback(() => {
    const next = !queueRef.current.shuffled;
    writeShuffle(next);
    setQueue(setShuffled(queueRef.current, next));
  }, [setQueue]);

  const openNowPlaying = useCallback(() => setNowPlayingOpen(true), []);
  const closeNowPlaying = useCallback(() => setNowPlayingOpen(false), []);

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

  // La page part (fermeture, rechargement, navigation hors de l'app) : on clôt la
  // lecture par un beacon, que le navigateur envoie même si la page disparaît.
  // pagehide plutôt que beforeunload/unload : c'est le seul événement fiable sur
  // mobile et avec le cache de navigation arrière/avant. Si la page revient de ce
  // cache, playIdRef est nul : le prochain clic sur Lecture ouvre une nouvelle lecture.
  useEffect(() => {
    function closeOnLeave() {
      const playId = playIdRef.current;
      const audio = audioRef.current;
      if (!playId || !audio) return;

      const position = Number.isFinite(audio.currentTime) ? Math.round(audio.currentTime * 1000) / 1000 : 0;
      const body = JSON.stringify({ play_id: playId, seq: ++seqRef.current, position_seconds: position });
      const sent = navigator.sendBeacon?.("/api/plays/close", new Blob([body], { type: "application/json" }));
      if (!sent) {
        void fetch("/api/plays/close", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body,
          keepalive: true,
        }).catch(() => {});
      }

      stopBeatTimer();
      playIdRef.current = null;
      beatStateRef.current = null;
    }

    window.addEventListener("pagehide", closeOnLeave);
    return () => window.removeEventListener("pagehide", closeOnLeave);
  }, [stopBeatTimer]);

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

  // Joue le morceau courant d'une file qu'on vient de faire avancer (suivant, précédent,
  // saut, enchaînement). Source : celle du morceau s'il a été ajouté à la main, sinon la
  // lecture d'origine (l'album, la playlist…) ; toujours posée, pour qu'un ajout manuel
  // ne laisse pas sa source au morceau d'après.
  const startFromQueue = useCallback(
    (queue: Queue<PlayerTrack>) => {
      const track = queue.current;
      if (!track) return;
      setQueue(queue);
      void load(track, { source: track.source ?? contextSourceRef.current });
    },
    [load, setQueue]
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
    (track: PlayerTrack, source?: PlaySource, queue?: readonly PlayerTrack[]) => {
      const audio = audioRef.current;
      if (!audio) return;
      if (fetchingIdRef.current === track.id) return; // déjà en cours de chargement
      setQueue(startQueue(queueRef.current, track, queue));
      contextSourceRef.current = source;
      // Même morceau, source valide ET lecture encore ouverte : on reprend. Sinon
      // (échec, ou morceau terminé : réécouter = nouvelle lecture) on recharge.
      if (loadedIdRef.current === track.id && playIdRef.current !== null) {
        resume(audio);
        return;
      }
      void load(track, { source }); // la clé `source` est toujours présente, même si elle vaut undefined
    },
    [load, resume, setQueue]
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

  const next = useCallback(() => {
    // Pendant un chargement on ignore : chaque démarrage ouvre une lecture côté
    // serveur, en enchaîner trois d'affilée en laisserait deux vides.
    if (fetchingIdRef.current) return;
    const queue = advance(queueRef.current);
    if (queue) startFromQueue(queue);
  }, [startFromQueue]);

  const previous = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || fetchingIdRef.current) return;
    const action = previousAction(queueRef.current, audio.currentTime);
    if (action.kind === "back") {
      const queue = retreat(queueRef.current);
      if (queue) startFromQueue(queue);
      return;
    }
    const track = trackRef.current;
    if (!track) return;
    // Lecture déjà close (morceau fini ou en panne) : on le relance, sinon on revient au début.
    if (playIdRef.current === null) void load(track);
    else seek(0);
  }, [startFromQueue, load, seek]);

  const jumpTo = useCallback(
    (k: number) => {
      if (fetchingIdRef.current) return;
      const queue = jump(queueRef.current, k);
      if (queue) startFromQueue(queue);
    },
    [startFromQueue]
  );

  const removeFromUpcoming = useCallback((k: number) => setQueue(removeUpcoming(queueRef.current, k)), [setQueue]);
  const clearAllUpcoming = useCallback(() => setQueue(clearUpcoming(queueRef.current)), [setQueue]);

  const enqueue = useCallback(
    (track: PlayerTrack, mode: "next" | "last", source?: PlaySource) => {
      // Rien ne joue : « ajouter à la file » démarre le morceau, il n'y a pas de file à rejoindre.
      if (!queueRef.current.current) {
        play(track, source);
        return;
      }
      setQueue(enqueueInQueue(queueRef.current, source ? { ...track, source } : track, mode));
    },
    [play, setQueue]
  );

  const stop = useCallback(() => {
    const audio = audioRef.current;
    endPlay("closed"); // avant de vider l'<audio> : on a besoin de sa position
    setQueue(emptyQueue<PlayerTrack>(queueRef.current.shuffled));
    setNowPlayingOpen(false); // sinon la platine se rouvrirait à la prochaine lecture
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
  }, [endPlay, setQueue]);

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

  const upcoming = useMemo(() => upcomingOf(queueView), [queueView]);

  return (
    <PlayerContext.Provider
      value={{
        ...state,
        hasNext: hasNext(queueView),
        hasPrevious: hasPrevious(queueView),
        upcoming,
        jumpTo,
        removeUpcoming: removeFromUpcoming,
        clearUpcoming: clearAllUpcoming,
        enqueue,
        shuffle: queueView.shuffled,
        toggleShuffle,
        volume,
        muted,
        setVolume,
        toggleMute,
        nowPlayingOpen: nowPlayingOpen && state.track !== null,
        openNowPlaying,
        closeNowPlaying,
        play,
        toggle,
        seek,
        next,
        previous,
        stop,
      }}
    >
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
          // Enchaînement : le morceau suivant de la file démarre tout seul.
          const queue = advance(queueRef.current);
          if (queue) startFromQueue(queue);
        }}
        onError={(e) => handleError(e.currentTarget)}
      />
    </PlayerContext.Provider>
  );
}
