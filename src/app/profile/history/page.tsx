import Link from "next/link";
import { requireUser } from "@/lib/auth/require-user";

/**
 * Profile / Trip History (Sezione 31 / route da Tabella 6:
 * /profile/history).
 *
 * Non esiste una tabella "trips" (Sezione 17, "Entità Trip semplificata"):
 * lo storico si deriva raggruppando le quest_completions COMPLETED per
 * destinazione, usando i WanderStamp come riepilogo di ciascun gruppo.
 *
 * Query separate invece di relazioni annidate nella select (es.
 * "destinations(name)"): senza i tipi generati dallo schema Supabase, il
 * client le tipizza sempre come array anche quando a runtime la singola
 * riga è un oggetto (relazione many-to-one), un disallineamento tra tipi
 * e dati reali facile da fraintendere silenziosamente.
 */
export default async function ProfileHistoryPage() {
  const { user, supabase } = await requireUser();

  const { data: stamps } = await supabase
    .from("wanderstamps")
    .select("destination_id, quests_completed, xp_earned, first_completed_at")
    .eq("user_id", user.id)
    .order("first_completed_at", { ascending: false });

  const { data: completions } = await supabase
    .from("quest_completions")
    .select("completed_at, quest_id")
    .eq("user_id", user.id)
    .eq("status", "COMPLETED")
    .order("completed_at", { ascending: false });

  const destinationIds = stamps?.map((s) => s.destination_id) ?? [];
  const questIds = completions?.map((c) => c.quest_id) ?? [];

  const [{ data: destinations }, { data: quests }] = await Promise.all([
    destinationIds.length
      ? supabase.from("destinations").select("id, name").in("id", destinationIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    questIds.length
      ? supabase.from("quests").select("id, title, destination_id").in("id", questIds)
      : Promise.resolve({ data: [] as { id: string; title: string; destination_id: string }[] }),
  ]);

  const destinationNameById = new Map(destinations?.map((d) => [d.id, d.name]));
  const questById = new Map(quests?.map((q) => [q.id, q]));

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
      <p className="mb-4 text-sm text-gray-400">
        <Link href="/profile" className="hover:underline">
          Profilo
        </Link>
      </p>
      <h1 className="mb-6 text-2xl font-bold text-white">Storico viaggi</h1>

      {!stamps || stamps.length === 0 ? (
        <p className="text-gray-400">Nessun viaggio ancora completato.</p>
      ) : (
        <div className="space-y-6">
          {stamps.map((stamp) => {
            const questsHere = (completions ?? []).filter(
              (c) => questById.get(c.quest_id)?.destination_id === stamp.destination_id
            );
            return (
              <div
                key={stamp.destination_id}
                className="rounded-lg border border-gray-800 bg-gray-900 p-4"
              >
                <div className="flex items-baseline justify-between">
                  <h2 className="text-lg font-semibold text-white">
                    {destinationNameById.get(stamp.destination_id)}
                  </h2>
                  <span className="text-xs text-gray-500">
                    dal{" "}
                    {new Date(stamp.first_completed_at).toLocaleDateString("it-IT")}
                  </span>
                </div>
                <p className="mb-3 text-sm text-gray-400">
                  {stamp.quests_completed} Quest completate · {stamp.xp_earned} XP
                </p>
                <ul className="space-y-1 border-t border-gray-800 pt-3 text-sm text-gray-400">
                  {questsHere.map((c, i) => (
                    <li key={i} className="flex justify-between">
                      <span>{questById.get(c.quest_id)?.title}</span>
                      <span className="text-gray-600">
                        {new Date(c.completed_at).toLocaleDateString("it-IT")}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
