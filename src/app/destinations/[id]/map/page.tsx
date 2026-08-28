import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import QuestMap from "./quest-map-client";

type QuestStatus = "AVAILABLE" | "ACTIVE" | "COMPLETED";

/**
 * Map (Sezione 29 / route da Tabella 6: /destinations/[id]/map, Fase 8).
 *
 * Mostra solo le Quest con coordinate GPS impostate: le Quest di tipo
 * PHOTO/MANUAL normalmente non hanno una posizione target (Sezione 8),
 * quindi non c'è nulla da mostrare sulla mappa per loro - non è un bug,
 * è la natura di quei tipi di completamento.
 */
export default async function DestinationMapPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: destination } = await supabase
    .from("destinations")
    .select("id, name, latitude, longitude")
    .eq("id", id)
    .eq("is_active", true)
    .single();

  if (!destination) notFound();

  const { data: quests } = await supabase
    .from("quests")
    .select("id, title, latitude, longitude")
    .eq("destination_id", id)
    .eq("is_active", true)
    .not("latitude", "is", null)
    .not("longitude", "is", null);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const completionsByQuestId = new Map<string, QuestStatus>();
  if (user && quests && quests.length > 0) {
    const { data: completions } = await supabase
      .from("quest_completions")
      .select("quest_id, status")
      .eq("user_id", user.id)
      .in(
        "quest_id",
        quests.map((q) => q.id)
      );
    completions?.forEach((c) => completionsByQuestId.set(c.quest_id, c.status as QuestStatus));
  }

  const markers = (quests ?? []).map((q) => ({
    id: q.id,
    title: q.title,
    latitude: q.latitude as number,
    longitude: q.longitude as number,
    status: completionsByQuestId.get(q.id) ?? "AVAILABLE",
  }));

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
      <h1 className="mb-4 text-2xl font-bold text-white">Mappa — {destination.name}</h1>

      <div className="mb-4 flex gap-4 text-sm text-gray-300">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-gray-500" /> Disponibile
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-yellow-500" /> In corso
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-green-500" /> Completata
        </span>
      </div>

      {markers.length === 0 ? (
        <p className="text-gray-400">
          Nessuna Quest con posizione geografica per questa destinazione.
        </p>
      ) : (
        <QuestMap
          centerLat={destination.latitude}
          centerLng={destination.longitude}
          quests={markers}
        />
      )}
    </main>
  );
}
