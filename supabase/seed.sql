-- ============================================================================
-- WanderQuest - Seed (Fase 1)
-- ============================================================================
-- Due parti distinte, vedi i commenti di ciascuna sezione:
--
-- 1) Achievement iniziali: sono contenuto "di prodotto" definito nella spec
--    tecnica (Sezione 6.2 / Tabella 4), referenziato per `code` dalla logica
--    di gioco lato applicazione. Va bene eseguirli anche in produzione.
--
-- 2) Dati di sviluppo: una destinazione e una Quest fittizie, SOLO per poter
--    testare in locale il flusso Quest -> completamento senza dover passare
--    dal pannello admin (che arriva in Fase 2). Il contenuto reale (Roma,
--    Sezione 12) verrà inserito dal pannello admin quando pronto: NON
--    eseguire questa seconda parte su un ambiente di produzione già avviato.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. Achievement iniziali (Tabella 4 della spec tecnica)
-- ----------------------------------------------------------------------------
insert into public.achievements (code, name, description, icon, condition_type, condition_value)
values
  ('first_quest', 'First Quest', 'Completa la tua prima Quest', '🎯', 'FIRST_QUEST', '{}'),
  ('explorer', 'Explorer', 'Completa 5 Quest', '🧭', 'QUEST_COUNT', '{"count": 5}'),
  ('adventurer', 'Adventurer', 'Completa 10 Quest', '🏔️', 'QUEST_COUNT', '{"count": 10}'),
  ('photographer', 'Photographer', 'Completa 5 Quest fotografiche', '📷', 'CATEGORY_COUNT', '{"category": "PHOTO", "count": 5}'),
  ('food_hunter', 'Food Hunter', 'Completa 3 Quest esperienziali', '🍝', 'CATEGORY_COUNT', '{"category": "EXPERIENCE", "count": 3}'),
  ('city_master', 'City Master', 'Completa tutte le Quest di una destinazione', '👑', 'DESTINATION_COMPLETE', '{}')
on conflict (code) do nothing;


-- ----------------------------------------------------------------------------
-- 2. Dati di sviluppo (solo per test locali)
-- ----------------------------------------------------------------------------
-- Una destinazione e tre Quest di prova, una per ciascun completion_type
-- (GPS/PHOTO/MANUAL), così da poter esercitare tutti e tre i flussi di
-- completamento della Sezione 8 senza passare dal pannello admin.
insert into public.destinations (id, name, country, description, latitude, longitude)
values (
  '00000000-0000-0000-0000-000000000001',
  '[DEV] Città di prova',
  'Italia',
  'Destinazione di test creata dal seed, non contenuto reale: da ignorare o rimuovere una volta pronto il pannello admin.',
  41.9028,
  12.4964
)
on conflict (id) do nothing;

insert into public.quests (
  destination_id, title, description, category, difficulty, xp_reward,
  completion_type, latitude, longitude, radius_m, instructions
)
values
  (
    '00000000-0000-0000-0000-000000000001',
    '[DEV] Quest GPS di prova',
    'Raggiungi il punto indicato per completare questa Quest di test.',
    'LOCATION', 'EASY', 50, 'GPS', 41.9028, 12.4964, 100,
    'Recati nelle vicinanze del punto indicato e conferma la posizione.'
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    '[DEV] Quest Foto di prova',
    'Carica una foto qualsiasi per completare questa Quest di test.',
    'PHOTO', 'MEDIUM', 100, 'PHOTO', null, null, null,
    'Scatta e carica una foto per completare la Quest.'
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    '[DEV] Quest Manuale di prova',
    'Conferma direttamente per completare questa Quest di test.',
    'EXPERIENCE', 'EASY', 50, 'MANUAL', null, null, null,
    'Conferma di aver completato l''esperienza.'
  );
