"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ImageUpload } from "@/components/admin/image-upload";

type Destination = {
  id: string;
  name: string;
  country: string;
  description: string | null;
  image_url: string | null;
  latitude: number;
  longitude: number;
  is_active: boolean;
};

/**
 * Form di creazione/modifica destinazione, usato sia da
 * /admin/destinations/new sia da /admin/destinations/[id].
 *
 * In modalità modifica (destination valorizzato) fa PUT su
 * /api/admin/destinations/[id]; in creazione fa POST su
 * /api/admin/destinations (Tabella 13 della spec tecnica).
 */
export function DestinationForm({ destination }: { destination?: Destination }) {
  const router = useRouter();
  const isEdit = Boolean(destination);

  const [name, setName] = useState(destination?.name ?? "");
  const [country, setCountry] = useState(destination?.country ?? "");
  const [description, setDescription] = useState(destination?.description ?? "");
  const [imageUrl, setImageUrl] = useState<string | null>(destination?.image_url ?? null);
  const [latitude, setLatitude] = useState(destination?.latitude ?? 41.9028);
  const [longitude, setLongitude] = useState(destination?.longitude ?? 12.4964);
  const [isActive, setIsActive] = useState(destination?.is_active ?? true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      name,
      country,
      description: description || null,
      image_url: imageUrl,
      latitude,
      longitude,
      is_active: isActive,
    };

    const res = await fetch(
      isEdit ? `/api/admin/destinations/${destination!.id}` : "/api/admin/destinations",
      {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    setSaving(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Salvataggio fallito.");
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
      {error && (
        <p className="rounded bg-red-900/50 px-3 py-2 text-sm text-red-200">{error}</p>
      )}

      <div className="space-y-1">
        <label className="text-sm text-gray-300">Nome</label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm text-gray-300">Paese</label>
        <input
          required
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm text-gray-300">Descrizione</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-sm text-gray-300">Latitudine</label>
          <input
            type="number"
            step="any"
            required
            value={latitude}
            onChange={(e) => setLatitude(Number(e.target.value))}
            className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm text-gray-300">Longitudine</label>
          <input
            type="number"
            step="any"
            required
            value={longitude}
            onChange={(e) => setLongitude(Number(e.target.value))}
            className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm text-gray-300">Immagine</label>
        <ImageUpload value={imageUrl} onUploaded={setImageUrl} />
      </div>

      <label className="flex items-center gap-2 text-sm text-gray-300">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
        />
        Destinazione attiva (visibile nell&apos;app)
      </label>

      <button
        type="submit"
        disabled={saving}
        className="rounded bg-yellow-500 px-4 py-2 font-semibold text-black disabled:opacity-50"
      >
        {saving ? "Salvataggio..." : isEdit ? "Salva modifiche" : "Crea destinazione"}
      </button>
    </form>
  );
}
