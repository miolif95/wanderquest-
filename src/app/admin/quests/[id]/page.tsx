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
      <QuestForm destinationId={quest.destination_id} quest={quest} />
    </div>
  );
}
