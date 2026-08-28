"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Props = {
  userId: string;
  initialAvatarUrl: string | null;
  initialBio: string | null;
  /** Chiamato dopo un salvataggio riuscito (il chiamante decide cosa fare: chiudere il form, navigare altrove...). */
  onSaved?: () => void;
  /** Se presente, mostra un pulsante "Salta" che chiama questa funzione senza salvare nulla (Sezione 3.3: l'onboarding non deve bloccare l'accesso al resto dell'app). */
  onSkip?: () => void;
};

/**
 * Form condiviso per impostare foto profilo + bio (Change Request "Guida,
 * Profilo, Livelli", Sezione 3.3), usato sia da /onboarding/profile
 * (subito dopo il primo login) sia dal pulsante "Modifica profilo" dentro
 * /profile (precompilato con i valori correnti).
 *
 * Scrive avatar_url e bio direttamente da client via SDK Supabase: la
 * policy profiles_update_own esistente lo permette già, e dal Checkpoint 1
 * di questa stessa estensione il grant di colonna è stato ristretto
 * esattamente a (avatar_url, bio) - qui non serve un Route Handler perché
 * non si assegna alcuna ricompensa di gioco (a differenza del
 * completamento Quest, Sezione 8).
 */
export function ProfileEditForm({ userId, initialAvatarUrl, initialBio, onSaved, onSkip }: Props) {
  const router = useRouter();
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [bio, setBio] = useState(initialBio ?? "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    // Stessa convenzione di path di quest-proofs ({user_id}/{filename}):
    // la policy avatars_write_own (Checkpoint 1) permette di scrivere solo
    // sotto la propria cartella. { upsert: true } sovrascrive un eventuale
    // avatar precedente con lo stesso nome file invece di fallire.
    const supabase = createClient();
    const extension = file.name.split(".").pop() ?? "jpg";
    const path = `${userId}/avatar.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, contentType: file.type });

    setUploading(false);

    if (uploadError) {
      setError("Caricamento della foto non riuscito.");
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(path);
    // Il bucket è pubblico ma la cache del browser/CDN potrebbe servire la
    // vecchia immagine per lo stesso path: un parametro di query univoco
    // forza un fetch fresco senza dover generare un nome file diverso a
    // ogni upload.
    setAvatarUrl(`${publicUrl}?t=${Date.now()}`);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: avatarUrl, bio: bio.trim() || null })
      .eq("id", userId);

    setSaving(false);

    if (updateError) {
      setError("Salvataggio non riuscito.");
      return;
    }

    router.refresh();
    onSaved?.();
  }

  return (
    <div className="space-y-4 rounded-lg border border-gray-800 bg-gray-900 p-4">
      {error && <p className="rounded bg-red-900/50 px-3 py-2 text-sm text-red-200">{error}</p>}

      <div className="flex items-center gap-4">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- URL dinamico da Supabase Storage
          <img src={avatarUrl} alt="Foto profilo" className="h-16 w-16 rounded-full object-cover" />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-800 text-2xl">
            🧭
          </div>
        )}
        <div>
          <label className="block cursor-pointer text-sm text-yellow-400 hover:underline">
            {uploading ? "Caricamento..." : "Carica una foto"}
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              disabled={uploading || saving}
              className="hidden"
            />
          </label>
        </div>
      </div>

      <div className="space-y-1">
        <label htmlFor="bio" className="text-sm text-gray-300">
          Bio
        </label>
        <textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={280}
          rows={3}
          placeholder="Racconta qualcosa di te..."
          className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-white"
        />
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={saving || uploading}
          className="rounded bg-yellow-500 px-4 py-2 text-sm font-semibold text-black hover:bg-yellow-400 disabled:opacity-50"
        >
          {saving ? "Salvataggio..." : "Salva"}
        </button>
        {onSkip && (
          <button
            onClick={onSkip}
            disabled={saving}
            className="rounded border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:border-gray-500"
          >
            Salta
          </button>
        )}
      </div>
    </div>
  );
}
