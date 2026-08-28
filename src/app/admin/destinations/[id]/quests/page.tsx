import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * /admin/destinations/[id]/quests - elenco Quest di una destinazione
 * (Tabella 12 della spec tecnica).
 */
export default async function DestinationQuestsPage({
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
    .single();

  if (!destination) notFound();

  const { data: quests } = await supabase
    .from("quests")
    .select("id, title, category, difficulty, completion_type, xp_reward, is_active")
    .eq("destination_id", id)
    .order("sort_order", { ascending: true });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400">
            <Link href="/admin" className="hover:underline">
              Destinazioni
            </Link>{" "}
            / {destination.name}
          </p>
          <h1 className="text-2xl font-bold">Quest</h1>
        </div>
        <Link
          href={`/admin/quests/new?destination_id=${id}`}
          className="rounded bg-yellow-500 px-4 py-2 font-semibold text-black"
        >
          + Nuova Quest
        </Link>
      </div>

      {!quests || quests.length === 0 ? (
        <p className="text-gray-400">Nessuna Quest ancora creata per questa destinazione.</p>
      ) : (
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-gray-800 text-sm text-gray-400">
              <th className="py-2">Titolo</th>
              <th className="py-2">Categoria</th>
              <th className="py-2">Difficoltà</th>
              <th className="py-2">Completamento</th>
              <th className="py-2">XP</th>
              <th className="py-2">Stato</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody>
            {quests.map((q) => (
              <tr key={q.id} className="border-b border-gray-900">
                <td className="py-3">{q.title}</td>
                <td className="py-3 text-gray-400">{q.category}</td>
                <td className="py-3 text-gray-400">{q.difficulty}</td>
                <td className="py-3 text-gray-400">{q.completion_type}</td>
                <td className="py-3 text-gray-400">{q.xp_reward}</td>
                <td className="py-3">
                  <span
                    className={
                      q.is_active
                        ? "rounded bg-green-900 px-2 py-1 text-xs text-green-300"
                        : "rounded bg-gray-800 px-2 py-1 text-xs text-gray-400"
                    }
                  >
                    {q.is_active ? "Attiva" : "Disattivata"}
                  </span>
                </td>
                <td className="py-3 text-right text-sm">
                  <Link href={`/admin/quests/${q.id}`} className="text-yellow-400 hover:underline">
                    Modifica
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
