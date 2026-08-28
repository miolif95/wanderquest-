"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Pulsante di logout (Fase 3). Chiama supabase.auth.signOut() lato
 * browser (che cancella anche i cookie di sessione grazie a
 * @supabase/ssr) e poi forza un refresh: senza router.refresh() la
 * navigazione client-side di Next.js potrebbe continuare a mostrare per
 * un istante dati caricati quando l'utente era ancora loggato.
 */
export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="text-sm text-gray-400 hover:text-yellow-400"
    >
      Esci
    </button>
  );
}
