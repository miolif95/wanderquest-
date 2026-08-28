-- ============================================================================
-- WanderQuest - Storage: bucket e policy (Sezione 5.5 della spec tecnica)
-- ============================================================================
-- Recupero da Fase 1: la Sezione 5.5 era parte dello schema dati previsto
-- per la Fase 1 ma non era stata inclusa nella prima migrazione. Serve ora
-- perché il pannello admin (Fase 2) carica le immagini di destinazioni/Quest
-- nel bucket content-images.
-- ============================================================================

insert into storage.buckets (id, name, public)
values
  ('content-images', 'content-images', true),
  ('quest-proofs', 'quest-proofs', false)
on conflict (id) do nothing;

-- content-images: immagini di destinazioni/Quest caricate dal pannello
-- admin. Pubblico in lettura; la scrittura passa sempre da un Route
-- Handler /api/admin/* con service_role (stesso pattern usato per le
-- tabelle destinations/quests/achievements), quindi non serve una policy
-- INSERT per client autenticati.
create policy "content_images_public_read" on storage.objects
  for select using (bucket_id = 'content-images');

-- quest-proofs: foto-prova delle Quest fotografiche. Convenzione di path
-- {user_id}/{quest_completion_id}.jpg, necessaria perché le policy sotto
-- possano risalire al proprietario e allo stato di visibilità senza un
-- parsing fragile dell'URL. L'upload avviene client-side direttamente
-- verso Storage (Sezione 7), non tramite un Route Handler.
create policy "quest_proofs_read_own_or_public" on storage.objects
  for select using (
    bucket_id = 'quest-proofs'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or exists (
        select 1 from public.quest_completions qc
        where qc.id::text = split_part(split_part(storage.objects.name, '/', 2), '.', 1)
        and qc.is_public = true
      )
    )
  );

create policy "quest_proofs_write_own" on storage.objects
  for insert with check (
    bucket_id = 'quest-proofs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
