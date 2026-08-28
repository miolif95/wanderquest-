import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "./logout-button";

/**
 * Header pubblico minimo (Fase 4): logo/link alla Home a sinistra, stato
 * login/logout a destra (introdotto in Fase 3 come AuthStatus, ora parte
 * di un header vero e proprio).
 *
 * Resta un ponte verso la navigazione definitiva: menu completo,
 * selezione destinazione rapida ecc. arrivano con la rifinitura della
 * Fase 9. Compare anche sopra le pagine /admin/*, che hanno già una loro
 * intestazione separata (src/app/admin/layout.tsx) - la ridondanza visiva
 * è temporanea e accettabile finché la navigazione finale non sostituisce
 * questo componente.
 */
export async function SiteHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profile = user
    ? (
        await supabase.from("profiles").select("username").eq("id", user.id).single()
      ).data
    : null;

  return (
    <div className="flex items-center justify-between bg-gray-900 px-6 py-2 text-sm">
      <Link href="/" className="font-bold text-yellow-400">
        WanderQuest
      </Link>
      <div className="flex items-center gap-4">
        {user ? (
          <>
            <span className="text-gray-300">{profile?.username}</span>
            <LogoutButton />
          </>
        ) : (
          <>
            <Link href="/login" className="text-gray-300 hover:text-yellow-400">
              Accedi
            </Link>
            <Link href="/register" className="text-gray-300 hover:text-yellow-400">
              Registrati
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
