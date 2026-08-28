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
    <div className="flex items-center justify-between gap-2 bg-gray-900 px-4 py-2 text-sm sm:px-6">
      <Link href="/" className="shrink-0 font-bold text-yellow-400">
        WanderQuest
      </Link>
      {/* gap ridotto e username troncato su schermi stretti (Sezione 37,
          mobile-first): senza questo, uno username lungo può spingere
          l'header oltre la larghezza dello schermo su un telefono. */}
      <div className="flex min-w-0 items-center gap-2 sm:gap-4">
        {user ? (
          <>
            <Link href="/passport" className="shrink-0 text-gray-300 hover:text-yellow-400">
              Passport
            </Link>
            <Link
              href="/profile"
              className="max-w-[7rem] truncate text-gray-300 hover:text-yellow-400"
            >
              {profile?.username}
            </Link>
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
