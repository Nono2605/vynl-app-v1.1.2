import Link from "next/link";
import { TrackGrid, type Track } from "@/components/TrackGrid";
import { ArtistGrid, type Artist } from "@/components/ArtistGrid";
import type { Album } from "@/components/AlbumGrid";
import { Crate } from "@/components/Crate";
import { HeroRecord } from "@/components/HeroRecord";
import { PlayAllButton } from "@/components/PlayAllButton";
import type { PlayerTrack } from "@/lib/player/PlayerContext";

// Un mot du titre du hero : il monte derrière un masque (voir .w dans globals.css).
function Word({ d, children }: { d: number; children: React.ReactNode }) {
  return (
    <span className="w">
      <span style={{ "--d": d } as React.CSSProperties}>{children}</span>
    </span>
  );
}

// La page Découvrir, sans accès aux données : la page les charge et les passe ici.
// `albums` vaut null quand la liste n'a pas pu être chargée (voir fetchAlbums).
export function DiscoverView({
  albums,
  tracks,
  artists,
  savedTrackIds,
}: {
  albums: Album[] | null;
  tracks: Track[];
  artists: Artist[];
  savedTrackIds: Set<string>;
}) {
  const latest = tracks[0] ?? null;
  const queue: PlayerTrack[] = tracks.map((track) => ({
    id: track.id,
    title: track.title,
    artistName: track.artists?.name ?? "Unknown artist",
    coverUrl: track.albums?.cover_url ?? null,
  }));

  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <div>
          <p className="hero__eyebrow rise">New on Vynl</p>
          <h1 id="hero-title" className="hero__title">
            <span className="line">
              <Word d={0}>Tonight,</Word>
            </span>
            <span className="line line--grad">
              <Word d={1}>press</Word> <Word d={2}>play.</Word>
            </span>
          </h1>
          <p className="hero__lead rise" style={{ "--i": 1 } as React.CSSProperties}>
            The newest releases on Vynl, freshest first. Pick a disc and let it spin.
          </p>
          <div className="hero__actions rise" style={{ "--i": 2 } as React.CSSProperties}>
            {queue.length > 0 && <PlayAllButton tracks={queue} source={{ context: "discover" }} label="Play new tracks" />}
            <Link href="/search" className="btn btn-secondary">
              Search
            </Link>
          </div>
          {latest && (
            <p className="hero__latest rise" style={{ "--i": 3 } as React.CSSProperties}>
              Latest: <strong>{latest.title}</strong>
              {latest.artists ? ` · ${latest.artists.name}` : ""}
            </p>
          )}
        </div>
        <div className="hero__disc" aria-hidden="true">
          <HeroRecord cover={latest?.albums?.cover_url ?? null} label={latest?.title ?? "New releases"} />
        </div>
      </section>

      <div style={{ padding: "0 var(--space-lg) var(--space-lg)", display: "flex", flexDirection: "column", gap: "var(--space-xl)" }}>
        <section>
          <h2 data-reveal style={{ fontSize: "1.125rem", marginBottom: "var(--space-md)" }}>New releases</h2>
          <Crate albums={albums} emptyMessage="No releases published yet. Check back soon." />
        </section>

        <section>
          <h2 data-reveal style={{ fontSize: "1.125rem", marginBottom: "var(--space-md)" }}>New tracks</h2>
          <TrackGrid
            tracks={tracks}
            emptyMessage="No tracks published yet. Check back soon."
            savedTrackIds={savedTrackIds}
            source={{ context: "discover" }}
          />
        </section>

        <section>
          <h2 data-reveal style={{ fontSize: "1.125rem", marginBottom: "var(--space-md)" }}>Artists</h2>
          <ArtistGrid artists={artists} emptyMessage="No artists yet. Check back soon." />
        </section>
      </div>
    </>
  );
}
