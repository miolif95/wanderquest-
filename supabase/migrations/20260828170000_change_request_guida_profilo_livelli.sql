-- ============================================================================
-- WanderQuest - Change Request "Guida, Profilo, Livelli" - Sezione 1
-- ============================================================================
-- Estensione decisa dopo la creazione dell'alpha (vedi documento
-- "WanderQuest - Change Request per Claude Code"), applicata come delta
-- sopra la Technical Specification v1.0 già implementata: nessuna modifica
-- alle tabelle esistenti oltre all'aggiunta di colonne (nessun drop, nessun
-- rename) - vedi anche la Sezione 7 del change request, "Cosa NON cambia".
-- ============================================================================

-- Guida della destinazione a paragrafi espandibili (Sezione 1 / 3.1). La
-- label è testo libero (non un enum): l'admin può creare sezioni come
-- "Storia", "Cibi tipici", "Usanze" o qualunque altra categoria voglia,
-- senza bisogno di una migrazione ogni volta.
create table public.destination_sections (
  id uuid primary key default gen_random_uuid(),
  destination_id uuid not null references public.destinations(id) on delete cascade,
  label text not null,
  icon text,
  body text not null,
  sort_order integer not null default 0
);

alter table public.destination_sections enable row level security;

-- Sola lettura pubblica, stesso pattern di destinations/quests/achievements
-- (Tabella 2 della spec tecnica): nessuna policy insert/update/delete per
-- authenticated, la scrittura passa solo da service_role tramite il
-- pannello admin.
create policy "destination_sections_select_public" on public.destination_sections
  for select using (true);

-- Nuove colonne su quests per il Quest Detail a 4 componenti (Sezione 3.2)
-- e per lo sblocco condizionato (Sezione 2.1).
alter table public.quests add column deep_info text;
alter table public.quests add column completion_fact text;
alter table public.quests add column requires_quest_id uuid references public.quests(id) on delete set null;

-- Bucket per le foto profilo (Sezione 1), stesso modello di quest-proofs
-- (Sezione 5.5 della spec tecnica) ma pubblico in lettura, dato che i
-- profili sono già pubblici (Sezione 15 della spec tecnica).
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "avatars_public_read" on storage.objects
  for select using (bucket_id = 'avatars');

-- Stessa convenzione di path di quest-proofs ({user_id}/{filename}): solo
-- il proprietario può scrivere sotto la propria cartella, così un utente
-- non può sovrascrivere l'avatar_url di un altro puntando al suo path
-- Storage (checklist Sezione 6 del change request).
create policy "avatars_write_own" on storage.objects
  for insert with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- L'aggiornamento di un avatar (nuova foto che sostituisce la vecchia)
-- richiede anche poter sovrascrivere/rimuovere il file precedente nello
-- stesso path utente - stesso criterio di ownership delle altre policy.
create policy "avatars_update_own" on storage.objects
  for update using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_delete_own" on storage.objects
  for delete using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Indurimento di sicurezza scoperto implementando questa estensione: la
-- policy profiles_update_own (Sezione 5.4 della spec tecnica) autorizza
-- l'update dell'intera riga senza restrizioni di colonna, quindi finora un
-- client autenticato avrebbe potuto scrivere direttamente profiles.xp
-- (bypassando interamente il motore di completamento Quest) - nessun
-- codice client lo fa ancora oggi, ma la Sezione 3.3 di questo change
-- request introduce la PRIMA scrittura diretta da client su profiles
-- (avatar_url, bio), quindi è il momento giusto per restringere il grant
-- di colonna esattamente come già fatto per quest_completions (Fase 10,
-- migrazioni fix_photo_visibility_grant).
revoke update on public.profiles from authenticated;
grant update (avatar_url, bio) on public.profiles to authenticated;
