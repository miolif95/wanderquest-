"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const CONDITION_TYPES = [
  "FIRST_QUEST",
  "QUEST_COUNT",
  "CATEGORY_COUNT",
  "DESTINATION_COMPLETE",
] as const;

const CATEGORIES = ["LOCATION", "DISCOVERY", "PHOTO", "EXPERIENCE", "CHALLENGE"] as const;

/**
 * Form di creazione achievement (Sezione 6.2 / Tabella 4 della spec: gli
 * achievement iniziali sono già a database via seed.sql, questo form serve
 * per aggiungerne di nuovi dal pannello, come previsto da /admin/achievements
 * nella Tabella 12).
 *
 * condition_value è tipizzato in modo diverso a seconda di condition_type
 * (Sezione 6.2: {} per FIRST_QUEST/DESTINATION_COMPLETE, {count} per
 * QUEST_COUNT, {category, count} per CATEGORY_COUNT), quindi il form
 * mostra solo i campi rilevanti per il tipo scelto e li ricompone in JSON
 * al submit.
 */
export function AchievementForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("🏆");
  const [conditionType, setConditionType] =
    useState<(typeof CONDITION_TYPES)[number]>("QUEST_COUNT");
  const [count, setCount] = useState(5);
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("LOCATION");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function buildConditionValue(): Record<string, unknown> {
    switch (conditionType) {
      case "FIRST_QUEST":
      case "DESTINATION_COMPLETE":
        return {};
      case "QUEST_COUNT":
        return { count };
      case "CATEGORY_COUNT":
        return { category, count };
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const res = await fetch("/api/admin/achievements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        name,
        description,
        icon,
        condition_type: conditionType,
        condition_value: buildConditionValue(),
      }),
    });

    setSaving(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Creazione fallita.");
      return;
    }

    setCode("");
    setName("");
    setDescription("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
      {error && (
        <p className="rounded bg-red-900/50 px-3 py-2 text-sm text-red-200">{error}</p>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-sm text-gray-300">Codice (univoco)</label>
          <input
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="es. night_owl"
            className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm text-gray-300">Icona (emoji)</label>
          <input
            required
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2"
          />
        </div>
      </div>

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
        <label className="text-sm text-gray-300">Descrizione</label>
        <input
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm text-gray-300">Condizione</label>
        <select
          value={conditionType}
          onChange={(e) => setConditionType(e.target.value as (typeof CONDITION_TYPES)[number])}
          className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2"
        >
          {CONDITION_TYPES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {(conditionType === "QUEST_COUNT" || conditionType === "CATEGORY_COUNT") && (
        <div className="space-y-1">
          <label className="text-sm text-gray-300">Numero di Quest richieste</label>
          <input
            type="number"
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2"
          />
        </div>
      )}

      {conditionType === "CATEGORY_COUNT" && (
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
      )}

      <button
        type="submit"
        disabled={saving}
        className="rounded bg-yellow-500 px-4 py-2 font-semibold text-black disabled:opacity-50"
      >
        {saving ? "Creazione..." : "Crea achievement"}
      </button>
    </form>
  );
}
