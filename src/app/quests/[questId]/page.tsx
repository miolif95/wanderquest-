import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StartQuestButton } from "@/components/start-quest-button";
import { CompleteQuestPanel } from "@/components/complete-quest-panel";
import { deriveQuestStatus } from "@/lib/game/quest-status";

const CATEGORY_LABELS: Record<string, string> = {
  LOCATION: "Luogo",
  DISCOVERY: "Scoperta",
  PHOTO: "Foto",
  EXPERIENCE: "Esperienza",
  CHALLENGE: "Sfida",
};

const COMPLETION_LABELS: Record<string, string> = {
  GPS: "Raggiungi il punto indicato",
  PHOTO: "Carica una foto",
  MANUAL: "Conferma diretta",
};

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  AVAILABLE: { label: "Disponibile", className: "bg-gray-800 text-gray-300" },
  ACTIVE: { label: "In corso", className: "bg-bordeaux-900 text-bordeaux-300" },
  COMPLETED: { label: "Completata", className: "bg-green-900 text-green-300" },
  LOCKED: { label: "🔒 Bloccata", className: "bg-red-950 text-red-300" },
};

/**
 * Quest Detail (Sezione 18 / route da Tabella 6: /quests/[questId]).
 *
 * Fase 5: aggiunto il pulsante "Avvia Quest" (AVAILABLE -> ACTIVE, Tabella
 * 5). Il flusso di completamento vero e proprio (ACTIVE -> COMPLETED)
 * arriva in Fase 6.
 */
export default async function QuestDetailPage({
  params,
}: {
  params: Promise<{ questId: string }>;
}) {
  const { questId } = await params;
  const supabase = await createClient();

  const { data: quest } = await supabase
    .from("quests")
    .select(
      "id, destination_id, title, description, instructions, deep_info, category, difficulty, xp_reward, completion_type, image_url, requires_quest_id"
    )
    .eq("id", questId)
    .eq("is_active", true)
    .single();

  if (!quest) notFound();

  const { data: destination } = await supabase
    .from("destinations")
    .select("name")
    .eq("id", quest.destination_id)
    .single();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const completion = user
    ? (
        await supabase
          .from("quest_completions")
          .select("id, status")
          .eq("user_id", user.id)
          .eq("quest_id", questId)
          .maybeSingle()
      ).data
    : null;

  // Change Request "Guida, Profilo, Livelli", Sezione 2.1: se questa Quest
  // ha un prerequisito, serve sapere il suo titolo (per mostrarlo
  // nell'indicatore LOCKED, Sezione 3.2) e se l'utente l'ha già completato.
  let prerequisiteTitle: string | null = null;
  let prerequisiteCompleted = false;
  if (quest.requires_quest_id) {
    const { data: prerequisiteQuest } = await supabase
      .from("quests")
      .select("title")
      .eq("id", quest.requires_quest_id)
      .single();
    prerequisiteTitle = prerequisiteQuest?.title ?? null;

    if (user) {
      const { data: prerequisiteCompletion } = await supabase
        .from("quest_completions")
        .select("status")
        .eq("user_id", user.id)
        .eq("quest_id", quest.requires_quest_id)
        .maybeSingle();
      prerequisiteCompleted = prerequisiteCompletion?.status === "COMPLETED";
    }
  }

  const status = deriveQuestStatus(completion?.status, quest.requires_quest_id, prerequisiteCompleted);
  const statusInfo = STATUS_LABELS[status];
  const destinationName = destination?.name;

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
      <p className="mb-4 text-sm text-gray-400">
        <Link href="/destinations" className="hover:underline">
          Destinazioni
        </Link>{" "}
        /{" "}
        <Link href={`/destinations/${quest.destination_id}`} className="hover:underline">
          {destinationName}
        </Link>{" "}
        /{" "}
        <Link href={`/destinations/${quest.destination_id}/quests`} className="hover:underline">
          Quest
        </Link>
      </p>

      {quest.image_url && (
        // eslint-disable-next-line @next/next/no-img-element -- URL dinamico da Supabase Storage
        <img
          src={quest.image_url}
          alt={quest.title}
          className="mb-6 h-56 w-full rounded-lg object-cover"
        />
      )}

      <div className="mb-2 flex items-center gap-3">
        <h1 className="text-2xl font-bold text-white">{quest.title}</h1>
        <span className={`rounded px-2 py-1 text-xs ${statusInfo.className}`}>
          {statusInfo.label}
        </span>
      </div>

      <p className="text-sm text-gray-400">
        {CATEGORY_LABELS[quest.category] ?? quest.category} · {quest.difficulty} ·{" "}
        {quest.xp_reward} XP · {COMPLETION_LABELS[quest.completion_type]}
      </p>

      <p className="mt-4 text-gray-300">{quest.description}</p>

      {quest.instructions && (
        <div className="mt-4 rounded border border-gray-800 bg-gray-900 p-4">
          <h2 className="mb-1 text-sm font-semibold text-gray-300">Istruzioni</h2>
          <p className="text-sm text-gray-400">{quest.instructions}</p>
        </div>
      )}

      {/* Info aggiuntive (Sezione 3.2, terzo componente): sempre
          accessibile indipendentemente dallo stato della Quest, pensata
          per essere letta mentre si è in cammino - non va quindi nascosta
          dietro il completamento. Omessa del tutto (niente accordion
          vuoto) se deep_info non è stato impostato in admin. */}
      {quest.deep_info && (
        <details className="group mt-4 rounded border border-gray-800 bg-gray-900">
          <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-gray-300 marker:content-none">
            Info aggiuntive
            <span className="float-right text-gray-500 group-open:hidden">+</span>
            <span className="float-right hidden text-gray-500 group-open:inline">−</span>
          </summary>
          <p className="whitespace-pre-line border-t border-gray-800 px-4 py-3 text-sm text-gray-400">
            {quest.deep_info}
          </p>
        </details>
      )}

      {status === "LOCKED" && (
        <div className="mt-6 rounded border border-red-900 bg-red-950/50 px-4 py-3 text-sm text-red-200">
          Questa Quest è bloccata
          {prerequisiteTitle && (
            <>
              : completa prima <strong>{prerequisiteTitle}</strong>
            </>
          )}
          .
        </div>
      )}

      {status === "AVAILABLE" &&
        (user ? (
          <StartQuestButton questId={quest.id} />
        ) : (
          <p className="mt-6 text-sm text-gray-400">
            <Link href="/login" className="text-bordeaux-400 hover:underline">
              Accedi
            </Link>{" "}
            per avviare questa Quest.
          </p>
        ))}

      {status === "ACTIVE" && user && completion && (
        <CompleteQuestPanel
          questId={quest.id}
          completionId={completion.id}
          userId={user.id}
          completionType={quest.completion_type as "GPS" | "PHOTO" | "MANUAL"}
          destinationId={quest.destination_id}
        />
      )}
    </main>
  );
}
