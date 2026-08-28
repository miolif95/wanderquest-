"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Pulsante Blocca/Sblocca (Sezione 15.4). Scrive direttamente in
 * user_blocks via client (policy user_blocks_insert_own/delete_own,
 * Sezione 15.7): un utente bloccato non può più mettere like/commentare
 * le foto del bloccante, le righe esistenti restano.
 */
export function BlockButton({
  profileId,
  initiallyBlocked,
}: {
  profileId: string;
  initiallyBlocked: boolean;
}) {
  const router = useRouter();
  const [blocked, setBlocked] = useState(initiallyBlocked);
  const [loading, setLoading] = useState(false);

  async function toggleBlock() {
    setLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    if (blocked) {
      await supabase
        .from("user_blocks")
        .delete()
        .eq("blocker_id", user.id)
        .eq("blocked_id", profileId);
      setBlocked(false);
    } else {
      await supabase.from("user_blocks").insert({ blocker_id: user.id, blocked_id: profileId });
      setBlocked(true);
    }

    setLoading(false);
    router.refresh();
  }

  return (
    <button
      onClick={toggleBlock}
      disabled={loading}
      className="text-xs text-gray-400 hover:text-red-400 disabled:opacity-50"
    >
      {blocked ? "Sblocca" : "Blocca"}
    </button>
  );
}
