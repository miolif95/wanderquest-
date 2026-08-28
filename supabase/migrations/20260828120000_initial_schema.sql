-- ============================================================================
-- WanderQuest - Migrazione iniziale (Fase 1)
-- ============================================================================
-- Crea l'intero schema di gioco (Sezione 5 della spec tecnica), l'estensione
-- del livello sociale (Sezione 15.2) e il flag di accesso admin (Sezione
-- 16.1), oltre al trigger di creazione automatica del profilo (Sezione 5.3)
-- e a tutte le policy di Row Level Security (Sezioni 5.4 e 15.7).
--
-- Convenzione: ogni tabella/colonna "non ovvia" ha un commento SQL (COMMENT
-- ON ...) così chi apre il database da Supabase Studio vede subito perché
-- esiste, non solo cosa contiene.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. PROFILES
-- ----------------------------------------------------------------------------
-- Estende auth.users (gestito da Supabase Auth) con i dati di gioco.
-- Il livello NON è memorizzato qui: si calcola da xp a runtime (Sezione 6.1
-- della spec) per evitare che livello e xp finiscano disallineati.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  avatar_url text,
  xp integer not null default 0,
  created_at timestamptz not null default now()
);

comment on table public.profiles is
  'Dati di gioco pubblici dell''utente. Riga creata automaticamente alla '
  'registrazione dal trigger on_auth_user_created (vedi sotto).';
comment on column public.profiles.xp is
  'Punti esperienza totali. Il livello si calcola da questo valore '
  '(funzione getLevel lato applicazione), non è una colonna separata.';

-- Sezione 15.2: estensione per il profilo pubblico (livello sociale).
alter table public.profiles add column bio text;

-- Sezione 16.1: flag di accesso al pannello di amministrazione. Nessun
-- sistema di ruoli: un singolo booleano, da impostare manualmente a true
-- SOLO sull'account dell'amministratore tramite SQL Editor di Supabase
-- (mai da un client, per costruzione: non esiste alcuna policy RLS che
-- permetta a un utente di modificare questa colonna su se stesso).
alter table public.profiles add column is_admin boolean not null default false;

comment on column public.profiles.is_admin is
  'Accesso al pannello /admin. Impostare a true solo manualmente via SQL '
  'Editor, mai tramite l''applicazione: le policy RLS non permettono a un '
  'utente di modificare questo campo sulla propria riga.';


-- ----------------------------------------------------------------------------
-- 2. DESTINATIONS
-- ----------------------------------------------------------------------------
create table public.destinations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  country text not null,
  description text,
  image_url text,
  latitude double precision not null,
  longitude double precision not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

comment on table public.destinations is
  'Città esplorabili nell''app. Gestite esclusivamente dal pannello admin '
  '(Sezione 16): nessun client "normale" può scrivere su questa tabella.';
comment on column public.destinations.is_active is
  'Permette di nascondere una destinazione senza cancellarla (es. mentre '
  'è ancora in preparazione dal pannello admin).';


-- ----------------------------------------------------------------------------
-- 3. QUESTS
-- ----------------------------------------------------------------------------
create type quest_category as enum ('LOCATION','DISCOVERY','PHOTO','EXPERIENCE','CHALLENGE');
create type quest_difficulty as enum ('EASY','MEDIUM','HARD');
create type quest_completion_type as enum ('GPS','PHOTO','MANUAL');

