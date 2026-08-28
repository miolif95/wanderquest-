import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DestinationForm } from "../destination-form";

/**
 * /admin/destinations/[id] - modifica destinazione esistente.
 *
 * `params` è una Promise in Next.js 16 (App Router): va awaitato prima di
 * poter leggere `id`, non è più un oggetto sincrono come nelle versioni
 * precedenti di Next.js.
 */
export default async function EditDestinationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: destination } = await supabase
    .from("destinations")
    .select("*")
    .eq("id", id)
    .single();

  if (!destination) notFound();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Modifica destinazione</h1>
      <DestinationForm destination={destination} />
    </div>
  );
}
