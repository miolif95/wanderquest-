"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { ImageUpload } from "@/components/admin/image-upload";

// Leaflet accede a `window` al caricamento: va importato solo lato client,
// mai renderizzato lato server (vedi commento in map-picker.tsx).
const MapPicker = dynamic(() => import("./map-picker"), { ssr: false });

const CATEGORIES = ["LOCATION", "DISCOVERY", "PHOTO", "EXPERIENCE", "CHALLENGE"] as const;
const DIFFICULTIES = ["EASY", "MEDIUM", "HARD"] as const;
const COMPLETION_TYPES = ["GPS", "PHOTO", "MANUAL"] as const;

// Valori XP di riferimento per difficoltà (Sezione 6.1 della spec): usati
// solo per precompilare il campo xp_reward quando si cambia difficoltà,
// che resta comunque modificabile manualmente.
const XP_BY_DIFFICULTY: Record<(typeof DIFFICULTIES)[number], number> = {
  EASY: 50,
  MEDIUM: 100,
  HARD: 200,
};

type Quest = {
  id: string;
  destination_id: string;
  title: string;
  description: string;
  category: (typeof CATEGORIES)[number];
  difficulty: (typeof DIFFICULTIES)[number];
  xp_reward: number;
  completion_type: (typeof COMPLETION_TYPES)[number];
  latitude: number | null;
  longitude: number | null;
  radius_m: number | null;
  image_url: string | null;
  instructions: string | null;
  deep_info: string | null;
  completion_fact: string | null;
  requires_quest_id: string | null;
  sort_order: number;
  is_active: boolean;
};

/**
 * Form di creazione/modifica Quest, usato da /admin/quests/new (con
 * destinationId passato via query string) e /admin/quests/[id].
 *
 * La mappa cliccabile per lat/lng compare solo per completion_type GPS,
 * dato che è l'unico tipo di Quest per cui la posizione serve davvero
 * (Sezione 8: PHOTO e MANUAL non hanno una posizione target da validare).
 *
 * siblingQuests (Change Request "Guida, Profilo, Livelli", Sezione 4.2):
 * le altre Quest della stessa destinazione, per il selettore del
 * prerequisito - già filtrate dalla pagina server (esclude questa stessa
 * Quest in modifica, altrimenti si potrebbe creare un auto-blocco).
 */