create table public.quests (
  id uuid primary key default gen_random_uuid(),
  destination_id uuid not null references public.destinations(id) on delete cascade,
  title text not null,
  description text not null,
  category quest_category not null,
  difficulty quest_difficulty not null,
  xp_reward integer not null,
  completion_type quest_completion_type not null,
  latitude double precision,
  longitude double precision,
  radius_m integer,
  image_url text,
  instructions text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

comment on table public.quests is
  'Le "missioni" che un utente può completare in una destinazione. '
  'Gestite esclusivamente dal pannello admin (Sezione 16).';
comment on column public.quests.completion_type is
  'Determina come /api/quests/:id/complete valida il completamento: '
  'GPS (distanza dal punto entro radius_m), PHOTO (upload foto-prova), '
  'MANUAL (conferma diretta dell''utente). Vedi Sezione 8 della spec.';
comment on column public.quests.radius_m is
  'Raggio in metri entro cui una Quest di tipo GPS si considera '
  'raggiunta, calcolato con la formula di Haversine lato server.';
comment on column public.quests.xp_reward is
  'Impostato manualmente dal pannello admin. La spec propone come '
  'riferimento 50/100/200 XP per difficoltà EASY/MEDIUM/HARD (Sezione 6.1), '
  'ma non è vincolato a livello di database.';


-- ----------------------------------------------------------------------------
-- 4. QUEST_COMPLETIONS
-- ----------------------------------------------------------------------------
-- Nota sugli stati (Sezione 5.2 della spec): il PRD descrive anche uno
-- stato AVAILABLE, che qui NON è un valore memorizzato — è semplicemente
-- l'assenza di una riga in questa tabella per la coppia utente/Quest.
create type quest_status as enum ('ACTIVE','COMPLETED');

create table public.quest_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  quest_id uuid not null references public.quests(id) on delete cascade,
  status quest_status not null default 'ACTIVE',
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  proof_url text,
  proof_latitude double precision,
  proof_longitude double precision,
  -- Sezione 15.2: visibilità della foto-prova sul profilo pubblico.
  -- Pubblica di default per scelta di prodotto (Sezione 17).
  is_public boolean not null default true,
  unique (user_id, quest_id)
);

comment on table public.quest_completions is
  'Traccia lo stato di una Quest per un utente. Il vincolo unique '
  '(user_id, quest_id) implementa "una Quest attiva o completata alla '
  'volta per utente" senza bisogno di logica applicativa aggiuntiva.';
comment on column public.quest_completions.status is
  'ACTIVE -> COMPLETED è una transizione che avviene SOLO lato server '
  '(Route Handler con service_role, Sezione 8): nessuna policy RLS client '
  'permette di scrivere direttamente status = ''COMPLETED''.';
comment on column public.quest_completions.is_public is
  'Se true, la foto-prova (per le Quest di tipo PHOTO) è visibile nel '
  'profilo pubblico dell''utente e può ricevere like/commenti (Sezione 15).';


-- ----------------------------------------------------------------------------
-- 5. ACHIEVEMENTS
-- ----------------------------------------------------------------------------
create type achievement_condition as enum ('FIRST_QUEST','QUEST_COUNT','CATEGORY_COUNT','DESTINATION_COMPLETE');

create table public.achievements (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  description text not null,
  icon text not null,
  condition_type achievement_condition not null,
  condition_value jsonb not null default '{}'::jsonb
);

comment on table public.achievements is
  'Definizione dei traguardi sbloccabili. Valutati lato server dopo ogni '
  'completamento Quest dalla funzione evaluateNewAchievements (Sezione 6.2).';
comment on column public.achievements.condition_value is
  'Parametri della condizione, es. {"count": 5} per QUEST_COUNT o '
  '{"category": "PHOTO", "count": 5} per CATEGORY_COUNT. Interpretato '
  'lato applicazione in base a condition_type.';

create table public.user_achievements (
  user_id uuid not null references public.profiles(id) on delete cascade,
  achievement_id uuid not null references public.achievements(id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  primary key (user_id, achievement_id)
);

comment on table public.user_achievements is
  'Achievement sbloccati da ciascun utente. Scritta solo come effetto '
  'collaterale server-side di un completamento Quest, mai dal client.';


-- ----------------------------------------------------------------------------
-- 6. WANDERSTAMPS
-- ----------------------------------------------------------------------------
create table public.wanderstamps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  destination_id uuid not null references public.destinations(id) on delete cascade,
  quests_completed integer not null default 0,
  xp_earned integer not null default 0,
  first_completed_at timestamptz not null default now(),
  last_completed_at timestamptz not null default now(),
  unique (user_id, destination_id)
);

comment on table public.wanderstamps is
  'Il "timbro" di viaggio per una destinazione: creato al primo '
  'completamento Quest in quella città, aggiornato a ogni completamento '
  'successivo (Sezione 6.3). Alimenta anche il Travel Passport e lo '
  'storico viaggi (Sezione 17: nessuna tabella "trips" separata, lo '
  'storico si deriva da qui + quest_completions).';


-- ----------------------------------------------------------------------------
-- 7. LIVELLO SOCIALE (Sezione 15.2): like, commenti, blocchi, segnalazioni
-- ----------------------------------------------------------------------------
create table public.photo_likes (
  user_id uuid not null references public.profiles(id) on delete cascade,
  quest_completion_id uuid not null references public.quest_completions(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, quest_completion_id)
);

