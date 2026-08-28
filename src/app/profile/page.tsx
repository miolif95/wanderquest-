import Link from "next/link";
import { requireUser } from "@/lib/auth/require-user";
import { getLevel, xpForNextLevel } from "@/lib/game/level";

/**
 * Profile - panoramica (Sezione 30 / route da Tabella 6: /profile).
 *
 * Le sotto-pagine /profile/achievements e /profile/history (link qui
 * sotto) completano la vista Profile prevista dalla Fase 7.
 */
export default async function ProfilePage() {
  const { user, supabase } = await requireUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, bio, xp, created_at")
    .eq("id", user.id)
    .single();

  const [{ count: completedCount }, { count: destinationsCount }, { count: achievementsCount }, { count: totalAchievements }] =
    await Promise.all([
      supabase
        .from("quest_completions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "COMPLETED"),
      supabase
        .from("wanderstamps")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id),
      supabase
        .from("user_achievements")
        .select("user_id", { count: "exact", head: true })
        .eq("user_id", user.id),
      supabase.from("achievements").select("id", { count: "exact", head: true }),
    ]);

  const xp = profile?.xp ?? 0;
  const level = getLevel(xp);
  const nextLevelXp = xpForNextLevel(xp);

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
      <h1 className="text-2xl font-bold text-white">{profile?.username}</h1>
      {profile?.bio && <p className="mt-1 text-gray-400">{profile.bio}</p>}

      <div className="mt-6 rounded-lg border border-gray-800 bg-gray-900 p-6">
        <div className="flex items-baseline justify-between">
          <span className="text-lg font-semibold text-yellow-400">Livello {level}</span>
          <span className="text-sm text-gray-400">{xp} XP</span>
        </div>
        {nextLevelXp !== null && (
          <div className="mt-2">
            <div className="h-2 overflow-hidden rounded-full bg-gray-800">
              <div
                className="h-full bg-yellow-500"
                style={{
                  width: `${Math.min(100, (xp / nextLevelXp) * 100)}%`,
                }}
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              {nextLevelXp - xp} XP al livello {level + 1}
            </p>
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4 text-center">
        <div className="rounded border border-gray-800 bg-gray-900 p-4">
          <p className="text-xl font-bold text-white">{completedCount ?? 0}</p>
          <p className="text-xs text-gray-400">Quest completate</p>
        </div>
        <div className="rounded border border-gray-800 bg-gray-900 p-4">
          <p className="text-xl font-bold text-white">{destinationsCount ?? 0}</p>
          <p className="text-xs text-gray-400">Destinazioni visitate</p>
        </div>
        <div className="rounded border border-gray-800 bg-gray-900 p-4">
          <p className="text-xl font-bold text-white">
            {achievementsCount ?? 0}/{totalAchievements ?? 0}
          </p>
          <p className="text-xs text-gray-400">Achievement</p>
        </div>
      </div>

      <div className="mt-6 flex gap-4 text-sm">
        <Link href="/profile/achievements" className="text-yellow-400 hover:underline">
          Achievement
        </Link>
        <Link href="/profile/history" className="text-yellow-400 hover:underline">
          Storico viaggi
        </Link>
        <Link href="/passport" className="text-yellow-400 hover:underline">
          Travel Passport
        </Link>
      </div>
    </main>
  );
}
