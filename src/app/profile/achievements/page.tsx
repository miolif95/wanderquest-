import Link from "next/link";
import { requireUser } from "@/lib/auth/require-user";

/**
 * Profile / Achievements (route da Tabella 6: /profile/achievements).
 *
 * Mostra tutti gli achievement esistenti, distinguendo quelli già
 * sbloccati (icona a colori, data di sblocco) da quelli ancora da
 * ottenere (icona in scala di grigi). La descrizione resta visibile
 * anche per quelli bloccati: dice all'utente cosa fare per sbloccarli,
 * coerente con lo scopo di motivare a completare altre Quest.
 */
export default async function ProfileAchievementsPage() {
  const { user, supabase } = await requireUser();

  const [{ data: allAchievements }, { data: unlocked }] = await Promise.all([
    supabase.from("achievements").select("*").order("code"),
    supabase
      .from("user_achievements")
      .select("achievement_id, unlocked_at")
      .eq("user_id", user.id),
  ]);

  const unlockedMap = new Map(unlocked?.map((u) => [u.achievement_id, u.unlocked_at]));

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
      <p className="mb-4 text-sm text-gray-400">
        <Link href="/profile" className="hover:underline">
          Profilo
        </Link>
      </p>
      <h1 className="mb-6 text-2xl font-bold text-white">Achievement</h1>

      <div className="space-y-3">
        {allAchievements?.map((a) => {
          const unlockedAt = unlockedMap.get(a.id);
          const isUnlocked = Boolean(unlockedAt);
          return (
            <div
              key={a.id}
              className={`flex items-center gap-4 rounded-lg border p-4 ${
                isUnlocked
                  ? "border-bordeaux-700 bg-gray-900"
                  : "border-gray-800 bg-gray-950"
              }`}
            >
              <span className={`text-3xl ${isUnlocked ? "" : "grayscale opacity-40"}`}>
                {a.icon}
              </span>
              <div className="flex-1">
                <p className={isUnlocked ? "font-semibold text-white" : "font-semibold text-gray-500"}>
                  {a.name}
                </p>
                <p className="text-sm text-gray-500">{a.description}</p>
              </div>
              {isUnlocked && (
                <span className="text-xs text-gray-500">
                  {new Date(unlockedAt as string).toLocaleDateString("it-IT")}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}
