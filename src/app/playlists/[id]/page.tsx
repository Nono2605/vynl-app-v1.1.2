import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { api } from "@/lib/api";
import { formatDuration } from "@/lib/formatDuration";
import { removeTrackFromPlaylist, deletePlaylist } from "@/app/actions/playlists";
import { TrackPlayButton } from "@/components/TrackPlayButton";
import { PlayAllButton } from "@/components/PlayAllButton";
import { TrackIndex } from "@/components/TrackIndex";
import { TrackActions } from "@/components/TrackActions";
import { ProvenanceBadge } from "@/components/ProvenanceBadge";
import { ExplicitBadge } from "@/components/ExplicitBadge";
import { toProvenance, type Provenance } from "@/lib/provenance";
import { getSavedTrackIds } from "@/lib/savedTrackIds";
import type { PlayerTrack } from "@/lib/player/PlayerContext";
import { PlaylistVisibilityToggle } from "@/components/PlaylistVisibilityToggle";
import { SaveButton } from "@/components/SaveButton";
import { AddTrackSearch } from "./AddTrackSearch";

interface PlaylistTrack {
  id: string;
  title: string;
  duration_seconds: number | null;
  position: number;
  artists: { name: string } | null;
  /** Pochette de l'album du morceau : c'est elle que montrent la barre, la platine et l'écran verrouillé. */
  albums: { cover_url: string | null } | null;
  provenance?: Provenance | null;
  explicit?: boolean;
}

interface PlaylistDetail {
  id: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  is_public: boolean;
  is_owner: boolean;
  tracks: PlaylistTrack[];
}

export default async function PlaylistPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  const { id } = await params;

  let playlist: PlaylistDetail;
  try {
    playlist = await api.get<PlaylistDetail>(`/playlists/${id}`, { accessToken: session.access_token });
  } catch {
    notFound();
  }

  // Le cœur de chaque titre et celui de la playlist (celle d'un autre) : un échec ici ne doit pas
  // empêcher d'afficher la playlist.
  const [savedTrackIds, playlistSaved] = await Promise.all([
    getSavedTrackIds(session.access_token).catch(() => new Set<string>()),
    playlist.is_owner
      ? Promise.resolve(false)
      : api
          .get<{ saved: boolean }>(`/library/playlist/${id}`, { accessToken: session.access_token })
          .then((r) => r.saved)
          .catch(() => false),
  ]);

  const queue: PlayerTrack[] = playlist.tracks.map((t) => ({
    id: t.id,
    title: t.title,
    artistName: t.artists?.name ?? "Unknown artist",
    coverUrl: t.albums?.cover_url ?? null,
    provenance: toProvenance(t.provenance),
    explicit: t.explicit === true,
  }));

  // Sans pochette propre, la playlist prend celle de son premier morceau qui en a une.
  const headerCover = playlist.cover_url ?? queue.find((t) => t.coverUrl)?.coverUrl ?? null;

  return (
    <div style={{ padding: "var(--space-lg)", maxWidth: 720 }}>
      <div style={{ display: "flex", gap: "var(--space-lg)", marginBottom: "var(--space-xl)", flexWrap: "wrap" }}>
        <div
          style={{
            width: 140,
            height: 140,
            flex: "none",
            borderRadius: "var(--radius-md)",
            background: headerCover ? `url(${headerCover}) center/cover` : "var(--vynl-pochette-vide)",
          }}
        />
        <div style={{ alignSelf: "flex-end", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <h1 style={{ fontSize: "2rem" }}>{playlist.title}</h1>
          {playlist.description && <p style={{ color: "var(--vynl-texte-2)" }}>{playlist.description}</p>}
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-md)" }}>
            <PlayAllButton tracks={queue} source={{ context: "playlist", id: playlist.id }} />
            {!playlist.is_owner && <SaveButton itemType="playlist" itemId={playlist.id} initialSaved={playlistSaved} size={28} />}
          </div>
          {playlist.is_owner && (
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-md)" }}>
              <PlaylistVisibilityToggle playlistId={playlist.id} initialIsPublic={playlist.is_public} />
              <form action={deletePlaylist.bind(null, playlist.id)}>
                <button type="submit" className="btn-plain" style={{ color: "var(--vynl-erreur)" }}>
                  Delete playlist
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      <section style={{ marginBottom: "var(--space-xl)" }}>
        {playlist.tracks.length === 0 ? (
          <p style={{ color: "var(--vynl-texte-2)" }}>No tracks yet.</p>
        ) : (
          <ol style={{ listStyle: "none" }}>
            {playlist.tracks.map((track, index) => (
              <li
                key={track.id}
                className="list-row track-row"
              >
                <TrackIndex id={track.id} n={index + 1} />
                <TrackPlayButton
                  track={queue[index]}
                  size={28}
                  source={{ context: "playlist", id: playlist.id }}
                  queue={queue}
                />
                <span className="row-title">
                  <span>
                    {track.title}
                    <ExplicitBadge explicit={track.explicit} />{" "}
                    <span style={{ color: "var(--vynl-texte-2)" }}>· {track.artists?.name ?? "Unknown"}</span>
                  </span>
                  <ProvenanceBadge provenance={track.provenance} />
                </span>
                <span style={{ color: "var(--vynl-texte-3)", fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>
                  {formatDuration(track.duration_seconds)}
                </span>
                <TrackActions
                  track={queue[index]}
                  source={{ context: "playlist", id: playlist.id }}
                  saved={savedTrackIds.has(track.id)}
                />
                {playlist.is_owner && (
                  <form action={removeTrackFromPlaylist.bind(null, playlist.id, track.id)}>
                    <button
                      type="submit"
                      aria-label={`Remove ${track.title}`}
                      className="btn-plain"
                      style={{ color: "var(--vynl-texte-2)" }}
                    >
                      ✕
                    </button>
                  </form>
                )}
              </li>
            ))}
          </ol>
        )}
      </section>

      {playlist.is_owner && (
        <section>
          <h2 style={{ fontSize: "1.125rem", marginBottom: "var(--space-md)" }}>Add tracks</h2>
          <AddTrackSearch playlistId={playlist.id} />
        </section>
      )}
    </div>
  );
}
