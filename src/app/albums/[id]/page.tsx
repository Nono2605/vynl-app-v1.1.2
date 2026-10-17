import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { api } from "@/lib/api";
import { AlbumView, type AlbumDetail } from "@/components/AlbumView";
import { getSavedTrackIds } from "@/lib/savedTrackIds";

export default async function AlbumPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  const { id } = await params;

  let album: AlbumDetail;
  try {
    album = await api.get<AlbumDetail>(`/albums/${id}`);
  } catch {
    notFound();
  }

  // Une erreur ici (API injoignable) ne doit pas empêcher d'afficher l'album : le
  // cœur repart simplement « non sauvegardé ».
  const [saved, savedTrackIds] = await Promise.all([
    api
      .get<{ saved: boolean }>(`/library/album/${id}`, { accessToken: session.access_token })
      .then((r) => r.saved)
      .catch(() => false),
    getSavedTrackIds(session.access_token).catch(() => new Set<string>()),
  ]);

  return <AlbumView album={album} saved={saved} savedTrackIds={savedTrackIds} />;
}
