import { createClient } from "@/lib/supabase/server";
import { api } from "@/lib/api";
import { NavLink } from "@/components/NavLink";
import { AccountMenu } from "@/components/AccountMenu";
import { SiteHeader } from "@/components/SiteHeader";
import { SearchBox } from "@/components/SearchBox";

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
    <SiteHeader search={session ? <SearchBox /> : null}>
      <NavLink href="/discover">Discover</NavLink>
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
    </SiteHeader>
  );
}

// Affiché le temps que la session et le profil se chargent : le logo seul,
// sans liens, pour que l'en-tête ne saute pas à l'arrivée du contenu.
export function NavFallback() {
  return <SiteHeader />;
}
