import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { api } from "@/lib/api";
import { TrackPlayButton } from "@/components/TrackPlayButton";
import { formatDuration } from "@/lib/formatDuration";
import { VinylCover } from "@/components/VinylCover";
import { SaveButton } from "@/components/SaveButton";
import { PlayAllButton } from "@/components/PlayAllButton";
import { TrackIndex } from "@/components/TrackIndex";
import type { PlayerTrack } from "@/lib/player/PlayerContext";

interface AlbumTrack {
  id: string;
  title: string;
  duration_seconds: number | null;
  track_number: number | null;
}

interface AlbumDetail {
  id: string;
  title: string;
  cover_url: string | null;
  release_date: string | null;
  type: string;
  artists: { name: string; slug: string } | null;
  tracks: AlbumTrack[];
}

export default async function AlbumPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  const { id } = await params;

  let album: AlbumDetail;
  try {
    album = await api.get<AlbumDetail>(`/albums/${id}`);
  } catch {
    notFound();
  }

  // Une erreur ici (API injoignable) ne doit pas empêcher d'afficher l'album : le
  // cœur repart simplement « non sauvegardé ».
  const saved = await api
    .get<{ saved: boolean }>(`/library/album/${id}`, { accessToken: session.access_token })
    .then((r) => r.saved)
    .catch(() => false);

  const releaseYear = album.release_date ? new Date(album.release_date).getUTCFullYear() : null;
  const releaseDate = album.release_date
    ? new Date(album.release_date).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      })
    : null;

  // Durée totale : seulement si on connaît celle de chaque morceau, sinon on
  // afficherait un total faux.
  const durations = album.tracks.map((t) => t.duration_seconds);
  const totalSeconds = durations.every((d): d is number => d !== null)
    ? durations.reduce((sum, d) => sum + d, 0)
    : null;
  const queue: PlayerTrack[] = album.tracks.map((t) => ({
    id: t.id,
    title: t.title,
    artistName: album.artists?.name ?? "Unknown artist",
    coverUrl: album.cover_url,
  }));
  const summary = [
    releaseDate,
    `${album.tracks.length} ${album.tracks.length === 1 ? "track" : "tracks"}`,
    totalSeconds ? `${Math.max(1, Math.round(totalSeconds / 60))} min` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div style={{ padding: "var(--space-lg)", maxWidth: 800 }}>
      <div style={{ display: "flex", gap: "var(--space-lg)", marginBottom: "var(--space-xl)", flexWrap: "wrap" }}>
        <VinylCover src={album.cover_url} size={240} label={`Cover of ${album.title}`} />
        <div style={{ alignSelf: "flex-end", minWidth: 0, flex: 1 }}>
          <p
            style={{
              textTransform: "uppercase",
              fontSize: "0.75rem",
              letterSpacing: "0.05em",
              color: "var(--vynl-texte-2)",
              marginBottom: "0.35rem",
            }}
          >
            {album.type}
          </p>
          <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem", overflowWrap: "anywhere" }}>{album.title}</h1>
          {album.artists && (
            <p style={{ color: "var(--vynl-texte-2)" }}>
              <Link href={`/artists/${album.artists.slug}`} className="text-link">
                {album.artists.name}
              </Link>
              {releaseYear && ` · ${releaseYear}`}
            </p>
          )}
          <p style={{ color: "var(--vynl-texte-2)", fontSize: "0.875rem", marginTop: "0.25rem" }}>{summary}</p>
          <div style={{ marginTop: "var(--space-sm)", display: "flex", alignItems: "center", gap: "var(--space-md)" }}>
            <PlayAllButton tracks={queue} source={{ context: "album", id: album.id }} />
            <SaveButton itemType="album" itemId={album.id} initialSaved={saved} size={28} />
          </div>
        </div>
      </div>

      <section>
        {album.tracks.length === 0 ? (
          <p style={{ color: "var(--vynl-texte-2)" }}>No tracks published yet.</p>
        ) : (
          <ol style={{ listStyle: "none" }}>
            {album.tracks.map((track, index) => (
              <li
                key={track.id}
                className="list-row"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-md)",
                  padding: "0.65rem var(--space-sm)",
                  borderRadius: "var(--radius-sm)",
                  borderBottom: "1px solid var(--vynl-bordure)",
                }}
              >
                <TrackIndex id={track.id} n={track.track_number ?? index + 1} />
                <TrackPlayButton
                  track={queue[index]}
                  size={28}
                  source={{ context: "album", id: album.id }}
                  queue={queue}
                />
                <span style={{ flex: 1 }}>{track.title}</span>
                <span style={{ color: "var(--vynl-texte-3)", fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>
                  {formatDuration(track.duration_seconds)}
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
