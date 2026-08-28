"use client";

import { useState } from "react";

/**
 * Campo di upload immagine riusabile per i form admin (destinazione e
 * Quest). Carica il file scelto su /api/admin/upload (che scrive nel
 * bucket Storage "content-images" con la service_role key, Sezione 16.3)
 * e comunica l'URL risultante al form chiamante tramite onUploaded, che lo
 * salva nel campo image_url della destinazione/Quest.
 */
export function ImageUpload({
  value,
  onUploaded,
}: {
  value: string | null;
  onUploaded: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/admin/upload", {
      method: "POST",
      body: formData,
    });

    setUploading(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Upload fallito.");
      return;
    }

    const { url } = await res.json();
    onUploaded(url);
  }

  return (
    <div className="space-y-2">
      {value && (
        // eslint-disable-next-line @next/next/no-img-element -- anteprima di un URL Storage dinamico, non un asset locale ottimizzabile
        <img
          src={value}
          alt="Anteprima immagine"
          className="h-32 w-full rounded object-cover"
        />
      )}
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={uploading}
        className="text-sm text-gray-300"
      />
      {uploading && <p className="text-sm text-gray-400">Caricamento...</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
