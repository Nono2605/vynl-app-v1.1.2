"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { logout } from "@/app/actions/auth";
import { usePlayer } from "@/lib/player/PlayerContext";

export function AccountMenu({
  profileHref,
  displayName,
}: {
  profileHref: string;
  displayName: string | null;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { stop } = usePlayer();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="btn-plain"
        style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span aria-hidden style={avatarStyle}>
          {displayName?.[0]?.toUpperCase() ?? "?"}
        </span>
        {displayName ?? "Account"}
      </button>

      {open && (
        <div role="menu" style={menuStyle}>
          <Link href={profileHref} role="menuitem" className="menu-item" onClick={() => setOpen(false)}>
            Profile
          </Link>
          <Link href="/account" role="menuitem" className="menu-item" onClick={() => setOpen(false)}>
            Settings
          </Link>
          <div style={{ borderTop: "1px solid var(--vynl-bordure)", margin: "0.35rem 0" }} />
          {/* Le lecteur survit à la navigation : sans stop(), la musique
              continuerait sur /login après la déconnexion. */}
          <form
            action={async () => {
              stop();
              await logout();
            }}
          >
            <button type="submit" role="menuitem" className="menu-item" style={{ width: "100%", textAlign: "left" }}>
              Log out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

const avatarStyle: React.CSSProperties = {
  width: 24,
  height: 24,
  borderRadius: "50%",
  background: "var(--vynl-vinyle)",
  border: "1px solid var(--vynl-sillon)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "0.75rem",
  fontWeight: 600,
  color: "var(--vynl-texte)",
};

const menuStyle: React.CSSProperties = {
  position: "absolute",
  top: "calc(100% + 0.5rem)",
  right: 0,
  minWidth: 160,
  background: "var(--vynl-abysse)",
  border: "1px solid var(--vynl-bordure)",
  borderRadius: "var(--vynl-rayon-carte)",
  boxShadow: "var(--shadow-card)",
  padding: "0.35rem",
  display: "flex",
  flexDirection: "column",
  zIndex: "var(--z-menu)",
};
