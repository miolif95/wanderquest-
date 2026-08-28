import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Guardia di accesso per le pagine che richiedono solo un utente loggato
 * (a differenza di requireAdmin, qui non serve is_admin). Usata dalle
 * pagine /profile/* e /passport (Fase 7): senza un account non ha senso
 * mostrare progressi, achievement o storico viaggi.
 */
export async function requireUser() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return { user, supabase };
}
