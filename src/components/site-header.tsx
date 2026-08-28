import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { LogoutButton } from "./logout-button";

/**
 * Header in alto: solo logo + stato login/logout (Fase 4, semplificato
 * dopo l'introduzione della bottom nav a icone - Passport/Profilo/Amici/
 * Destinazioni vivono ora lì, non serve più duplicarli qui).
 *
 * Riceve user/username come props invece di fare la propria query
 * Supabase: root layout.tsx legge l'autenticazione una sola volta e la
 * passa sia a questo componente sia a BottomNav.
 */
export function SiteHeader({
  user,
  username,
}: {
  user: User | null;
  username: string | null;
}) {
  return (
    <div className="flex items-center justify-between gap-2 bg-gray-900 px-4 py-2 text-sm sm:px-6">
      <Link href="/" className="shrink-0 font-bold text-yellow-400">
        WanderQuest
      </Link>
      <div className="flex min-w-0 items-center gap-2 sm:gap-4">
        {user ? (
          <>
            {/* username troncato su schermi stretti (Sezione 37,
                mobile-first): senza questo, uno username lungo può
                spingere l'header oltre la larghezza dello schermo. */}
            <span className="max-w-[7rem] truncate text-gray-400">{username}</span>
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
