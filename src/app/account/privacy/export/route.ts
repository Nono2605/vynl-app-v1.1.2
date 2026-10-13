import { NextResponse } from "next/server";
import { ApiError, api } from "@/lib/api";
import { createClient } from "@/lib/supabase/server";

// Télécharge toutes les données du compte (droit d'accès et de portabilité) : un fichier JSON préparé par
// l'API, qui ne renvoie que les données de ce compte. Rien n'est gardé ici.
export async function GET() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Please log in to download your data." }, { status: 401 });

  try {
    const data = await api.get<unknown>("/me/export", { accessToken: session.access_token });
    const day = new Date().toISOString().slice(0, 10);
    return new Response(JSON.stringify(data, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="vynl-data-${day}.json"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    if (err instanceof ApiError) {
      const message = err.status === 429 ? "You have downloaded your data too many times. Please try again in an hour." : err.message;
      return NextResponse.json({ error: message }, { status: err.status });
    }
    throw err;
  }
}
