import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { QuestForm } from "../quest-form";

export default async function EditQuestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: quest } = await supabase.from("quests").select("*").eq("id", id).single();
  if (!quest) notFound();

  const { data: destination } = await supabase
    .from("destinations")
    .select("id, name")
    .eq("id", quest.destination_id)
    .single();

  // Prerequisito (Sezione 4.2): come in /admin/quests/new, ma qui va
  // esclusa la Quest stessa - altrimenti il form permetterebbe di
  // impostarla come prerequisito di se stessa, un auto-blocco permanente.
  const { data: siblingQuests } = await supabase
    .from("quests")
    .select("id, title")
    .eq("destination_id", quest.destination_id)
    .neq("id", id)
    .order("sort_order", { ascending: true });

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-400">
        <Link href="/admin" className="hover:underline">
          Destinazioni
        </Link>{" "}
        /{" "}
        <Link href={`/admin/destinations/${quest.destination_id}/quests`} className="hover:underline">
          {destination?.name}
        </Link>
      </p>
      <h1 className="text-2xl font-bold">Modifica Quest</h1>
      <QuestForm destinationId={quest.destination_id} quest={quest} siblingQuests={siblingQuests ?? []} />
    </div>
  );
}
