-- ============================================================================
-- WanderQuest - Achievement pubblici sul profilo (Fase 10)
-- ============================================================================
-- La policy user_achievements_select_own (Sezione 5.4, pensata per la
-- Fase 7 "i tuoi achievement nel tuo profilo privato") permette di
-- leggere solo le proprie righe. Il profilo pubblico (Sezione 15.1)
-- deve però mostrare gli achievement sbloccati anche agli ALTRI utenti
-- che visitano quel profilo - qui mancava una policy per quel caso.
--
-- Nessun dato sensibile in questa tabella (solo quali achievement uno ha
-- sbloccato e quando), quindi renderla leggibile pubblicamente è
-- coerente con lo scopo "vetrina" della sezione achievement di un
-- profilo social.
create policy "user_achievements_select_public" on public.user_achievements
  for select using (true);
