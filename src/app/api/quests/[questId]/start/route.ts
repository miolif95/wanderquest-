import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/quests/:questId/start (Tabella 5 della spec tecnica).
 *
 * Porta una Quest da AVAILABLE (nessuna riga in quest_completions,
 * Sezione 5.2) ad ACTIVE. A differenza delle scritture del pannello
 * admin, qui NON serve la service_role key: avviare una Quest non
 * assegna alcuna ricompensa di gioco (niente XP, niente achievement),
 * quindi la policy RLS "quest_completions_insert_active_only" (Sezione
 * 5.4) può gestire la scrittura in sicurezza usando la sessione
 * dell'utente stesso - coerente con la Tabella 2 della spec
 * ("INSERT/UPDATE a stato ACTIVE consentito al proprietario via client").
 *
 * L'upsert su (user_id, quest_id) rende l'operazione idempotente: avviare
 * di nuovo una Quest già ACTIVE non crea righe duplicate e non tocca
 * started_at. Se la riga esistente è invece già COMPLETED, la policy di
 * update (che richiede lo stato corrente ACTIVE) blocca la scrittura e
 * qui si traduce quel rifiuto in un messaggio d'errore chiaro, invece di
 * propagare il generico errore Postgres.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ questId: string }> }
) {
  const { questId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Devi accedere per avviare una Quest." },
      { status: 401 }
    );
  }

  const { data: quest } = await supabase
    .from("quests")
    .select("id")
    .eq("id", questId)
    .eq("is_active", true)
    .single();

  if (!quest) {
    return NextResponse.json({ error: "Quest non trovata." }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("quest_completions")
    .upsert(
      { user_id: user.id, quest_id: questId, status: "ACTIVE" },
      { onConflict: "user_id,quest_id" }
    )
    .select("id, status, started_at")
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Questa Quest risulta già completata, non può essere riavviata." },
      { status: 409 }
    );
  }

  return NextResponse.json(data);
}
