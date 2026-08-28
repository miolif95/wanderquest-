import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Stato derivato di una Quest per un utente (Change Request "Guida,
 * Profilo, Livelli", Sezione 2.1). Non è mai memorizzato: si calcola da
 * quest_completions più, per le Quest con un prerequisito, dallo stato del
 * prerequisito stesso - un'estensione della stessa logica "AVAILABLE non è
 * un valore in tabella" già usata da tutte le pagine di lettura Quest fin
 * dalla Fase 4/5 della Technical Specification.
 *
 * Condiviso da Quest List, Quest Detail e Map così che le tre pagine non
 * possano mai calcolare lo stato in modo divergente (stesso principio
 * applicato a getLevelProgress in lib/game/level.ts).
 */
export type QuestStatus = "AVAILABLE" | "ACTIVE" | "COMPLETED" | "LOCKED";

export function deriveQuestStatus(
  completionStatus: string | undefined,
  requiresQuestId: string | null,
  prerequisiteIsCompleted: boolean
): QuestStatus {
  if (completionStatus === "COMPLETED") return "COMPLETED";
  if (completionStatus === "ACTIVE") return "ACTIVE";
  if (requiresQuestId && !prerequisiteIsCompleted) return "LOCKED";
  return "AVAILABLE";
}

/**
 * Rivalidazione server-side dello stato LOCKED (Sezione 2.2): usata dai
 * Route Handler di avvio e completamento Quest, che non devono fidarsi
 * dello stato mostrato in UI - un client malevolo potrebbe chiamare
 * l'API direttamente saltando l'interfaccia che disabilita il pulsante.
 * Ritorna true se la Quest ha un prerequisito e questo NON risulta
 * COMPLETED per l'utente indicato.
 */
export async function isQuestLocked(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- il tipo concreto varia tra client browser/server/admin, solo .from() serve qui
  supabase: SupabaseClient<any, any, any>,
  userId: string,
  requiresQuestId: string | null
): Promise<boolean> {
  if (!requiresQuestId) return false;
  const { data: prerequisite } = await supabase
    .from("quest_completions")
    .select("status")
    .eq("user_id", userId)
    .eq("quest_id", requiresQuestId)
    .maybeSingle();
  return prerequisite?.status !== "COMPLETED";
}
