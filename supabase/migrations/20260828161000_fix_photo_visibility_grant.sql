-- ============================================================================
-- WanderQuest - Correzione privilegi colonna quest_completions (Fase 10)
-- ============================================================================
-- La migrazione precedente concedeva UPDATE solo su (status, is_public),
-- ma ha rotto anche il semplice INSERT del flusso "avvia Quest" (Fase 5):
-- supabase-js fa sempre un upsert con "on conflict (...) do update set
-- <tutte le colonne del payload>", e Postgres verifica il privilegio
-- UPDATE su ogni colonna nella clausola SET al momento di pianificare la
-- query, indipendentemente dal fatto che quella riga risulti poi un
-- inserimento pulito o un conflitto reale.
--
-- Serve quindi concedere UPDATE anche su user_id e quest_id (le colonne
-- del conflict target, che nella pratica non cambiano mai valore visto
-- che sono anche la chiave del match) oltre a status e is_public.
-- proof_url/proof_latitude/proof_longitude/completed_at restano
-- deliberatamente esclusi: scrivibili solo da complete_quest()
-- (security definer, non soggetta ai GRANT su authenticated).
revoke update on public.quest_completions from authenticated;
grant update (user_id, quest_id, status, is_public) on public.quest_completions to authenticated;
