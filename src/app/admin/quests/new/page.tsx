import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { QuestForm } from "../quest-form";

/**
 * /admin/quests/new?destination_id=... - crea una nuova Quest per la
 * destinazione indicata (il link arriva sempre da
 * /admin/destinations/[id]/quests, che passa l'id in query string).
 *
 * `searchParams`, come `params`, è una Promise in Next.js 16.
 */
export default async function NewQuestPage({
  searchParams,
}: {
  searchParams: Promise<{ destination_id?: string }>;
}) {
  const { destination_id: destinationId } = await searchParams;
  if (!destinationId) notFound();

  const supabase = await createClient();
  const { data: destination } = await supabase
    .from("destinations")
    .select("id, name")
    .eq("id", destinationId)
    .single();

  if (!destination) notFound();

  // Prerequisito (Sezione 4.2): la lista di Quest della stessa
  // destinazione tra cui scegliere - qui non c'è ancora una Quest da
  // escludere perché stiamo creandone una nuova.
  const { data: siblingQuests } = await supabase
    .from("quests")
    .select("id, title")
    .eq("destination_id", destination.id)
    .order("sort_order", { ascending: true });

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-400">
        <Link href="/admin" className="hover:underline">
          Destinazioni
        </Link>{" "}
        /{" "}
        <Link href={`/admin/destinations/${destination.id}/quests`} className="hover:underline">
          {destination.name}
        </Link>
      </p>
      <h1 className="text-2xl font-bold">Nuova Quest</h1>
      <QuestForm destinationId={destination.id} siblingQuests={siblingQuests ?? []} />
    </div>
  );
}
