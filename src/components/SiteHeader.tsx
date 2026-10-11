"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/icons";

// Coque de l'en-tête : logo à gauche, recherche au centre, liens à droite (rendus
// par Nav, côté serveur, et passés en `search` et `children`). Sous 768 px la
// recherche et les liens passent dans un panneau que ce bouton ouvre ; il se
// referme tout seul à chaque navigation (le menu est « ouvert sur cette page »,
// pas « ouvert » tout court).
export function SiteHeader({ children, search }: { children?: React.ReactNode; search?: React.ReactNode }) {
  const pathname = usePathname();
  const [openAt, setOpenAt] = useState<string | null>(null);
  const open = openAt === pathname;

  return (
    <header className="site-header" data-open={open}>
      <div className="site-header__inner">
        <Link href="/" className="logo" aria-label="Vynl, home">
          <Image src="/brand/vynl-icon.png" alt="" width={36} height={36} priority />
          <span className="logo__word">Vynl</span>
        </Link>
        {children || search ? (
          <>
            <button
              type="button"
              className="nav-toggle btn-plain"
              aria-expanded={open}
              aria-controls="site-nav"
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpenAt(open ? null : pathname)}
            >
              <Icon name={open ? "close" : "menu"} size={24} />
            </button>
            <div id="site-nav" className="site-header__panel">
              {search ? <div className="site-header__search">{search}</div> : null}
              <nav className="site-header__nav" aria-label="Main">
                {children}
              </nav>
            </div>
          </>
        ) : null}
      </div>
    </header>
  );
}
