import { createBrowserClient } from "@supabase/ssr";

/**
 * Crea un client Supabase da usare nei Client Component (browser).
 *
 * Usa la chiave "anon": ogni richiesta fatta con questo client passa
 * comunque attraverso le policy di Row Level Security del database (vedi
 * supabase/migrations), quindi è sicuro esporlo al bundle client.
 *
 * Va chiamata una volta per componente/hook che ne ha bisogno (non è un
 * singleton globale): la libreria si occupa internamente di riusare la
 * stessa sessione tramite i cookie del browser.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
