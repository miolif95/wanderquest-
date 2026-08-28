import Link from "next/link";
import { requireUser } from "@/lib/auth/require-user";
import { getLevelProgress } from "@/lib/game/level";
import { ProfileEditForm } from "@/components/profile-edit-form";

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
    .select("username, bio, avatar_url, xp, created_at")
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
  // Titolo di livello + barra di progresso (Change Request "Guida,
  // Profilo, Livelli", Sezione 3.4): stesso getLevelProgress() usato in
  // Home e nella Completion Screen, mai un calcolo duplicato.
  const progress = getLevelProgress(xp);

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
      <div className="flex items-center gap-4">
        {profile?.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element -- URL dinamico da Supabase Storage
          <img
            src={profile.avatar_url}
            alt={profile.username}
            className="h-16 w-16 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-800 text-2xl">
            🧭
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold text-white">{profile?.username}</h1>
          {profile?.bio && <p className="mt-1 text-sm text-gray-400">{profile.bio}</p>}
        </div>
      </div>

      <details className="group mt-3">
        <summary className="cursor-pointer list-none text-sm text-yellow-400 hover:underline marker:content-none">
          Modifica profilo
        </summary>
        <div className="mt-3">
          <ProfileEditForm
            userId={user.id}
            initialAvatarUrl={profile?.avatar_url ?? null}
            initialBio={profile?.bio ?? null}
          />
        </div>
      </details>

      <div className="mt-6 rounded-lg border border-gray-800 bg-gray-900 p-6">
        <div className="flex items-baseline justify-between">
          <span className="text-lg font-semibold text-yellow-400">
            Livello {progress.level} · {progress.title}
          </span>
          <span className="text-sm text-gray-400">{xp} XP</span>
        </div>
        <div className="mt-2">
          <div className="h-2 overflow-hidden rounded-full bg-gray-800">
            <div className="h-full bg-yellow-500" style={{ width: `${progress.progressRatio * 100}%` }} />
          </div>
          <p className="mt-1 text-xs text-gray-500">
            {progress.xpForNextLevel - progress.xpIntoLevel} XP al livello {progress.level + 1}
          </p>
        </div>
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

      <div className="mt-6 flex flex-wrap gap-4 text-sm">
        <Link href="/profile/achievements" className="text-yellow-400 hover:underline">
          Achievement
        </Link>
        <Link href="/profile/history" className="text-yellow-400 hover:underline">
          Storico viaggi
        </Link>
        <Link href="/passport" className="text-yellow-400 hover:underline">
          Travel Passport
        </Link>
        <Link href="/profile/photos" className="text-yellow-400 hover:underline">
          Le mie foto
        </Link>
        <Link href={`/u/${profile?.username}`} className="text-gray-400 hover:underline">
          Vedi come profilo pubblico
        </Link>
      </div>
    </main>
  );
}
