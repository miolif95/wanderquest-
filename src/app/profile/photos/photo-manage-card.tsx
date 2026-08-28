"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Gestione di una singola foto-prova (Sezione 15.5: "rendi privata,
 * cancella"). Il toggle di visibilità scrive is_public direttamente via
 * client, permesso dalla policy quest_completions_update_own_visibility
 * e dal grant di colonna dedicato (Fase 10) anche su una Quest già
 * COMPLETED - a differenza della policy "solo se ACTIVE" di Fase 5.
 *
 * "Cancella" qui rimuove solo la foto (il file da Storage e l'URL),
 * NON la Quest completata: il completamento e l'XP guadagnato restano,
 * cambia solo che non c'è più una foto da mostrare/rendere pubblica.
 */
export function PhotoManageCard({
  completionId,
  url,
  questTitle,
  initiallyPublic,
}: {
  completionId: string;
  url: string;
  questTitle: string;
  initiallyPublic: boolean;
}) {
  const [isPublic, setIsPublic] = useState(initiallyPublic);
  const [deleted, setDeleted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggleVisibility() {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("quest_completions")
      .update({ is_public: !isPublic })
      .eq("id", completionId);
    setLoading(false);
    if (updateError) {
      setError("Aggiornamento non riuscito.");
      return;
    }
    setIsPublic((p) => !p);
  }

  async function deletePhoto() {
    setLoading(true);
    setError(null);
    const supabase = createClient();

    // Il path dentro il bucket è tutto ciò che segue "/quest-proofs/"
    // nell'URL pubblico (Sezione 5.5: {user_id}/{completion_id}.ext).
    const path = url.split("/quest-proofs/")[1];
    if (path) {
      const { error: removeError } = await supabase.storage.from("quest-proofs").remove([path]);
      // storage.remove() non genera un errore bloccante se RLS impedisce la
      // cancellazione (risponde comunque con status 200 e un array vuoto in
      // "data" invece di un "error" popolato) - per questo va controllato
      // esplicitamente il campo error, altrimenti il bug passa inosservato:
      // la card sparisce dalla UI ma il file resta nello Storage.
      if (removeError) {
        setLoading(false);
        setError("Cancellazione del file non riuscita.");
        return;
      }
    }

    const { error: updateError } = await supabase
      .from("quest_completions")
      .update({ is_public: false })
      .eq("id", completionId);
    // Nota: proof_url non è tra le colonne concesse in scrittura al
    // client (Fase 10, per lo stesso motivo per cui non può essere
    // falsificato) - resta valorizzato a database anche dopo la
    // cancellazione del file da Storage, ma qui si nasconde comunque la
    // card impostando "deleted" localmente e la foto non è più
    // pubblicamente visibile perché is_public è stato appena portato a
    // false.

    setLoading(false);
    if (updateError) {
      setError("Cancellazione non riuscita.");
      return;
    }
    setDeleted(true);
  }

  if (deleted) return null;

  return (
    <div className="overflow-hidden rounded-lg border border-gray-800 bg-gray-900">
      {/* eslint-disable-next-line @next/next/no-img-element -- URL dinamico da Supabase Storage */}
      <img src={url} alt={questTitle} className="h-40 w-full object-cover" />
      <div className="p-3">
        <p className="mb-2 text-sm font-semibold text-white">{questTitle}</p>
        {error && <p className="mb-2 text-xs text-red-400">{error}</p>}
        <div className="flex items-center justify-between text-xs">
          <button
            onClick={toggleVisibility}
            disabled={loading}
            className="text-yellow-400 hover:underline disabled:opacity-50"
          >
            {isPublic ? "Rendi privata" : "Rendi pubblica"}
          </button>
          <button
            onClick={deletePhoto}
            disabled={loading}
            className="text-red-400 hover:underline disabled:opacity-50"
          >
            Elimina foto
          </button>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          {isPublic ? "Visibile sul tuo profilo pubblico" : "Privata"}
        </p>
      </div>
    </div>
  );
}
