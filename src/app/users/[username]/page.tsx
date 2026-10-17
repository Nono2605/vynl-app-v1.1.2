import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { api } from "@/lib/api";
import { PlaylistList, type PlaylistSummary } from "@/components/PlaylistList";
import { FollowUserButton } from "@/components/FollowUserButton";
import { EditProfilePanel } from "./EditProfilePanel";

interface UserProfile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_owner: boolean;
  is_following: boolean;
  followers_count: number;
  following_count: number;
  playlists: PlaylistSummary[];
}

export default async function UserProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  const { username } = await params;

  let profile: UserProfile;
  try {
    profile = await api.get<UserProfile>(`/users/${username}`, { accessToken: session.access_token });
  } catch {
    notFound();
  }

  return (
    <div style={{ padding: "var(--space-lg)", maxWidth: 720 }}>
      <div
        style={{
          display: "flex",
          gap: "var(--space-lg)",
          marginBottom: "var(--space-md)",
          flexWrap: "wrap",
          alignItems: "flex-end",
        }}
      >
        <div
          style={{
            width: 120,
            height: 120,
            flex: "none",
            borderRadius: "50%",
            background: profile.avatar_url
              ? `url(${profile.avatar_url}) center/cover`
              : "var(--vynl-pochette-vide)",
          }}
        />
        <div style={{ flex: 1, minWidth: 200 }}>
          <h1 style={{ fontSize: "1.75rem" }}>{profile.display_name || profile.username}</h1>
          <p style={{ color: "var(--vynl-texte-2)" }}>@{profile.username}</p>
          <div style={{ display: "flex", gap: "var(--space-md)", marginTop: "0.5rem" }}>
            <span style={{ color: "var(--vynl-texte-2)" }}>
              <strong style={{ color: "var(--vynl-texte)" }}>{profile.followers_count}</strong> followers
            </span>
            {/* « following » = les artistes et les utilisateurs suivis ; le détail des artistes est dans la bibliothèque. */}
            {profile.is_owner ? (
              <Link href="/library#following" className="text-link" style={{ color: "var(--vynl-texte-2)" }}>
                <strong style={{ color: "var(--vynl-texte)" }}>{profile.following_count}</strong> following
              </Link>
            ) : (
              <span style={{ color: "var(--vynl-texte-2)" }}>
                <strong style={{ color: "var(--vynl-texte)" }}>{profile.following_count}</strong> following
              </span>
            )}
          </div>
        </div>
        {!profile.is_owner && (
          <FollowUserButton userId={profile.id} initialFollowing={profile.is_following} />
        )}
      </div>

      {profile.bio && (
        <p style={{ color: "var(--vynl-texte-2)", maxWidth: "60ch", marginBottom: "var(--space-md)" }}>
          {profile.bio}
        </p>
      )}

      {profile.is_owner && (
        <EditProfilePanel
          username={profile.username}
          displayName={profile.display_name ?? ""}
          bio={profile.bio ?? ""}
        />
      )}

      <section style={{ marginTop: "var(--space-lg)" }}>
        <h2 style={{ fontSize: "1.125rem", marginBottom: "var(--space-md)" }}>
          {profile.is_owner ? "Playlists" : "Public playlists"}
        </h2>
        <PlaylistList
          playlists={profile.playlists}
          emptyMessage={profile.is_owner ? "No playlists yet." : "No public playlists yet."}
        />
      </section>
    </div>
  );
}
