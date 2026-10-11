// Types partagés entre le menu d'un morceau (client) et ses actions serveur
// (un module "use server" ne peut exporter que des fonctions asynchrones).

export interface MenuPlaylist {
  id: string;
  title: string;
  is_public: boolean;
}

export type PlaylistsResult = { ok: true; playlists: MenuPlaylist[] } | { ok: false; error: string };
/** `added` : false quand le morceau était déjà dans la playlist (rien n'a été dupliqué). */
export type AddResult = { ok: true; added: boolean } | { ok: false; error: string };
export type CreateResult =
  | { ok: true; playlist: { id: string; title: string } }
  // `created` : la playlist existe mais le morceau n'a pas pu y être ajouté.
  | { ok: false; error: string; created?: { id: string; title: string } };

export const MAX_PLAYLIST_TITLE = 100;
