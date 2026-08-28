-- ============================================================================
-- WanderQuest - Motore di completamento Quest (Fase 6, Sezioni 6, 8)
-- ============================================================================
-- Il completamento di una Quest tocca più tabelle contemporaneamente:
-- quest_completions (ACTIVE -> COMPLETED), profiles.xp, wanderstamps,
-- user_achievements. La spec tecnica (Sezione 8) richiede che tutto questo
-- avvenga "nella stessa transazione": supabase-js non espone transazioni
-- multi-statement lato client, quindi l'unico modo per garantirlo davvero
-- è una funzione Postgres che esegue tutto atomicamente in un round-trip.
--
-- La validazione specifica per tipo di completamento (distanza GPS,
-- proprietà della foto) resta nel Route Handler TypeScript, che replica
-- la funzione distanceMeters della Sezione 8 - questa funzione si occupa
-- solo della parte "assegna la ricompensa", chiamata SOLO dopo che quella
-- validazione ha già dato esito positivo.
-- ============================================================================

create or replace function public.complete_quest(
  p_quest_id uuid,
  p_proof_url text default null,
  p_proof_latitude double precision default null,
  p_proof_longitude double precision default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_quest public.quests%rowtype;
  v_completion public.quest_completions%rowtype;
  v_old_xp integer;
  v_new_xp integer;
  v_wanderstamp public.wanderstamps%rowtype;
  v_total_completions integer;
  v_category_count integer;
  v_destination_total_quests integer;
  v_destination_completed_quests integer;
  v_has_completed_destination boolean;
  v_already_unlocked uuid[];
  v_achievement public.achievements%rowtype;
  v_unlocked jsonb := '[]'::jsonb;
begin
  -- auth.uid() legge il JWT di chi ha chiamato la funzione, non
  -- dell'owner (security definer non lo cambia): usarlo invece di
  -- accettare uno user_id come parametro impedisce a un chiamante di
  -- completare Quest e assegnare XP a un altro utente.
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  select * into v_quest from public.quests where id = p_quest_id and is_active = true;
  if not found then
    raise exception 'quest_not_found';
  end if;

  -- "for update" blocca la riga: se per assurdo arrivassero due richieste
  -- di completamento in parallelo per la stessa Quest, la seconda aspetta
  -- che la prima finisca invece di leggere uno stato incoerente.
  select * into v_completion from public.quest_completions
    where user_id = v_user_id and quest_id = p_quest_id and status = 'ACTIVE'
    for update;
  if not found then
    raise exception 'quest_not_active';
  end if;

  update public.quest_completions
    set status = 'COMPLETED',
        completed_at = now(),
        proof_url = p_proof_url,
        proof_latitude = p_proof_latitude,
        proof_longitude = p_proof_longitude
    where id = v_completion.id;

  select xp into v_old_xp from public.profiles where id = v_user_id for update;
  v_new_xp := v_old_xp + v_quest.xp_reward;
  update public.profiles set xp = v_new_xp where id = v_user_id;

  -- Crea il WanderStamp al primo completamento in questa destinazione,
  -- altrimenti lo incrementa (Sezione 6.3).
  insert into public.wanderstamps (user_id, destination_id, quests_completed, xp_earned)
    values (v_user_id, v_quest.destination_id, 1, v_quest.xp_reward)
  on conflict (user_id, destination_id) do update
    set quests_completed = public.wanderstamps.quests_completed + 1,
        xp_earned = public.wanderstamps.xp_earned + v_quest.xp_reward,
        last_completed_at = now()
  returning * into v_wanderstamp;

  -- Statistiche per valutare gli achievement (Sezione 6.2), ricalcolate
  -- da zero ogni volta invece che mantenute come contatori denormalizzati:
  -- più lento ma impossibile da far disallineare.
  select count(*) into v_total_completions
    from public.quest_completions
    where user_id = v_user_id and status = 'COMPLETED';

  select count(*) into v_category_count
    from public.quest_completions qc
    join public.quests q on q.id = qc.quest_id
    where qc.user_id = v_user_id and qc.status = 'COMPLETED' and q.category = v_quest.category;

  select count(*) into v_destination_total_quests
    from public.quests
    where destination_id = v_quest.destination_id and is_active = true;

  select count(*) into v_destination_completed_quests
    from public.quest_completions qc
    join public.quests q on q.id = qc.quest_id
    where qc.user_id = v_user_id and qc.status = 'COMPLETED'
      and q.destination_id = v_quest.destination_id and q.is_active = true;

  v_has_completed_destination :=
    v_destination_total_quests > 0
    and v_destination_completed_quests >= v_destination_total_quests;

  select array_agg(achievement_id) into v_already_unlocked
    from public.user_achievements where user_id = v_user_id;

  -- Stessa logica di evaluateNewAchievements (Sezione 6.2), riscritta in
  -- plpgsql perché deve girare nella stessa transazione delle scritture
  -- sopra: un achievement sbloccato "quasi in contemporanea" a un XP non
  -- ancora salvato sarebbe uno stato incoerente da riparare a mano.
  for v_achievement in
    select * from public.achievements
    where id != all(coalesce(v_already_unlocked, array[]::uuid[]))
  loop
    if (
      (v_achievement.condition_type = 'FIRST_QUEST' and v_total_completions >= 1)
      or (v_achievement.condition_type = 'QUEST_COUNT'
          and v_total_completions >= (v_achievement.condition_value->>'count')::int)
      or (v_achievement.condition_type = 'CATEGORY_COUNT'
          and v_achievement.condition_value->>'category' = v_quest.category::text
          and v_category_count >= (v_achievement.condition_value->>'count')::int)
      or (v_achievement.condition_type = 'DESTINATION_COMPLETE' and v_has_completed_destination)
    ) then
      insert into public.user_achievements (user_id, achievement_id)
        values (v_user_id, v_achievement.id);
      v_unlocked := v_unlocked || jsonb_build_object(
        'id', v_achievement.id,
        'code', v_achievement.code,
        'name', v_achievement.name,
        'description', v_achievement.description,
        'icon', v_achievement.icon
      );
    end if;
  end loop;

  -- Il livello (Sezione 6.1) si calcola lato applicazione da oldXp/totalXp
  -- con la stessa funzione getLevel usata ovunque nell'app: non
  -- duplicarla qui evita che le due implementazioni possano divergere.
  return jsonb_build_object(
    'xpGained', v_quest.xp_reward,
    'oldXp', v_old_xp,
    'totalXp', v_new_xp,
    'achievementsUnlocked', v_unlocked,
    'wanderstamp', jsonb_build_object(
      'destinationId', v_quest.destination_id,
      'questsCompleted', v_wanderstamp.quests_completed,
      'xpEarned', v_wanderstamp.xp_earned
    )
  );
end;
$$;

comment on function public.complete_quest(uuid, text, double precision, double precision) is
  'Completa atomicamente una Quest ACTIVE per l''utente chiamante (auth.uid()): '
  'assegna XP, aggiorna il WanderStamp, sblocca gli achievement maturati. '
  'La validazione GPS/foto avviene PRIMA di chiamare questa funzione, nel '
  'Route Handler /api/quests/[questId]/complete.';

-- Di default Postgres concede EXECUTE su una nuova funzione a PUBLIC
-- (quindi anche al ruolo anon): lo revochiamo esplicitamente e lo
-- concediamo solo a chi ha una sessione autenticata, più a service_role
-- per eventuali strumenti interni futuri (es. un pannello di supporto che
-- forza un completamento). Il controllo su auth.uid() dentro la funzione
-- resta comunque la difesa primaria.
revoke execute on function public.complete_quest(uuid, text, double precision, double precision) from public;
grant execute on function public.complete_quest(uuid, text, double precision, double precision) to authenticated;
grant execute on function public.complete_quest(uuid, text, double precision, double precision) to service_role;
