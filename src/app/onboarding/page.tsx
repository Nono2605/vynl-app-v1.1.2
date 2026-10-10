import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { api } from "@/lib/api";
import { OnboardingForm } from "./OnboardingForm";

interface Me {
  profile: { username: string } | null;
}

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  const me = await api.get<Me>("/me", { accessToken: session.access_token });
  if (me.profile) {
    redirect("/");
  }

  return (
    <div className="bg-signature surface-calme" style={authPanelStyle}>
      <h1 className="display-title" style={{ marginBottom: "var(--space-sm)" }}>Choose a username</h1>
      <p style={{ color: "var(--vynl-texte-2)", marginBottom: "var(--space-md)" }}>
        This is how other listeners and artists will see you.
      </p>
      <OnboardingForm />
    </div>
  );
}

// Panneau « calme » centré : le formulaire se détache du fond, la lueur du
// bg-signature reste visible autour. La largeur laisse 16 px de chaque côté sur mobile.
const authPanelStyle: React.CSSProperties = {
  maxWidth: 440,
  width: "calc(100% - 2 * var(--space-sm))",
  margin: "var(--space-xl) auto",
  padding: "var(--space-lg)",
};
