import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { api } from "@/lib/api";
import { NavLink } from "@/components/NavLink";
import { AccountMenu } from "@/components/AccountMenu";

interface Me {
  profile: { username: string } | null;
}

export async function Nav() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  let displayName: string | null = null;
  let username: string | null = null;
  if (session) {
    try {
      const me = await api.get<Me>("/me", { accessToken: session.access_token });
      username = me.profile?.username ?? null;
      displayName = username ?? session.user.email ?? null;
    } catch {
      displayName = session.user.email ?? null;
    }
  }

  return (
    <nav style={navStyle}>
      <Link href="/" className="font-brand" style={brandStyle}>
        Vynl
      </Link>
      <div style={{ display: "flex", gap: "var(--space-md)", alignItems: "center" }}>
        <NavLink href="/discover">Discover</NavLink>
        <NavLink href="/search">Search</NavLink>
        {session ? (
          <>
            <NavLink href="/library">Library</NavLink>
            <NavLink href="/playlists">Playlists</NavLink>
            <AccountMenu profileHref={username ? `/users/${username}` : "/account"} displayName={displayName} />
          </>
        ) : (
          <>
            <NavLink href="/login">Log in</NavLink>
            <NavLink href="/signup">Sign up</NavLink>
          </>
        )}
      </div>
    </nav>
  );
}

export function NavFallback() {
  return (
    <nav style={navStyle}>
      <span className="font-brand" style={brandStyle}>
        Vynl
      </span>
      <div style={{ display: "flex", gap: "var(--space-md)", alignItems: "center" }} />
    </nav>
  );
}

// Niveau 1 de profondeur : Abysse, une marche au-dessus du fond Nuit.
const navStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "var(--space-sm) var(--space-lg)",
  background: "var(--vynl-abysse)",
  borderBottom: "1px solid var(--vynl-bordure)",
};

// Dela Gothic One ne descend jamais sous 24 px (classe .font-brand).
const brandStyle: React.CSSProperties = {
  fontSize: "1.5rem",
  lineHeight: 1.2,
};
