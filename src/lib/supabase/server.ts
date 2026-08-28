import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Crea un client Supabase da usare in Server Component, Route Handler e
 * Server Action. Usa ancora la chiave "anon" (le richieste restano protette
 * da RLS), ma legge/scrive la sessione dell'utente dai cookie della
 * richiesta corrente, così sa chi è l'utente loggato lato server.
 *
 * `cookies()` in Next.js è asincrono: questa funzione va sempre chiamata
 * con `await createClient()`.
 *
 * Nota sul blocco try/catch in `setAll`: un Server Component non può
 * scrivere cookie (solo leggerli) e Next.js lancia un errore se si prova.
 * Va bene ignorarlo qui perché in quel caso il refresh del token di
 * sessione è comunque già gestito dal middleware (vedi middleware.ts).
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Chiamato da un Server Component: nessuna azione necessaria,
            // vedi il commento sopra la funzione.
          }
        },
      },
    }
  );
}
