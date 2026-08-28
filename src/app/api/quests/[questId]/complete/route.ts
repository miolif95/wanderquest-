import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { distanceMeters } from "@/lib/game/distance";
import { getLevel } from "@/lib/game/level";
import type { CompleteQuestResponse, UnlockedAchievement } from "@/lib/game/types";

/**
 * POST /api/quests/:questId/complete (Tabella 5 / Sezione 8 della spec
 * tecnica).
 *
 * Il payload atteso dipende dal completion_type della Quest:
 * - GPS:    { lat: number, lng: number }
 * - PHOTO:  { photoUrl: string }
 * - MANUAL: nessun payload
 *
 * Qui avviene SOLO la validazione specifica per tipo (distanza GPS,
 * proprietà della foto). La scrittura vera e propria - XP, WanderStamp,
 * achievement, tutto nella stessa transazione - è delegata alla funzione
 * Postgres complete_quest() (vedi la migrazione
 * 20260828150000_complete_quest_function.sql), che è anche l'unico punto
 * dove una Quest può passare da ACTIVE a COMPLETED: nessuna policy RLS
 * client-side lo permette (Sezione 5.4).
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
      { error: "Devi accedere per completare una Quest." },
      { status: 401 }
    );
  }

  const { data: quest } = await supabase
    .from("quests")
    .select("id, completion_type, latitude, longitude, radius_m")
    .eq("id", questId)
    .eq("is_active", true)
    .single();

  if (!quest) {
    return NextResponse.json({ error: "Quest non trovata." }, { status: 404 });
  }

  const { data: completion } = await supabase
    .from("quest_completions")
    .select("status")
    .eq("user_id", user.id)
    .eq("quest_id", questId)
    .maybeSingle();

  if (completion?.status !== "ACTIVE") {
    return NextResponse.json(
      { error: "Questa Quest non risulta attiva: avviala prima di completarla." },
      { status: 400 }
    );
  }

  let proofUrl: string | null = null;
  let proofLatitude: number | null = null;
  let proofLongitude: number | null = null;

  if (quest.completion_type === "GPS") {
    const body = await request.json().catch(() => null);
    const lat = body?.lat;
    const lng = body?.lng;
    if (typeof lat !== "number" || typeof lng !== "number") {
      return NextResponse.json(
        { error: "Posizione GPS mancante o non valida." },
        { status: 400 }
      );
    }
    if (quest.latitude == null || quest.longitude == null || quest.radius_m == null) {
      // Non dovrebbe succedere per una Quest GPS ben configurata dal
      // pannello admin, ma senza queste coordinate non c'è nulla da
      // validare: meglio un errore esplicito che un falso completamento.
      return NextResponse.json(
        { error: "Questa Quest non ha una posizione target configurata." },
        { status: 400 }
      );
    }
    const distance = distanceMeters(lat, lng, quest.latitude, quest.longitude);
    if (distance > quest.radius_m) {
      return NextResponse.json(
        {
          error: `Sei troppo lontano dal punto richiesto (${Math.round(distance)}m, raggio consentito ${quest.radius_m}m).`,
        },
        { status: 400 }
      );
    }
    proofLatitude = lat;
    proofLongitude = lng;
  }

  if (quest.completion_type === "PHOTO") {
    const body = await request.json().catch(() => null);
    const photoUrl = body?.photoUrl;
    if (typeof photoUrl !== "string") {
      return NextResponse.json({ error: "Foto mancante." }, { status: 400 });
    }
    // Il server verifica solo che l'URL appartenga al bucket/percorso
    // dell'utente (Sezione 8): l'upload è già avvenuto client-side
    // direttamente su Storage (Sezione 7), protetto dalla policy
    // quest_proofs_write_own che permette di scrivere solo sotto
    // {user_id}/... - questo è quindi un controllo di coerenza in più,
    // non l'unica barriera di sicurezza.
    const expectedPrefix = `/quest-proofs/${user.id}/`;
    let isOwnPath = false;
    try {
      isOwnPath = new URL(photoUrl).pathname.includes(expectedPrefix);
    } catch {
      isOwnPath = false;
    }
    if (!isOwnPath) {
      return NextResponse.json({ error: "Foto non valida." }, { status: 400 });
    }
    proofUrl = photoUrl;
  }

  const { data: result, error } = await supabase.rpc("complete_quest", {
    p_quest_id: questId,
    p_proof_url: proofUrl,
    p_proof_latitude: proofLatitude,
    p_proof_longitude: proofLongitude,
  });

  if (error) {
    if (error.message.includes("quest_not_active")) {
      return NextResponse.json(
        { error: "Questa Quest non risulta più attiva." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Completamento non riuscito." }, { status: 500 });
  }

  const data = result as {
    xpGained: number;
    oldXp: number;
    totalXp: number;
    achievementsUnlocked: UnlockedAchievement[];
    wanderstamp: { destinationId: string; questsCompleted: number; xpEarned: number };
  };

  const response: CompleteQuestResponse = {
    xpGained: data.xpGained,
    totalXp: data.totalXp,
    leveledUp: getLevel(data.totalXp) > getLevel(data.oldXp),
    newLevel: getLevel(data.totalXp),
    achievementsUnlocked: data.achievementsUnlocked,
    wanderstamp: data.wanderstamp,
  };

  return NextResponse.json(response);
}
