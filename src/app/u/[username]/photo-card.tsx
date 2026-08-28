"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ReportButton } from "@/components/report-button";

type Comment = {
  id: string;
  body: string;
  authorUsername: string;
  authorId: string;
  createdAt: string;
};

type Photo = {
  id: string;
  url: string;
  questTitle: string;
  categoryIcon: string;
  likeCount: number;
  likedByViewer: boolean;
  comments: Comment[];
};

/**
 * Card di una foto-prova pubblica (Sezione 15.1/15.3): like e commenti
 * scrivono direttamente via client, protetti dalle policy RLS
 * (photo_likes_insert_own/photo_comments_insert_own, Sezione 15.7) - non
 * serve un Route Handler, nessuna di queste scritture assegna XP o
 * richiede privilegi elevati.
 */
export function PhotoCard({ photo, canInteract }: { photo: Photo; canInteract: boolean }) {
  const [liked, setLiked] = useState(photo.likedByViewer);
  const [likeCount, setLikeCount] = useState(photo.likeCount);
  const [comments, setComments] = useState(photo.comments);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function toggleLike() {
    if (!canInteract) return;
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    if (liked) {
      await supabase
        .from("photo_likes")
        .delete()
        .eq("user_id", user.id)
        .eq("quest_completion_id", photo.id);
      setLiked(false);
      setLikeCount((c) => c - 1);
    } else {
      const { error: insertError } = await supabase
        .from("photo_likes")
        .insert({ user_id: user.id, quest_completion_id: photo.id });
      if (!insertError) {
        setLiked(true);
        setLikeCount((c) => c + 1);
      }
    }
  }

  async function submitComment(event: React.FormEvent) {
    event.preventDefault();
    if (!newComment.trim() || !canInteract) return;

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .single();

    const { data, error: insertError } = await supabase
      .from("photo_comments")
      .insert({ user_id: user.id, quest_completion_id: photo.id, body: newComment.trim() })
      .select()
      .single();

    if (insertError || !data) {
      setError("Commento non inviato.");
      return;
    }

    setComments((c) => [
      ...c,
      {
        id: data.id,
        body: data.body,
        authorUsername: profile?.username ?? "tu",
        authorId: user.id,
        createdAt: data.created_at,
      },
    ]);
    setNewComment("");
    setError(null);
  }

  return (
    <div className="w-56 shrink-0 rounded-lg border border-gray-800 bg-gray-900">
      <div className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element -- URL dinamico da Supabase Storage */}
        <img
          src={photo.url}
          alt={photo.questTitle}
          className="h-40 w-56 rounded-t-lg object-cover"
        />
        <span className="absolute left-2 top-2 rounded bg-black/70 px-2 py-0.5 text-xs text-white">
          {photo.categoryIcon} {photo.questTitle}
        </span>
      </div>
      <div className="p-2">
        <div className="flex items-center justify-between text-sm">
          <button
            onClick={toggleLike}
            disabled={!canInteract}
            className={liked ? "text-yellow-400" : "text-gray-400 disabled:opacity-50"}
          >
            {liked ? "★" : "☆"} {likeCount}
          </button>
          <button
            onClick={() => setShowComments((s) => !s)}
            className="text-gray-400 hover:text-white"
          >
            💬 {comments.length}
          </button>
          <ReportButton targetType="photo" targetId={photo.id} />
        </div>

        {showComments && (
          <div className="mt-2 space-y-1 border-t border-gray-800 pt-2">
            {comments.length === 0 && (
              <p className="text-xs text-gray-500">Nessun commento ancora.</p>
            )}
            {comments.map((c) => (
              <p key={c.id} className="text-xs text-gray-300">
                <span className="font-semibold">{c.authorUsername}</span>: {c.body}
              </p>
            ))}
            {canInteract && (
              <form onSubmit={submitComment} className="mt-1 flex gap-1">
                <input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Commenta..."
                  className="min-w-0 flex-1 rounded border border-gray-700 bg-gray-800 px-2 py-1 text-xs text-white"
                />
                <button
                  type="submit"
                  className="shrink-0 rounded bg-yellow-500 px-2 text-xs font-semibold text-black"
                >
                  Invia
                </button>
              </form>
            )}
            {error && <p className="text-xs text-red-400">{error}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
