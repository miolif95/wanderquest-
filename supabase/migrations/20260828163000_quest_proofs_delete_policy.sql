-- ============================================================================
-- WanderQuest - Policy DELETE mancante per quest-proofs (Fase 10)
-- ============================================================================
-- La migrazione storage_buckets.sql (recupero Fase 1) aveva definito solo
-- le policy SELECT e INSERT per il bucket quest-proofs. La Fase 10
-- introduce "Elimina foto" (Sezione 15.5 / Tabella 11), che chiama
-- storage.remove() lato client: senza una policy DELETE, RLS blocca la
-- cancellazione silenziosamente (storage.remove() non genera un errore
-- bloccante lato client se il file semplicemente non viene rimosso,
-- quindi il bug passava inosservato finché non si è verificato lo stato
-- reale del bucket dopo il click su "Elimina foto").
--
-- Stesso criterio di ownership già usato per INSERT: solo il proprietario
-- (primo segmento del path = auth.uid()) può cancellare la propria foto.
create policy "quest_proofs_delete_own" on storage.objects
  for delete using (
    bucket_id = 'quest-proofs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
