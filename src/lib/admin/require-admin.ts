import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Guardia di accesso per le pagine sotto /admin/* (Sezione 16.2 della
 * spec: "Ogni pagina sotto /admin/* verifica is_admin lato server prima
 * di renderizzare qualunque form").
 *
 * Da chiamare come prima riga di ogni Server Component pagina dentro
 * src/app/admin/**: se l'utente non è loggato lo manda a /login, se è
 * loggato ma non è admin lo manda alla home. Se tutto è a posto, ritorna
 * l'utente autenticato così la pagina chiamante non deve rifare la stessa
 * query.
 *
 * Nota: qui si usa il client Supabase "anon" (non quello service_role):
 * la policy "profiles_select_public" (Sezione 5.4) permette a chiunque di
 * leggere is_admin di un profilo, quindi non serve bypassare RLS solo per
 * questo controllo di lettura.
 */
export async function requireAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin, username")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    redirect("/");
  }

  return { user, profile };
}