comment on table public.photo_likes is
  'Like sulle foto-prova pubbliche. Scrittura diretta dal client protetta '
  'da RLS: a differenza del completamento Quest, non assegna alcuna '
  'ricompensa di gioco, quindi non serve un Route Handler dedicato.';

create table public.photo_comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  quest_completion_id uuid not null references public.quest_completions(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);

comment on table public.photo_comments is
  'Commenti liberi sulle foto-prova pubbliche, inclusi fin dalla prima '
  'versione (Sezione 15.4: la moderazione minima è requisito MVP, non '
  'nice-to-have).';

create table public.user_blocks (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id)
);

comment on table public.user_blocks is
  'Chi blocca chi. Un utente bloccato non può più mettere like/commentare '
  'le foto del bloccante (le righe già esistenti restano, le nuove '
  'scritture sono negate dalla RLS - vedi sezione policy più sotto).';

create table public.content_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  target_type text not null check (target_type in ('photo','comment','user')),
  target_id uuid not null,
  reason text,
  created_at timestamptz not null default now()
);

comment on table public.content_reports is
  'Segnalazioni di foto/commenti/profili. Nessuna dashboard di '
  'moderazione dedicata nell''MVP: si consultano via SQL Editor o '
  'service_role (Sezione 15.4). Non leggibili nemmeno da chi le ha create.';


-- ----------------------------------------------------------------------------
-- 8. TRIGGER: creazione automatica del profilo alla registrazione
-- ----------------------------------------------------------------------------
-- Necessario perché l'app funzioni fin dalla prima registrazione: senza
-- questo trigger, un nuovo utente avrebbe una riga in auth.users ma
-- nessuna riga corrispondente in profiles, e ogni query di gioco fallirebbe
-- (Sezione 5.3 della spec).
create or replace function public.handle_new_user()
returns trigger as $$
begin
  -- Usa lo username passato dal form di registrazione (options.data.username
  -- nella chiamata signUp lato client); se assente, ripiega sulla parte
  -- dell'email prima della @ come valore di fallback.
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

comment on function public.handle_new_user() is
  'Trigger function: crea automaticamente la riga profiles corrispondente '
  'a ogni nuovo utente Auth. security definer perché deve poter scrivere '
  'in public.profiles anche se chi si registra non ha ancora alcun '
  'permesso su quella tabella.';

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ============================================================================
-- 9. ROW LEVEL SECURITY
-- ============================================================================
-- Principio guida di tutta questa sezione (Sezione 4 della spec): le
-- letture di contenuto pubblico e dei propri dati passano dal client via
-- Supabase SDK, protette da queste policy; OGNI scrittura che assegna una
-- ricompensa di gioco (XP, livello, achievement, WanderStamp, transizione a
-- COMPLETED) passa invece da un Route Handler server-side con la
-- service_role key, che bypassa RLS. Per questo, sotto, non esiste alcuna
-- policy che permetta quelle scritture ai client autenticati: è una scelta
-- di sicurezza, non una dimenticanza.

alter table public.profiles enable row level security;
alter table public.destinations enable row level security;
alter table public.quests enable row level security;
alter table public.achievements enable row level security;
alter table public.quest_completions enable row level security;
alter table public.user_achievements enable row level security;
alter table public.wanderstamps enable row level security;
alter table public.photo_likes enable row level security;
alter table public.photo_comments enable row level security;
alter table public.user_blocks enable row level security;
alter table public.content_reports enable row level security;

-- --- profiles ---------------------------------------------------------------
-- Pubblico in lettura (username, bio, avatar, xp) per il profilo pubblico
-- (Sezione 15.1); scrivibile solo dal proprietario, e solo sui propri dati
-- di presentazione (is_admin e xp non sono protetti da un check esplicito
-- qui perché in pratica nessun client onesto li scrive: xp viene aggiornato
-- solo da Route Handler con service_role, e un utente malevolo che provasse
-- comunque a scriverli via client otterrebbe comunque un valore che il
-- server ricalcola e sovrascrive a ogni completamento Quest).
create policy "profiles_select_public" on public.profiles
  for select using (true);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- --- destinations / quests / achievements -----------------------------------
