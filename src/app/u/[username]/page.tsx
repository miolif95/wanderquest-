import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getLevel } from "@/lib/game/level";
import { resolveQuestProofUrl } from "@/lib/storage/quest-proof-url";
import { BlockButton } from "./block-button";
import { ReportButton } from "@/components/report-button";
import { PhotoCard } from "./photo-card";

const CATEGORY_ICONS: Record<string, string> = {
  LOCATION: "📍",
  DISCOVERY: "🔎",
  PHOTO: "📷",
  EXPERIENCE: "🍽️",
  CHALLENGE: "🏆",
};

/**
 * Profilo pubblico (Sezione 15.1 / route da Tabella 11: /u/[username]).
 *
 * Mostra a un altro utente: username, bio, livello, achievement
 * sbloccati e - per ogni destinazione visitata - un carosello delle foto
 * delle Quest fotografiche completate con is_public = true, ciascuna con
 * badge categoria, like e commenti.
 *
 * Tutte le query qui usano il client "anon" con sessione (RLS), mai
 * service_role: le policy di Sezione 5.4/15.7 già permettono esattamente
 * queste letture pubbliche, non serve bypassarle.
 */
export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, bio, xp")
    .eq("username", username)
    .single();

  if (!profile) notFound();

  const {
    data: { user: viewer },
  } = await supabase.auth.getUser();

  const isOwnProfile = viewer?.id === profile.id;

  // --- achievement sbloccati ---
  const { data: unlocked } = await supabase
    .from("user_achievements")
    .select("achievement_id")
    .eq("user_id", profile.id);
  const achievementIds = unlocked?.map((u) => u.achievement_id) ?? [];
  const { data: achievements } = achievementIds.length
    ? await supabase.from("achievements").select("id, name, icon").in("id", achievementIds)
    : { data: [] as { id: string; name: string; icon: string }[] };

  // --- foto pubbliche (Quest completate, is_public = true, con proof_url) ---
  const { data: completions } = await supabase
    .from("quest_completions")
    .select("id, proof_url, quest_id")
    .eq("user_id", profile.id)
    .eq("status", "COMPLETED")
    .eq("is_public", true)
    .not("proof_url", "is", null)
    .order("completed_at", { ascending: false });

  const questIds = [...new Set(completions?.map((c) => c.quest_id) ?? [])];
  const { data: quests } = questIds.length
    ? await supabase.from("quests").select("id, title, category, destination_id").in("id", questIds)
    : { data: [] as { id: string; title: string; category: string; destination_id: string }[] };
  const questById = new Map(quests?.map((q) => [q.id, q]));

  const destinationIds = [...new Set(quests?.map((q) => q.destination_id) ?? [])];
  const { data: destinations } = destinationIds.length
    ? await supabase.from("destinations").select("id, name").in("id", destinationIds)
    : { data: [] as { id: string; name: string }[] };
  const destinationById = new Map(destinations?.map((d) => [d.id, d]));

  // --- like e commenti sulle foto trovate ---
  const completionIds = completions?.map((c) => c.id) ?? [];
  const { data: likes } = completionIds.length
    ? await supabase
        .from("photo_likes")
        .select("quest_completion_id, user_id")
        .in("quest_completion_id", completionIds)
    : { data: [] as { quest_completion_id: string; user_id: string }[] };

  const likeCountByCompletion = new Map<string, number>();
  const likedByViewer = new Set<string>();
  likes?.forEach((l) => {
    likeCountByCompletion.set(
      l.quest_completion_id,
      (likeCountByCompletion.get(l.quest_completion_id) ?? 0) + 1
    );
    if (viewer && l.user_id === viewer.id) likedByViewer.add(l.quest_completion_id);
  });

  const { data: comments } = completionIds.length
    ? await supabase
        .from("photo_comments")
        .select("id, quest_completion_id, user_id, body, created_at")
        .in("quest_completion_id", completionIds)
        .order("created_at", { ascending: true })
    : {
        data: [] as {
          id: string;
          quest_completion_id: string;
          user_id: string;
          body: string;
          created_at: string;
        }[],
      };

  // quest-proofs è un bucket privato: l'URL "pubblico" salvato in DB non
  // funziona da solo, va rifirmato a ogni caricamento della pagina (vedi
  // lib/storage/quest-proof-url.ts per il perché).
  const displayUrlByCompletionId = new Map<string, string | null>(
    await Promise.all(
      (completions ?? [])
        .filter((c) => c.proof_url)
        .map(async (c) => [c.id, await resolveQuestProofUrl(supabase, c.proof_url!)] as const)
    )
  );

  const commenterIds = [...new Set(comments?.map((c) => c.user_id) ?? [])];
  const { data: commenters } = commenterIds.length
    ? await supabase.from("profiles").select("id, username").in("id", commenterIds)
    : { data: [] as { id: string; username: string }[] };
  const usernameById = new Map(commenters?.map((p) => [p.id, p.username]));

  // --- stato di blocco reciproco (Sezione 15.4) ---
  let viewerBlockedProfile = false;
  let profileBlockedViewer = false;
  if (viewer && !isOwnProfile) {
    const { data: blockRows } = await supabase
      .from("user_blocks")
      .select("blocker_id, blocked_id")
      .or(
        `and(blocker_id.eq.${viewer.id},blocked_id.eq.${profile.id}),and(blocker_id.eq.${profile.id},blocked_id.eq.${viewer.id})`
      );
    viewerBlockedProfile = blockRows?.some((b) => b.blocker_id === viewer.id) ?? false;
    profileBlockedViewer = blockRows?.some((b) => b.blocker_id === profile.id) ?? false;
  }

  // Il viewer può interagire (like/commento) solo se loggato, non ha
  // bloccato lui il proprietario del profilo (cortesia lato client: la
  // policy RLS non lo impedirebbe comunque) e non è stato bloccato dal
  // proprietario (qui la policy RLS rifiuterebbe la scrittura, questo
  // controllo evita solo di mostrare un pulsante che fallirebbe sempre).
  const canInteract = Boolean(viewer) && !viewerBlockedProfile && !profileBlockedViewer;

  // --- raggruppa le foto per destinazione ---
  type PhotoItem = {
    id: string;
    url: string;
    questTitle: string;
    categoryIcon: string;
    likeCount: number;
    likedByViewer: boolean;
    comments: { id: string; body: string; authorUsername: string; authorId: string; createdAt: string }[];
  };
  const photosByDestination = new Map<string, PhotoItem[]>();
  completions?.forEach((c) => {
    const quest = questById.get(c.quest_id);
    const displayUrl = displayUrlByCompletionId.get(c.id);
    if (!quest || !c.proof_url || !displayUrl) return;
    const item: PhotoItem = {
      id: c.id,
      url: displayUrl,
      questTitle: quest.title,
      categoryIcon: CATEGORY_ICONS[quest.category] ?? "🏅",
      likeCount: likeCountByCompletion.get(c.id) ?? 0,
      likedByViewer: likedByViewer.has(c.id),
      comments: (comments ?? [])
        .filter((cm) => cm.quest_completion_id === c.id)
        .map((cm) => ({
          id: cm.id,
          body: cm.body,
          authorUsername: usernameById.get(cm.user_id) ?? "?",
          authorId: cm.user_id,
          createdAt: cm.created_at,
        })),
    };
    const arr = photosByDestination.get(quest.destination_id) ?? [];
    arr.push(item);
    photosByDestination.set(quest.destination_id, arr);
  });

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{profile.username}</h1>
          <p className="text-sm text-gray-400">Livello {getLevel(profile.xp)}</p>
          {profile.bio && <p className="mt-2 text-gray-300">{profile.bio}</p>}
        </div>
        {viewer && !isOwnProfile && (
          <div className="flex gap-2">
            <BlockButton profileId={profile.id} initiallyBlocked={viewerBlockedProfile} />
            <ReportButton targetType="user" targetId={profile.id} />
          </div>
        )}
      </div>

      {achievements && achievements.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {achievements.map((a) => (
            <span
              key={a.id}
              title={a.name}
              className="rounded border border-yellow-700 bg-gray-900 px-2 py-1 text-sm"
            >
              {a.icon} {a.name}
            </span>
          ))}
        </div>
      )}

      {profileBlockedViewer && (
        <p className="mt-6 text-sm text-gray-500">
          Non puoi interagire con i contenuti di questo profilo.
        </p>
      )}

      <div className="mt-8 space-y-8">
        {photosByDestination.size === 0 ? (
          <p className="text-gray-400">Nessuna foto pubblica ancora.</p>
        ) : (
          [...photosByDestination.entries()].map(([destinationId, photos]) => (
            <div key={destinationId}>
              <h2 className="mb-3 text-lg font-semibold text-white">
                {destinationById.get(destinationId)?.name}
              </h2>
              <div className="flex gap-4 overflow-x-auto pb-2">
                {photos.map((photo) => (
                  <PhotoCard key={photo.id} photo={photo} canInteract={canInteract} />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
