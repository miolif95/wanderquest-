"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { CompleteQuestResponse } from "@/lib/game/types";

type Props = {
  questId: string;
  completionId: string;
  userId: string;
  completionType: "GPS" | "PHOTO" | "MANUAL";
  destinationId: string;
};

/**
 * Pannello di completamento Quest (Fase 6, Sezione 8 della spec tecnica).
 * Gestisce i tre flussi (GPS/Foto/Manuale) e, in caso di successo, mostra
 * al posto del pulsante la Completion Screen (Sezione 23 del PRD, tipo
 * CompleteQuestResponse) con XP guadagnati, eventuale level-up,
 * achievement sbloccati e WanderStamp aggiornato.
 */
export function CompleteQuestPanel({
  questId,
  completionId,
  userId,
  completionType,
  destinationId,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CompleteQuestResponse | null>(null);

  async function submitComplete(body: Record<string, unknown>) {
    setLoading(true);
    setError(null);

    const res = await fetch(`/api/quests/${questId}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Completamento non riuscito.");
      return;
    }

    const data: CompleteQuestResponse = await res.json();
    setResult(data);
    // Niente router.refresh() qui: il Server Component che contiene
    // questo pannello lo renderizza solo quando lo stato è ACTIVE, quindi
    // un refresh immediato lo smonterebbe subito, cancellando la
    // Completion Screen prima che l'utente possa vederla. Il badge "In
    // corso" in cima alla pagina resta quindi non aggiornato finché
    // l'utente non naviga altrove (es. col link qui sotto), che è
    // comunque quando la pagina viene ri-renderizzata da zero lato server.
  }

  async function handleManualComplete() {
    await submitComplete({});
  }

  async function handleGpsComplete() {
    if (!("geolocation" in navigator)) {
      setError("Il browser non supporta la geolocalizzazione.");
      return;
    }
    setLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        await submitComplete({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => {
        setLoading(false);
        setError("Non è stato possibile ottenere la posizione. Controlla i permessi del browser.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function handlePhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    // Upload diretto del client verso Storage (Sezione 7): non passa da
    // un Route Handler. Il path {user_id}/{completion_id}.ext è la
    // convenzione richiesta dalla policy di lettura quest_proofs
    // (Sezione 5.5) per poter risalire a proprietario e visibilità.
    const supabase = createClient();
    const extension = file.name.split(".").pop() ?? "jpg";
    const path = `${userId}/${completionId}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("quest-proofs")
      .upload(path, file, { upsert: true, contentType: file.type });

    if (uploadError) {
      setLoading(false);
      setError("Caricamento della foto non riuscito.");
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("quest-proofs").getPublicUrl(path);

    await submitComplete({ photoUrl: publicUrl });
  }

  if (result) {
    return (
      <div className="mt-6 rounded-lg border border-yellow-500 bg-gray-900 p-6 text-center">
        <p className="text-2xl">🎉</p>
        <h2 className="mt-2 text-xl font-bold text-white">Quest completata!</h2>
        <p className="mt-1 text-yellow-400">+{result.xpGained} XP</p>

        {result.leveledUp && (
          <p className="mt-2 rounded bg-yellow-900/50 px-3 py-2 text-yellow-300">
            Sei salito al livello {result.newLevel}: <strong>{result.newLevelTitle}</strong>!
          </p>
        )}

        {/* Curiosità di completamento (Change Request "Guida, Profilo,
            Livelli", Sezione 3.2): appare SOLO qui, mai nella pagina Quest
            Detail - null se non impostata in admin, in quel caso il
            blocco è semplicemente omesso. */}
        {result.completionFact && (
          <div className="mt-4 rounded border border-gray-700 bg-gray-800 px-3 py-2 text-left">
            <p className="mb-1 text-xs font-semibold text-gray-400">💡 Lo sapevi?</p>
            <p className="text-sm text-gray-300">{result.completionFact}</p>
          </div>
        )}

        {result.achievementsUnlocked.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-sm text-gray-400">Achievement sbloccati</p>
            <div className="flex flex-wrap justify-center gap-3">
              {result.achievementsUnlocked.map((a) => (
                <div
                  key={a.id}
                  className="rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm"
                  title={a.description}
                >
                  <span className="mr-1">{a.icon}</span>
                  {a.name}
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="mt-4 text-sm text-gray-400">
          {result.wanderstamp.questsCompleted} Quest completate in questa destinazione ·{" "}
          {result.wanderstamp.xpEarned} XP totali qui
        </p>

        <Link
          href={`/destinations/${destinationId}/quests`}
          className="mt-6 inline-block text-yellow-400 hover:underline"
        >
          Torna alla lista Quest
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-6">
      {error && (
        <p className="mb-2 rounded bg-red-900/50 px-3 py-2 text-sm text-red-200">{error}</p>
      )}

      {completionType === "MANUAL" && (
        <button
          onClick={handleManualComplete}
          disabled={loading}
          className="rounded bg-yellow-500 px-6 py-3 font-semibold text-black hover:bg-yellow-400 disabled:opacity-50"
        >
          {loading ? "Completamento..." : "Completa Quest"}
        </button>
      )}

      {completionType === "GPS" && (
        <button
          onClick={handleGpsComplete}
          disabled={loading}
          className="rounded bg-yellow-500 px-6 py-3 font-semibold text-black hover:bg-yellow-400 disabled:opacity-50"
        >
          {loading ? "Verifica posizione..." : "Completa Quest (verifica posizione)"}
        </button>
      )}

      {completionType === "PHOTO" && (
        <div>
          <label className="mb-2 block text-sm text-gray-300">
            Carica una foto per completare la Quest
          </label>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handlePhotoChange}
            disabled={loading}
            className="text-sm text-gray-300"
          />
          {loading && <p className="mt-2 text-sm text-gray-400">Caricamento...</p>}
        </div>
      )}
    </div>
  );
}
