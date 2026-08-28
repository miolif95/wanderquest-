import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Destination Dashboard (Sezione 14 / route da Tabella 6:
 * /destinations/[id]).
 *
 * Mostra le informazioni della destinazione, il numero di Quest
 * disponibili e - se l'utente è loggato e ha già completato almeno una
 * Quest qui - il proprio WanderStamp (Sezione 6.3: creato/aggiornato solo
 * lato server dopo un completamento, qui viene solo letto).
 */
export default async function DestinationDashboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: destination } = await supabase
    .from("destinations")
    .select("id, name, country, description, image_url")
    .eq("id", id)
    .eq("is_active", true)
    .single();

  if (!destination) notFound();

  const { count: questCount } = await supabase
    .from("quests")
    .select("id", { count: "exact", head: true })
    .eq("destination_id", id)
    .eq("is_active", true);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const wanderstamp = user
    ? (
        await supabase
          .from("wanderstamps")
          .select("quests_completed, xp_earned")
          .eq("user_id", user.id)
          .eq("destination_id", id)
          .maybeSingle()
      ).data
    : null;

  // Guida della destinazione (Change Request "Guida, Profilo, Livelli",
  // Sezione 1/3.1): paragrafi liberi (Storia, Cibi tipici, Usanze, ...)
  // curati dal pannello admin, mostrati come accordion.
  const { data: sections } = await supabase
    .from("destination_sections")
    .select("id, label, icon, body")
    .eq("destination_id", id)
    .order("sort_order", { ascending: true });

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <p className="mb-4 text-sm text-gray-400">
        <Link href="/destinations" className="hover:underline">
          Destinazioni
        </Link>
      </p>

      {destination.image_url && (
        // eslint-disable-next-line @next/next/no-img-element -- URL dinamico da Supabase Storage
        <img
          src={destination.image_url}
          alt={destination.name}
          className="mb-6 h-56 w-full rounded-lg object-cover"
        />
      )}

      <h1 className="text-3xl font-bold text-white">{destination.name}</h1>
      <p className="text-gray-400">{destination.country}</p>
      {destination.description && (
        <p className="mt-4 text-gray-300">{destination.description}</p>
      )}

      <div className="mt-6 flex gap-6 text-sm text-gray-400">
        <span>{questCount ?? 0} Quest disponibili</span>
        {wanderstamp && (
          <span>
            {wanderstamp.quests_completed} completate · {wanderstamp.xp_earned} XP guadagnati qui
          </span>
        )}
      </div>

      <div className="mt-8 flex gap-3">
        <Link
          href={`/destinations/${destination.id}/quests`}
          className="rounded bg-yellow-500 px-6 py-3 font-semibold text-black hover:bg-yellow-400"
        >
          Vedi le Quest
        </Link>
        <Link
          href={`/destinations/${destination.id}/map`}
          className="rounded border border-gray-700 px-6 py-3 font-semibold text-gray-300 hover:border-yellow-500 hover:text-yellow-400"
        >
          Mappa
        </Link>
      </div>

      {sections && sections.length > 0 && (
        <div className="mt-10">
          <h2 className="mb-3 text-lg font-semibold text-white">Guida di {destination.name}</h2>
          <div className="space-y-2">
            {sections.map((section) => (
              // <details>/<summary> nativi implementano l'accordion senza
              // bisogno di stato React o di un Client Component dedicato
              // (Sezione 3.1: "titolo sempre visibile, body visibile solo
              // se espanso" è esattamente il comportamento di default).
              <details
                key={section.id}
                className="group rounded-lg border border-gray-800 bg-gray-900 open:bg-gray-900/80"
              >
                <summary className="cursor-pointer list-none px-4 py-3 font-semibold text-white marker:content-none">
                  <span className="mr-2">{section.icon || "📍"}</span>
                  {section.label}
                  <span className="float-right text-gray-500 group-open:hidden">+</span>
                  <span className="float-right hidden text-gray-500 group-open:inline">−</span>
                </summary>
                <p className="whitespace-pre-line border-t border-gray-800 px-4 py-3 text-sm text-gray-300">
                  {section.body}
                </p>
              </details>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
