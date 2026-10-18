// Ce que la platine (le lecteur plein écran) sait du morceau en cours, en plus de ce que porte le
// lecteur : l'artiste (pour le suivre) et l'état de l'auditeur (morceau déjà aimé, artiste déjà suivi).
// Dans un fichier à part parce qu'un module "use server" ne peut exporter que des fonctions asynchrones.

export interface TrackContext {
  artist: { id: string; name: string; slug: string } | null;
  album: { id: string; title: string } | null;
  /** Le morceau est déjà dans la bibliothèque de l'auditeur. */
  saved: boolean;
  /** L'auditeur suit déjà l'artiste. */
  following: boolean;
  /** Nombre de « j'aime » du morceau. */
  likes_count: number;
}

export type TrackContextResult = { ok: true; context: TrackContext } | { ok: false };
