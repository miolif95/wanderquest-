"use client";

import { useState } from "react";
import { ProfileEditForm } from "@/components/profile-edit-form";

/**
 * Wrapper per "Modifica profilo" dentro /profile. A differenza della
 * guida destinazione (Sezione 3.1) e di "Info aggiuntive" (Sezione 3.2),
 * qui serve stato controllato invece di un <details> nativo: dopo un
 * salvataggio riuscito il form deve richiudersi da solo (altrimenti resta
 * visibile un form "salvato" che sembra ancora in attesa di un'azione) -
 * un <details> non offre un modo per farlo chiudere da codice.
 */
export function ProfileEditToggle({
  userId,
  initialAvatarUrl,
  initialBio,
}: {
  userId: string;
  initialAvatarUrl: string | null;
  initialBio: string | null;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-3">
      <button
        onClick={() => setOpen((o) => !o)}
        className="text-sm text-bordeaux-400 hover:underline"
      >
        {open ? "Chiudi" : "Modifica profilo"}
      </button>
      {open && (
        <div className="mt-3">
          <ProfileEditForm
            userId={userId}
            initialAvatarUrl={initialAvatarUrl}
            initialBio={initialBio}
            onSaved={() => setOpen(false)}
          />
        </div>
      )}
    </div>
  );
}
