import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

/**
 * /admin - elenco destinazioni con conteggio Quest per ciascuna
 * (Tabella 12 della spec tecnica).
 *
 * La select "*, quests(count)" usa la sintassi di embedding di PostgREST:
 * per ogni destinazione ritorna anche `quests: [{ count: N }]`, evitando
 * di fare N query separate per contare le Quest di ogni destinazione.
 */
export default async function AdminDestinationsPage() {
  const supabase = await createClient();
  const { data: destinations } = await supabase
    .from("destinations")
    .select("id, name, country, is_active, quests(count)")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Destinazioni</h1>
        <Link
          href="/admin/destinations/new"
          className="rounded bg-yellow-500 px-4 py-2 font-semibold text-black"
        >
          + Nuova destinazione
        </Link>
      </div>

      {!destinations || destinations.length === 0 ? (
        <p className="text-gray-400">Nessuna destinazione ancora creata.</p>
      ) : (
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-gray-800 text-sm text-gray-400">
              <th className="py-2">Nome</th>
              <th className="py-2">Paese</th>
              <th className="py-2">Quest</th>
              <th className="py-2">Stato</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody>
            {destinations.map((d) => (
              <tr key={d.id} className="border-b border-gray-900">
                <td className="py-3">{d.name}</td>
                <td className="py-3 text-gray-400">{d.country}</td>
                <td className="py-3 text-gray-400">
                  {/* quests è un array con un solo elemento {count} per via
                      della sintassi di embedding usata nella select sopra */}
                  {d.quests?.[0]?.count ?? 0}
                </td>
                <td className="py-3">
                  <span
                    className={
                      d.is_active
                        ? "rounded bg-green-900 px-2 py-1 text-xs text-green-300"
                        : "rounded bg-gray-800 px-2 py-1 text-xs text-gray-400"
                    }
                  >
                    {d.is_active ? "Attiva" : "Disattivata"}
                  </span>
                </td>
                <td className="space-x-3 py-3 text-right text-sm">
                  <Link
                    href={`/admin/destinations/${d.id}/quests`}
                    className="text-yellow-400 hover:underline"
                  >
                    Quest
                  </Link>
                  <Link
                    href={`/admin/destinations/${d.id}`}
                    className="text-yellow-400 hover:underline"
                  >
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
