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
    </main>
  );
}
