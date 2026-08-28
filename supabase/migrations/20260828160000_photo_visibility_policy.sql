-- ============================================================================
-- WanderQuest - Visibilità foto: policy e privilegi di colonna (Fase 10)
-- ============================================================================
-- La policy quest_completions_update_active_only (Sezione 5.4) permette al
-- proprietario di scrivere solo se la riga resta ACTIVE - di proposito,
-- per impedire che un client possa alterare una Quest già completata.
-- Ma Sezione 15.5 richiede che l'utente possa rendere pubblica/privata
-- una foto-prova ANCHE dopo il completamento (status = COMPLETED).
--
-- Serve quindi una policy di update aggiuntiva per il proprietario, che
-- però da sola aprirebbe la porta a modificare QUALSIASI colonna della
-- riga (RLS decide se una riga è toccabile, non quali colonne cambiano
-- dentro lo stesso UPDATE). Per restare coerenti con "il client non deve
-- poter manomettere una Quest completata" si restringe quindi anche a
-- livello di privilegi di colonna: il ruolo authenticated può scrivere
-- SOLO status (necessario per l'upsert idempotente di avvio Quest, Fase
-- 5) e is_public - non proof_url/proof_latitude/proof_longitude/
-- completed_at, che restano scrivibili solo dalla funzione
-- complete_quest() (security definer, gira con i privilegi dell'owner
-- della tabella indipendentemente dai GRANT su authenticated).
create policy "quest_completions_update_own_visibility" on public.quest_completions
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

revoke update on public.quest_completions from authenticated;
grant update (status, is_public) on public.quest_completions to authenticated;