export function QuestForm({
  destinationId,
  quest,
  siblingQuests,
}: {
  destinationId: string;
  quest?: Quest;
  siblingQuests: { id: string; title: string }[];
}) {
  const router = useRouter();
  const isEdit = Boolean(quest);

  const [title, setTitle] = useState(quest?.title ?? "");
  const [description, setDescription] = useState(quest?.description ?? "");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>(
    quest?.category ?? "LOCATION"
  );
  const [difficulty, setDifficulty] = useState<(typeof DIFFICULTIES)[number]>(
    quest?.difficulty ?? "EASY"
  );
  const [xpReward, setXpReward] = useState(quest?.xp_reward ?? XP_BY_DIFFICULTY.EASY);
  const [completionType, setCompletionType] = useState<(typeof COMPLETION_TYPES)[number]>(
    quest?.completion_type ?? "GPS"
  );
  const [latitude, setLatitude] = useState(quest?.latitude ?? 41.9028);
  const [longitude, setLongitude] = useState(quest?.longitude ?? 12.4964);
  const [radiusM, setRadiusM] = useState(quest?.radius_m ?? 100);
  const [imageUrl, setImageUrl] = useState<string | null>(quest?.image_url ?? null);
  const [instructions, setInstructions] = useState(quest?.instructions ?? "");
  const [deepInfo, setDeepInfo] = useState(quest?.deep_info ?? "");
  const [completionFact, setCompletionFact] = useState(quest?.completion_fact ?? "");
  const [requiresQuestId, setRequiresQuestId] = useState(quest?.requires_quest_id ?? "");
  const [sortOrder, setSortOrder] = useState(quest?.sort_order ?? 0);
  const [isActive, setIsActive] = useState(quest?.is_active ?? true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function handleDifficultyChange(value: (typeof DIFFICULTIES)[number]) {
    setDifficulty(value);
    setXpReward(XP_BY_DIFFICULTY[value]);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      destination_id: destinationId,
      title,
      description,
      category,
      difficulty,
      xp_reward: xpReward,
      completion_type: completionType,
      latitude: completionType === "GPS" ? latitude : null,
      longitude: completionType === "GPS" ? longitude : null,
      radius_m: completionType === "GPS" ? radiusM : null,
      image_url: imageUrl,
      instructions: instructions || null,
      deep_info: deepInfo || null,
      completion_fact: completionFact || null,
      requires_quest_id: requiresQuestId || null,
      sort_order: sortOrder,
      is_active: isActive,
    };

    const res = await fetch(isEdit ? `/api/admin/quests/${quest!.id}` : "/api/admin/quests", {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSaving(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Salvataggio fallito.");
      return;
    }

    router.push(`/admin/destinations/${destinationId}/quests`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
      {error && (
        <p className="rounded bg-red-900/50 px-3 py-2 text-sm text-red-200">{error}</p>
      )}

      <div className="space-y-1">
        <label className="text-sm text-gray-300">Titolo</label>
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm text-gray-300">Descrizione</label>
        <textarea
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-sm text-gray-300">Categoria</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as (typeof CATEGORIES)[number])}
            className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-sm text-gray-300">Difficoltà</label>
          <select
            value={difficulty}
            onChange={(e) => handleDifficultyChange(e.target.value as (typeof DIFFICULTIES)[number])}
            className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2"
          >
            {DIFFICULTIES.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-sm text-gray-300">XP</label>
          <input
            type="number"
            required
            value={xpReward}
            onChange={(e) => setXpReward(Number(e.target.value))}
            className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm text-gray-300">Tipo completamento</label>
          <select
            value={completionType}
            onChange={(e) =>
              setCompletionType(e.target.value as (typeof COMPLETION_TYPES)[number])
            }
            className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2"
          >
            {COMPLETION_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {completionType === "GPS" && (
        <div className="space-y-2">
          <label className="text-sm text-gray-300">
            Posizione (clicca sulla mappa per impostarla)
          </label>
          <MapPicker
            latitude={latitude}
            longitude={longitude}
            onChange={(lat, lng) => {
              setLatitude(lat);
              setLongitude(lng);
            }}
          />
          <div className="grid grid-cols-3 gap-4 text-sm text-gray-400">
            <span>Lat: {latitude.toFixed(5)}</span>
            <span>Lng: {longitude.toFixed(5)}</span>
            <label className="flex items-center gap-2">
              Raggio (m)
              <input
                type="number"
                value={radiusM}
                onChange={(e) => setRadiusM(Number(e.target.value))}
                className="w-20 rounded border border-gray-700 bg-gray-900 px-2 py-1"
              />
            </label>
          </div>
        </div>
      )}

      <div className="space-y-1">
        <label className="text-sm text-gray-300">Istruzioni (facoltative)</label>
        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          rows={2}
          className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm text-gray-300">Info aggiuntive (facoltative)</label>
        <p className="text-xs text-gray-500">
          Terzo componente del Quest Detail (Sezione 3.2): sempre accessibile, pensato per essere
          letto mentre si è in cammino verso il luogo.
        </p>
        <textarea
          value={deepInfo}
          onChange={(e) => setDeepInfo(e.target.value)}
          rows={3}
          className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm text-gray-300">Curiosità di completamento (facoltativa)</label>
        <p className="text-xs text-gray-500">
          Mostrata solo nel popup dopo un completamento riuscito, mai nella pagina Quest Detail.
        </p>
        <textarea
          value={completionFact}
          onChange={(e) => setCompletionFact(e.target.value)}
          rows={2}
          className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm text-gray-300">Prerequisito (facoltativo)</label>
        <p className="text-xs text-gray-500">
          Se impostato, questa Quest resta bloccata (LOCKED) finché l&apos;utente non completa la
          Quest selezionata qui.
        </p>
        <select
          value={requiresQuestId}
          onChange={(e) => setRequiresQuestId(e.target.value)}
          className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2"
        >
          <option value="">Nessuno - sempre disponibile</option>
          {siblingQuests.map((q) => (
            <option key={q.id} value={q.id}>
              {q.title}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label className="text-sm text-gray-300">Immagine</label>
        <ImageUpload value={imageUrl} onUploaded={setImageUrl} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-sm text-gray-300">Ordinamento</label>
          <input
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(Number(e.target.value))}
            className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2"
          />
        </div>
        <label className="flex items-center gap-2 self-end pb-2 text-sm text-gray-300">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          Quest attiva
        </label>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="rounded bg-bordeaux-500 px-4 py-2 font-semibold text-black disabled:opacity-50"
      >
        {saving ? "Salvataggio..." : isEdit ? "Salva modifiche" : "Crea Quest"}
      </button>
    </form>
  );
}
