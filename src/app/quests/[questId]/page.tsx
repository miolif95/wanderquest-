import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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
  ACTIVE: { label: "In corso", className: "bg-yellow-900 text-yellow-300" },
  COMPLETED: { label: "Completata", className: "bg-green-900 text-green-300" },
};

/**
 * Quest Detail (Sezione 18 / route da Tabella 6: /quests/[questId]).
 *
 * Fase 4: sola lettura. Il pulsante "Avvia Quest" e il flusso di
 * completamento arrivano rispettivamente in Fase 5 e Fase 6 - qui si
 * mostra solo lo stato attuale, senza alcuna azione possibile.
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
      "id, destination_id, title, description, instructions, category, difficulty, xp_reward, completion_type, image_url"
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
          .select("status")
          .eq("user_id", user.id)
          .eq("quest_id", questId)
          .maybeSingle()
      ).data
    : null;

  const status = completion?.status ?? "AVAILABLE";
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
    </main>
  );
}
