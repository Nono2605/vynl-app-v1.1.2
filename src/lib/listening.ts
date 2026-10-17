import { cache } from "react";
import { api } from "@/lib/api";

interface Me {
  profile: { explicit_content?: boolean | null } | null;
}

// Le réglage « Allow explicit content » de l'auditeur (vrai par défaut). Lu une fois par requête
// de page (cache), avec le même appel /me que l'en-tête, que Next ne fait donc qu'une fois. En cas
// d'échec on ne masque rien : le contrôle qui fait foi est celui de l'API au démarrage d'une lecture.
export const getAllowExplicit = cache(async (accessToken: string): Promise<boolean> => {
  try {
    const me = await api.get<Me>("/me", { accessToken });
    return me.profile?.explicit_content !== false;
  } catch {
    return true;
  }
});
