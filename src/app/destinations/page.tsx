import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

/**
 * Selezione destinazione (Sezione 13 / route da Tabella 6:
 * /destinations). Mostra solo le destinazioni con is_active = true: quelle
 * ancora in preparazione dal pannello admin restano nascoste (Sezione 2
 * del modello dati).
 */
export default async function DestinationsPage() {
  const supabase = await createClient();
  const { data: destinations } = await supabase
    .from("destinations")
    .select("id, name, country, description, image_url")
    .eq("is_active", true)
    .order("name");

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
      <h1 className="mb-6 text-2xl font-bold text-white">Scegli una destinazione</h1>

      {!destinations || destinations.length === 0 ? (
        <p className="text-gray-400">
          Nessuna destinazione disponibile al momento, torna a trovarci presto.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {destinations.map((d) => (
            <Link
              key={d.id}
              href={`/destinations/${d.id}`}
              className="overflow-hidden rounded-lg border border-gray-800 bg-gray-900 transition-colors hover:border-bordeaux-500"
            >
              {d.image_url && (
                // eslint-disable-next-line @next/next/no-img-element -- URL dinamico da Supabase Storage
                <img src={d.image_url} alt={d.name} className="h-40 w-full object-cover" />
              )}
              <div className="p-4">
                <h2 className="text-lg font-semibold text-white">{d.name}</h2>
                <p className="text-sm text-gray-400">{d.country}</p>
                {d.description && (
                  <p className="mt-2 line-clamp-2 text-sm text-gray-500">{d.description}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
