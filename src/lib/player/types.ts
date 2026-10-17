// Types partagés entre le lecteur (client) et ses actions serveur. Dans un
// fichier à part parce qu'un module "use server" ne peut exporter que des
// fonctions asynchrones.

/** D'où vient la lecture : conservé avec chaque écoute (statistiques, « d'où vient mon écoute »). */
export type PlaySourceContext = "album" | "playlist" | "artist" | "discover" | "search" | "library" | "track";

export interface PlaySource {
  context: PlaySourceContext;
  /** L'album, la playlist ou l'artiste concerné, quand il y en a un. */
  id?: string;
}

export type HeartbeatState = "playing" | "paused" | "ended" | "closed";

/** explicit_blocked : le morceau est explicite et l'auditeur a refusé ce contenu dans ses réglages. */
export type PlayFailure = "unauthenticated" | "not_found" | "explicit_blocked" | "unavailable";

export type StartPlayResult =
  | { ok: true; playId: string; url: string; format: string; heartbeatEverySeconds: number }
  | { ok: false; reason: PlayFailure };

/**
 * ok | duplicate | conflict : rien à faire côté lecteur.
 * closed : le serveur a clos cette lecture (un autre appareil a pris le relais).
 * error : le battement n'est pas passé ; le suivant rattrapera l'intervalle.
 */
export type HeartbeatResult = { status: "ok" | "duplicate" | "conflict" | "closed" | "error" };
