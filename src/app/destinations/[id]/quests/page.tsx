import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { deriveQuestStatus } from "@/lib/game/quest-status";

const CATEGORY_LABELS: Record<string, string> = {
  LOCATION: "Luogo",
  DISCOVERY: "Scoperta",
  PHOTO: "Foto",
  EXPERIENCE: "Esperienza",
  CHALLENGE: "Sfida",
};

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  AVAILABLE: { label: "Disponibile", className: "bg-gray-800 text-gray-300" },
  ACTIVE: { label: "In corso", className: "bg-yellow-900 text-yellow-300" },
  COMPLETED: { label: "Completata", className: "bg-green-900 text-green-300" },
  LOCKED: { label: "🔒 Bloccata", className: "bg-red-950 text-red-300" },
};

/**
 * Quest List pubblica (Sezione 15 / route da Tabella 6:
 * /destinations/[id]/quests).
 *
 * Lo stato "AVAILABLE" non è un valore memorizzato (Sezione 5.2): è
 * l'assenza di una riga in quest_completions per quella coppia
 * utente/Quest, quindi qui si calcola confrontando l'elenco Quest con le
 * quest_completions dell'utente loggato (se presente).
 */
export default async function PublicQuestListPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: destination } = await supabase
    .from("destinations")
    .select("id, name")
    .eq("id", id)
    .eq("is_active", true)
    .single();

  if (!destination) notFound();

  const { data: quests } = await supabase
    .from("quests")
    .select("id, title, category, difficulty, xp_reward, completion_type, image_url, requires_quest_id")
    .eq("destination_id", id)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const completionsByQuestId = new Map<string, string>();
  if (user && quests && quests.length > 0) {
    const { data: completions } = await supabase
      .from("quest_completions")
      .select("quest_id, status")
      .eq("user_id", user.id)
      .in(
        "quest_id",
        quests.map((q) => q.id)
      );
    completions?.forEach((c) => completionsByQuestId.set(c.quest_id, c.status));
  }

  // Change Request "Guida, Profilo, Livelli", Sezione 2.1: il prerequisito
  // di una Quest è sempre un'altra Quest della stessa destinazione (vedi
  // il selettore del form admin, Sezione 4.2), quindi il suo stato di
  // completamento è già disponibile nella stessa mappa costruita sopra -
  // non serve una query separata.
  const completedQuestIds = new Set(
    [...completionsByQuestId].filter(([, status]) => status === "COMPLETED").map(([questId]) => questId)
  );

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <p className="mb-4 text-sm text-gray-400">
        <Link href="/destinations" className="hover:underline">
          Destinazioni
        </Link>{" "}
        /{" "}
        <Link href={`/destinations/${destination.id}`} className="hover:underline">
          {destination.name}
        </Link>
      </p>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Quest a {destination.name}</h1>
        <Link
          href={`/destinations/${destination.id}/map`}
          className="text-sm text-yellow-400 hover:underline"
        >
          Vedi sulla mappa
        </Link>
      </div>

      {!quests || quests.length === 0 ? (
        <p className="text-gray-400">Nessuna Quest disponibile ancora per questa destinazione.</p>
      ) : (
        <div className="space-y-3">
          {quests.map((q) => {
            const status = deriveQuestStatus(
              completionsByQuestId.get(q.id),
              q.requires_quest_id,
              q.requires_quest_id ? completedQuestIds.has(q.requires_quest_id) : false
            );
            const statusInfo = STATUS_LABELS[status];
            return (
              <Link
                key={q.id}
                href={`/quests/${q.id}`}
                className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-900 p-4 transition-colors hover:border-yellow-500"
              >
                <div>
                  <h2 className="font-semibold text-white">{q.title}</h2>
                  <p className="text-sm text-gray-400">
                    {CATEGORY_LABELS[q.category] ?? q.category} · {q.difficulty} · {q.xp_reward} XP
                  </p>
                </div>
                <span className={`rounded px-2 py-1 text-xs ${statusInfo.className}`}>
                  {statusInfo.label}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
