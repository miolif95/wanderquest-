import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Equivalente di requireAdmin() ma per i Route Handler sotto
 * src/app/api/admin/**: invece di fare redirect() (che ha senso solo per
 * una navigazione di pagina), ritorna un oggetto discriminato che il
 * chiamante controlla con un `if`, restituendo subito la risposta di
 * errore pronta all'uso in caso di problemi.
 *
 * Esempio d'uso in un Route Handler:
 *   const auth = await requireAdminApi();
 *   if (!auth.authorized) return auth.response;
 *   // da qui in poi auth.user è garantito essere un admin autenticato
 */
export async function requireAdminApi(): Promise<
  | { authorized: true; user: { id: string } }
  | { authorized: false; response: NextResponse }
> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      authorized: false,
      response: NextResponse.json({ error: "Non autenticato" }, { status: 401 }),
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "Accesso riservato agli amministratori" },
        { status: 403 }
      ),
    };
  }

  return { authorized: true, user };
}
