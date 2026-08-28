import Link from "next/link";
import { requireUser } from "@/lib/auth/require-user";
import { PhotoManageCard } from "./photo-manage-card";

/**
 * Gestione delle proprie foto (Sezione 15.5 / Tabella 11: "dentro
 * /profile"). Elenca le foto-prova delle Quest fotografiche completate,
 * pubbliche o private, con le azioni di visibilità/cancellazione.
 */
export default async function ProfilePhotosPage() {
  const { user, supabase } = await requireUser();

  const { data: completions } = await supabase
    .from("quest_completions")
    .select("id, proof_url, is_public, quest_id")
    .eq("user_id", user.id)
    .eq("status", "COMPLETED")
    .not("proof_url", "is", null)
    .order("completed_at", { ascending: false });

  const questIds = [...new Set(completions?.map((c) => c.quest_id) ?? [])];
  const { data: quests } = questIds.length
    ? await supabase.from("quests").select("id, title").in("id", questIds)
    : { data: [] as { id: string; title: string }[] };
  const questTitleById = new Map(quests?.map((q) => [q.id, q.title]));

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
      <p className="mb-4 text-sm text-gray-400">
        <Link href="/profile" className="hover:underline">
          Profilo
        </Link>
      </p>
      <h1 className="mb-2 text-2xl font-bold text-white">Le mie foto</h1>
      <p className="mb-6 text-sm text-gray-400">
        Gestisci quali foto-prova sono visibili sul tuo profilo pubblico.
      </p>

      {!completions || completions.length === 0 ? (
        <p className="text-gray-400">Nessuna foto ancora caricata.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {completions.map(
            (c) =>
              c.proof_url && (
                <PhotoManageCard
                  key={c.id}
                  completionId={c.id}
                  url={c.proof_url}
                  questTitle={questTitleById.get(c.quest_id) ?? ""}
                  initiallyPublic={c.is_public}
                />
              )
          )}
        </div>
      )}
    </main>
  );
}
