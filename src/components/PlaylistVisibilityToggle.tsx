"use client";

import { useState, useTransition } from "react";
import { setPlaylistVisibility } from "@/app/actions/playlists";
import { GlobeIcon, LockIcon } from "@/components/icons";

export function PlaylistVisibilityToggle({
  playlistId,
  initialIsPublic,
}: {
  playlistId: string;
  initialIsPublic: boolean;
}) {
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [pending, startTransition] = useTransition();

  function toggle() {
    const next = !isPublic;
    setIsPublic(next); // optimiste — on réconcilie si l'appel échoue
    startTransition(async () => {
      try {
        await setPlaylistVisibility(playlistId, next);
      } catch {
        setIsPublic(!next);
      }
    });
  }

  return (
    <button
      onClick={toggle}
      disabled={pending}
      className="btn btn-secondary btn-sm"
      aria-pressed={isPublic}
    >
      {isPublic ? <GlobeIcon /> : <LockIcon />}
      {isPublic ? "Public" : "Private"}
    </button>
  );
}
