import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Bug pre-esistente scoperto durante il seed di dati di test per fede4c:
 * il bucket quest-proofs è privato (Sezione 5.5 della spec tecnica), ma
 * ovunque nell'app si costruiva l'URL con getPublicUrl(), che genera un
 * link nella forma /object/public/... - quel percorso funziona SOLO per
 * bucket con public=true, quindi per un bucket privato risponde sempre
 * "Bucket not found" indipendentemente dalle policy RLS. In pratica
 * nessuna foto-prova ha mai effettivamente caricato un'immagine dalla
 * Fase 6 in poi: solo l'URL testuale veniva salvato/mostrato, mai
 * un'immagine vera.
 *
 * Fix: generare un URL firmato (createSignedUrl) al momento del render,
 * lato server, con il client di sessione già usato dalla pagina - non il
 * client service_role (che per convenzione di questo progetto è
 * consentito solo nei Route Handler sotto src/app/api/**). createSignedUrl
 * verifica comunque il permesso SELECT sull'oggetto secondo le stesse
 * policy RLS già corrette (quest_proofs_read_own_or_public, Sezione 5.5):
 * proprietario o foto con is_public = true, anche per un visitatore non
 * autenticato che guarda un profilo pubblico.
 *
 * Un'ora di validità è sufficiente perché viene rigenerato a ogni
 * caricamento della pagina - niente URL permanenti salvati da qualche
 * parte che smettano di funzionare o restino validi dopo che una foto
 * viene resa privata.
 */
const SIGNED_URL_EXPIRY_SECONDS = 60 * 60;

export async function resolveQuestProofUrl(
  supabase: SupabaseClient,
  rawUrl: string
): Promise<string | null> {
  const path = rawUrl.split("/quest-proofs/")[1];
  if (!path) return null;

  const { data, error } = await supabase.storage
    .from("quest-proofs")
    .createSignedUrl(path, SIGNED_URL_EXPIRY_SECONDS);

  if (error || !data) return null;
  return data.signedUrl;
}
