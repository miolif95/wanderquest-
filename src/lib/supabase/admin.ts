import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Client Supabase con la chiave "service_role": bypassa completamente le
 * policy di Row Level Security.
 *
 * USO CONSENTITO SOLO in Route Handler sotto src/app/api/**, mai in un
 * Server/Client Component e mai in codice che finisce nel bundle browser
 * (per costruzione non può succedere per errore: SUPABASE_SERVICE_ROLE_KEY
 * non ha il prefisso NEXT_PUBLIC_, quindi Next.js non la include mai nel
 * JavaScript inviato al client - ma resta comunque responsabilità di chi
 * scrive il codice non importare questo file da un Client Component).
 *
 * Corrisponde al principio guida dell'architettura (Sezione 4 della spec):
 * ogni scrittura che assegna una ricompensa di gioco, o che modifica
 * contenuti riservati all'admin (destinations/quests/achievements), passa
 * da qui - mai da una scrittura diretta del client protetta "solo" da RLS.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
