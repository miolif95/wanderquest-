import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "./logout-button";

/**
 * Barra di stato login/logout mostrata in ogni pagina (Fase 3).
 *
 * Nota temporanea: la navigazione vera e propria dell'app (Home, menu,
 * ecc.) arriva con la Fase 4. Questo componente è un ponte minimo per
 * poter testare login/logout end-to-end fin da subito; verrà integrato
 * nella navigazione definitiva quando quella sarà pronta, non è pensato
 * per restare in questa forma nella UI finale.
 */
export async function AuthStatus() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="flex justify-end gap-4 bg-gray-900 px-6 py-2 text-sm">
        <Link href="/login" className="text-gray-300 hover:text-yellow-400">
          Accedi
        </Link>
        <Link href="/register" className="text-gray-300 hover:text-yellow-400">
          Registrati
        </Link>
      </div>
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex items-center justify-end gap-4 bg-gray-900 px-6 py-2 text-sm">
      <span className="text-gray-300">{profile?.username}</span>
      <LogoutButton />
    </div>
  );
}
