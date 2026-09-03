"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Pulsante "Avvia Quest" (Fase 5). Chiama POST /api/quests/:questId/start
 * e poi fa router.refresh(): la pagina è un Server Component che legge lo
 * stato da quest_completions, quindi serve un refresh per farle rileggere
 * il nuovo stato ACTIVE appena scritto, invece di gestire lo stato
 * localmente in questo componente.
 */
export function StartQuestButton({ questId }: { questId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStart() {
    setLoading(true);
    setError(null);

    const res = await fetch(`/api/quests/${questId}/start`, { method: "POST" });

    setLoading(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Impossibile avviare la Quest.");
      return;
    }

    router.refresh();
  }

  return (
    <div className="mt-6">
      {error && (
        <p className="mb-2 rounded bg-red-900/50 px-3 py-2 text-sm text-red-200">{error}</p>
      )}
      <button
        onClick={handleStart}
        disabled={loading}
        className="rounded bg-bordeaux-500 px-6 py-3 font-semibold text-black hover:bg-bordeaux-400 disabled:opacity-50"
      >
        {loading ? "Avvio in corso..." : "Avvia Quest"}
      </button>
    </div>
  );
}
