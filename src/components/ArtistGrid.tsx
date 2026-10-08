import Link from "next/link";

export interface Artist {
  id: string;
  name: string;
  slug: string;
  avatar_url: string | null;
  verified: boolean;
}

export function ArtistGrid({ artists, emptyMessage }: { artists: Artist[]; emptyMessage: string }) {
  if (artists.length === 0) {
    return <p style={{ color: "var(--vynl-texte-2)" }}>{emptyMessage}</p>;
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
        gap: "var(--space-md)",
      }}
    >
      {artists.map((artist) => (
        // /artists/[slug] arrive en Phase 2 — lien posé dès maintenant, cible pas encore construite.
        <Link
          key={artist.id}
          href={`/artists/${artist.slug}`}
          className="hover-card"
          style={{ textAlign: "center" }}
        >
          <div
            style={{
              width: "100%",
              aspectRatio: "1",
              borderRadius: "50%",
              marginBottom: "0.65rem",
              background: artist.avatar_url
                ? `url(${artist.avatar_url}) center/cover`
                : "var(--vynl-pochette-vide)",
            }}
          />
          <p style={{ fontWeight: 600, fontSize: "0.9375rem" }}>
            {artist.name}
            {artist.verified && (
              <span title="Verified" style={{ color: "var(--vynl-reflet)" }}>
                {" "}
                ✓
              </span>
            )}
          </p>
        </Link>
      ))}
    </div>
  );
}
