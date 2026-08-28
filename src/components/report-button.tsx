"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Pulsante "Segnala" riusabile per foto/commenti/profili (Sezione 15.4:
 * moderazione minima). Scrive direttamente in content_reports via client,
 * protetto dalla policy content_reports_insert_own (Sezione 15.7) - non
 * serve un Route Handler, la segnalazione non assegna nessuna ricompensa
 * né richiede privilegi elevati.
 *
 * Nessuna dashboard di moderazione nell'MVP (Sezione 15.4): le
 * segnalazioni si consultano solo via SQL Editor o service_role.
 */
export function ReportButton({
  targetType,
  targetId,
}: {
  targetType: "photo" | "comment" | "user";
  targetId: string;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Devi accedere per segnalare.");
      return;
    }

    const { error: insertError } = await supabase.from("content_reports").insert({
      reporter_id: user.id,
      target_type: targetType,
      target_id: targetId,
      reason: reason.trim() || null,
    });

    if (insertError) {
      setError("Segnalazione non riuscita.");
      return;
    }

    setSubmitted(true);
    setOpen(false);
  }

  if (submitted) {
    return <span className="text-xs text-gray-500">Segnalato</span>;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="text-xs text-gray-500 hover:text-red-400"
      >
        Segnala
      </button>
      {open && (
        <form
          onSubmit={handleSubmit}
          className="absolute right-0 z-10 mt-1 w-56 space-y-2 rounded border border-gray-700 bg-gray-900 p-3 shadow-lg"
        >
          {error && <p className="text-xs text-red-400">{error}</p>}
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Motivo (facoltativo)"
            rows={2}
            className="w-full rounded border border-gray-700 bg-gray-800 p-1 text-xs text-white"
          />
          <button
            type="submit"
            className="w-full rounded bg-red-700 py-1 text-xs font-semibold text-white hover:bg-red-600"
          >
            Invia segnalazione
          </button>
        </form>
      )}
    </div>
  );
}
