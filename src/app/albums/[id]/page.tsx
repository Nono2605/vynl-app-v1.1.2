import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { api } from "@/lib/api";
import { TrackPlayButton } from "@/components/TrackPlayButton";
import { formatDuration } from "@/lib/formatDuration";

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

  const releaseYear = album.release_date ? new Date(album.release_date).getFullYear() : null;

  return (
    <div style={{ padding: "var(--space-lg)", maxWidth: 720 }}>
      <div style={{ display: "flex", gap: "var(--space-lg)", marginBottom: "var(--space-xl)", flexWrap: "wrap" }}>
        <div
          style={{
            width: 180,
            height: 180,
            flex: "none",
            borderRadius: "var(--radius-md)",
            background: album.cover_url ? `url(${album.cover_url}) center/cover` : "var(--vynl-pochette-vide)",
          }}
        />
        <div style={{ alignSelf: "flex-end" }}>
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
          <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>{album.title}</h1>
          {album.artists && (
            <p style={{ color: "var(--vynl-texte-2)" }}>
              <Link href={`/artists/${album.artists.slug}`} className="text-link">
                {album.artists.name}
              </Link>
              {releaseYear && ` · ${releaseYear}`}
            </p>
          )}
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
                <span style={{ color: "var(--vynl-texte-3)", fontVariantNumeric: "tabular-nums", width: 24, textAlign: "right" }}>
                  {track.track_number ?? index + 1}
                </span>
                <TrackPlayButton
                  track={{
                    id: track.id,
                    title: track.title,
                    artistName: album.artists?.name ?? "Unknown artist",
                    coverUrl: album.cover_url,
                  }}
                  size={28}
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
