import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SectionsManager } from "./sections-manager";

/**
 * /admin/destinations/[id]/sections - CRUD della guida di una
 * destinazione (Change Request "Guida, Profilo, Livelli", Sezione 4.1 /
 * Tabella 12 estesa).
 */
export default async function DestinationSectionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: destination } = await supabase
    .from("destinations")
    .select("id, name")
    .eq("id", id)
    .single();

  if (!destination) notFound();

  const { data: sections } = await supabase
    .from("destination_sections")
    .select("id, label, icon, body, sort_order")
    .eq("destination_id", id)
    .order("sort_order", { ascending: true });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-gray-400">
          <Link href="/admin" className="hover:underline">
            Destinazioni
          </Link>{" "}
          / {destination.name}
        </p>
        <h1 className="text-2xl font-bold">Guida di {destination.name}</h1>
      </div>

      <SectionsManager destinationId={destination.id} initialSections={sections ?? []} />
    </div>
  );
}
