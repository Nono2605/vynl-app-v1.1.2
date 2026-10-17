import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { api } from "@/lib/api";
import { TrackGrid, type Track } from "@/components/TrackGrid";
import { AlbumGrid } from "@/components/AlbumGrid";
import { fetchAlbums } from "@/lib/albums";
import { FollowButton } from "@/components/FollowButton";
import { getSavedTrackIds } from "@/lib/savedTrackIds";
import { getAllowExplicit } from "@/lib/listening";
import { withExplicitFilter } from "@/lib/explicit";

interface ArtistDetail {
  id: string;
  name: string;
  bio: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  verified: boolean;
  /** Nombre de followers (le nombre seulement, jamais qui) ; null si l'API n'a pas pu le lire. */
  followers_count?: number | null;
  tracks: Omit<Track, "artists">[];
}

export default async function ArtistPage({ params }: { params: Promise<{ slug: string }> }) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  const { slug } = await params;

  const allowExplicit = await getAllowExplicit(session.access_token);

  let artist: ArtistDetail;
  try {
    artist = await api.get<ArtistDetail>(`/artists/${encodeURIComponent(slug)}${allowExplicit ? "" : "?explicit=false"}`);
  } catch {
    notFound();
  }

  const [{ following }, savedTrackIds, albumsRes] = await Promise.all([
    api.get<{ following: boolean }>(`/me/follows/${artist.id}`, { accessToken: session.access_token }),
    getSavedTrackIds(session.access_token),
    fetchAlbums(withExplicitFilter(`artist_id=${artist.id}&limit=50`, allowExplicit)),
  ]);

  const tracksWithArtist: Track[] = artist.tracks.map((t) => ({ ...t, artists: { name: artist.name } }));

  return (
    <div>
      <div
        style={{
          height: 200,
          background: artist.banner_url
            ? `url(${artist.banner_url}) center/cover`
            : "var(--vynl-banniere-vide)",
        }}
      />
      <div style={{ padding: "0 var(--space-lg)", marginTop: -48 }}>
        <div
          style={{
            width: 96,
            height: 96,
            borderRadius: "50%",
            border: "4px solid var(--vynl-nuit)",
            background: artist.avatar_url
              ? `url(${artist.avatar_url}) center/cover`
              : "var(--vynl-pochette-vide)",
            marginBottom: "var(--space-sm)",
          }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-md)", flexWrap: "wrap" }}>
          <h1 style={{ fontSize: "1.75rem" }}>
            {artist.name}
            {artist.verified && (
              <span title="Verified" style={{ color: "var(--vynl-reflet)" }}>
                {" "}
                ✓
              </span>
            )}
          </h1>
          <FollowButton artistId={artist.id} initialFollowing={following} followersCount={artist.followers_count ?? null} />
        </div>
        {artist.bio && (
          <p style={{ color: "var(--vynl-texte-2)", maxWidth: "60ch", marginTop: "var(--space-sm)" }}>
            {artist.bio}
          </p>
        )}

        <section style={{ marginTop: "var(--space-xl)" }}>
          <h2 style={{ fontSize: "1.125rem", marginBottom: "var(--space-md)" }}>Albums</h2>
          <AlbumGrid albums={albumsRes} emptyMessage="No releases published yet." />
        </section>

        <section style={{ marginTop: "var(--space-xl)", paddingBottom: "var(--space-xl)" }}>
          <h2 style={{ fontSize: "1.125rem", marginBottom: "var(--space-md)" }}>Tracks</h2>
          <TrackGrid
            tracks={tracksWithArtist}
            emptyMessage="No tracks published yet."
            savedTrackIds={savedTrackIds}
            source={{ context: "artist", id: artist.id }}
          />
        </section>
      </div>
    </div>
  );
}
