import type { Metadata } from "next";
import { Dela_Gothic_One, Sora } from "next/font/google";
import { Suspense } from "react";
import { Nav, NavFallback } from "@/components/Nav";
import { PlayerProvider } from "@/lib/player/PlayerContext";
import { PlayerBar } from "@/components/PlayerBar";
import "./globals.css";

// Dela Gothic One : logo et grands titres d'impact uniquement. Sora : tout le
// reste. Les deux sont exposées en variables CSS, lues dans globals.css.
const delaGothic = Dela_Gothic_One({
  weight: "400",
  variable: "--font-dela-gothic",
  subsets: ["latin"],
});

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vynl",
  description: "Your music. Your artists. Your impact.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${delaGothic.variable} ${sora.variable}`}>
      <body>
        <PlayerProvider>
          <Suspense fallback={<NavFallback />}>
            <Nav />
          </Suspense>
          <main style={{ flex: 1, paddingBottom: "var(--player-bar-height)" }}>{children}</main>
          <PlayerBar />
        </PlayerProvider>
      </body>
    </html>
  );
}