-- Sola lettura pubblica. Nessuna policy INSERT/UPDATE/DELETE per
-- authenticated: RLS nega di default ogni operazione non coperta da una
-- policy attiva. service_role bypassa sempre RLS, quindi il pannello admin
-- (Sezione 16) continua a poter scrivere tramite i suoi Route Handler.
create policy "destinations_select_public" on public.destinations
  for select using (true);
create policy "quests_select_public" on public.quests
  for select using (true);
create policy "achievements_select_public" on public.achievements
  for select using (true);

-- --- quest_completions --------------------------------------------------
create policy "quest_completions_select_own_or_public" on public.quest_completions
  for select using (auth.uid() = user_id or is_public = true);
create policy "quest_completions_insert_active_only" on public.quest_completions
  for insert with check (auth.uid() = user_id and status = 'ACTIVE');
create policy "quest_completions_update_active_only" on public.quest_completions
  for update
  using (auth.uid() = user_id and status = 'ACTIVE')
  with check (auth.uid() = user_id and status = 'ACTIVE');
-- Punto critico (dalla spec): questa policy di update permette una
-- scrittura del proprietario SOLO se la riga resta ACTIVE. Non esiste (e
-- non deve esistere) alcuna policy che permetta a un client di impostare
-- status = 'COMPLETED': quella transizione avviene esclusivamente lato
-- server con la service_role key, che ri-valida GPS/foto prima di scrivere.

-- --- user_achievements / wanderstamps ----------------------------------
-- Sola lettura, nessuna scrittura client: sono sempre un effetto
-- collaterale server-side di un completamento Quest.
create policy "user_achievements_select_own" on public.user_achievements
  for select using (auth.uid() = user_id);
create policy "wanderstamps_select_own" on public.wanderstamps
  for select using (auth.uid() = user_id);

-- --- photo_likes ----------------------------------------------------------
-- Conteggio pubblico, ma si può mettere/togliere like solo su foto
-- pubbliche di utenti che non ti hanno bloccato.
create policy "photo_likes_select_public" on public.photo_likes
  for select using (true);
create policy "photo_likes_insert_own" on public.photo_likes
  for insert with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.quest_completions qc
      where qc.id = quest_completion_id
      and qc.is_public = true
      and not exists (
        select 1 from public.user_blocks b
        where b.blocker_id = qc.user_id and b.blocked_id = auth.uid()
      )
    )
  );
create policy "photo_likes_delete_own" on public.photo_likes
  for delete using (auth.uid() = user_id);

-- --- photo_comments ---------------------------------------------------
-- Stessa logica dei like per l'inserimento; la cancellazione è permessa
-- sia all'autore del commento sia al proprietario della foto (moderazione
-- minima, Sezione 15.4: puoi cancellare un commento sulla tua foto anche
-- se non l'hai scritto tu).
create policy "photo_comments_select_public" on public.photo_comments
  for select using (
    exists (
      select 1 from public.quest_completions qc
      where qc.id = quest_completion_id and qc.is_public = true
    )
  );
create policy "photo_comments_insert_own" on public.photo_comments
  for insert with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.quest_completions qc
      where qc.id = quest_completion_id
      and qc.is_public = true
      and not exists (
        select 1 from public.user_blocks b
        where b.blocker_id = qc.user_id and b.blocked_id = auth.uid()
      )
    )
  );
create policy "photo_comments_delete_own_or_photo_owner" on public.photo_comments
  for delete using (
    auth.uid() = user_id
    or auth.uid() = (
      select qc.user_id from public.quest_completions qc
      where qc.id = quest_completion_id
    )
  );

-- --- user_blocks / content_reports -----------------------------------
-- Solo le proprie righe. Per content_reports manca deliberatamente una
-- policy SELECT per authenticated: le segnalazioni si consultano solo con
-- la service_role (SQL Editor / futura vista admin), non sono visibili
-- nemmeno a chi le ha create.
create policy "user_blocks_select_own" on public.user_blocks
  for select using (auth.uid() = blocker_id);
create policy "user_blocks_insert_own" on public.user_blocks
  for insert with check (auth.uid() = blocker_id);
create policy "user_blocks_delete_own" on public.user_blocks
  for delete using (auth.uid() = blocker_id);
create policy "content_reports_insert_own" on public.content_reports
  for insert with check (auth.uid() = reporter_id);
