import Link from "next/link";
import { requireUser } from "@/lib/auth/require-user";

/**
 * Travel Passport (Sezione 28 / route da Tabella 6: /passport).
 *
 * Vista "da collezione" dei WanderStamp: un timbro per ogni destinazione
 * in cui l'utente ha completato almeno una Quest (Sezione 6.3). Rispetto
 * a /profile/history, che elenca ogni singola Quest completata, qui
 * l'obiettivo è dare un colpo d'occhio delle città "collezionate".
 *
 * Query separata per le destinazioni invece di una relazione annidata
 * nella select: vedi il commento in /profile/history/page.tsx sullo
 * stesso pattern.
 */
export default async function PassportPage() {
  const { user, supabase } = await requireUser();

  const { data: stamps } = await supabase
    .from("wanderstamps")
    .select("destination_id, quests_completed, xp_earned, first_completed_at")
    .eq("user_id", user.id)
    .order("first_completed_at", { ascending: false });

  const destinationIds = stamps?.map((s) => s.destination_id) ?? [];
  const { data: destinations } = destinationIds.length
    ? await supabase
        .from("destinations")
        .select("id, name, country, image_url")
        .in("id", destinationIds)
    : { data: [] as { id: string; name: string; country: string; image_url: string | null }[] };

  const destinationById = new Map(destinations?.map((d) => [d.id, d]));

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
      <p className="mb-4 text-sm text-gray-400">
        <Link href="/profile" className="hover:underline">
          Profilo
        </Link>
      </p>
      <h1 className="mb-6 text-2xl font-bold text-white">Travel Passport</h1>

      {!stamps || stamps.length === 0 ? (
        <p className="text-gray-400">
          Nessun timbro ancora raccolto:{" "}
          <Link href="/destinations" className="text-yellow-400 hover:underline">
            scegli una destinazione
          </Link>{" "}
          per iniziare.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {stamps.map((stamp) => {
            const destination = destinationById.get(stamp.destination_id);
            return (
              <div
                key={stamp.destination_id}
                className="overflow-hidden rounded-lg border-2 border-dashed border-yellow-700 bg-gray-900 text-center"
              >
                {destination?.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element -- URL dinamico da Supabase Storage
                  <img
                    src={destination.image_url}
                    alt={destination.name}
                    className="h-32 w-full object-cover"
                  />
                )}
                <div className="p-5">
                  <p className="text-3xl">🛂</p>
                  <h2 className="mt-2 text-lg font-bold text-white">{destination?.name}</h2>
                  <p className="text-sm text-gray-400">{destination?.country}</p>
                  <p className="mt-3 text-xs text-gray-500">
                    Prima visita: {new Date(stamp.first_completed_at).toLocaleDateString("it-IT")}
                  </p>
                  <p className="mt-1 text-sm text-yellow-400">
                    {stamp.quests_completed} Quest · {stamp.xp_earned} XP
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
