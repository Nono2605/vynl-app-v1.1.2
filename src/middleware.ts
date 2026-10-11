import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { POLICY_COOKIE, gateRedirect } from "@/lib/privacyGate";

// Rafraîchit le token Supabase à chaque requête. Sans ça, seuls les Server
// Actions peuvent réécrire les cookies (les Server Components ne le peuvent
// pas) et une session finit par expirer silencieusement en navigation pure.
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Écran d'accueil (âge + conditions) : seulement si l'interrupteur PRIVACY_GATE est « on ».
  // Voir lib/privacyGate.ts pour les règles ; le cookie n'est posé qu'après vérification
  // auprès de l'API (/welcome/ok).
  const redirectTo = gateRedirect({
    enabled: process.env.PRIVACY_GATE === "on",
    version: process.env.PRIVACY_POLICY_VERSION,
    hasUser: Boolean(user),
    method: request.method,
    pathname: request.nextUrl.pathname,
    search: request.nextUrl.search,
    cookieValue: request.cookies.get(POLICY_COOKIE)?.value,
  });

  if (redirectTo) {
    const redirect = NextResponse.redirect(new URL(redirectTo, request.url));
    // La session vient peut-être d'être rafraîchie : on garde ses cookies (avec leurs options).
    for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
    return redirect;
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
