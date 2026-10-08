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
    <div className="bg-signature" style={{ maxWidth: 400, margin: "var(--space-xl) auto", padding: "0 var(--space-md)" }}>
      <h1 className="display-title" style={{ marginBottom: "var(--space-sm)" }}>Choose a username</h1>
      <p style={{ color: "var(--vynl-texte-2)", marginBottom: "var(--space-md)" }}>
        This is how other listeners and artists will see you.
      </p>
      <OnboardingForm />
    </div>
  );
}
