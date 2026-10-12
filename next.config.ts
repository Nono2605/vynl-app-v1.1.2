import type { NextConfig } from "next";

// En-têtes de sécurité (comme l'admin). Pas de Content-Security-Policy pour l'instant : Next.js
// insère des scripts en ligne, il faudrait des « nonces » ; à faire à part, avec des tests dans un
// vrai navigateur. L'en-tête HSTS est déjà ajouté par Vercel.
const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Pas d'iframe : l'app ne doit pas être embarquée dans une autre page (clic piégé).
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Le site d'origine est envoyé aux autres sites sans le chemin ni les paramètres.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
