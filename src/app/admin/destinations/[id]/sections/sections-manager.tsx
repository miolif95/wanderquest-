"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Section = {
  id: string;
  label: string;
  icon: string | null;
  body: string;
  sort_order: number;
};

/**
 * Gestione CRUD + riordino dei paragrafi guida di una destinazione
 * (Change Request "Guida, Profilo, Livelli", Sezione 4.1). Un'unica
 * pagina che fa tutto (elenco, form di creazione, modifica inline,
 * eliminazione, frecce su/giù) invece di pagine /new e /[id] separate
 * come per destinations/quests: la sezione è un'entità molto più
 * leggera (tre campi), non giustifica lo stesso schema a più pagine.
 */
export function SectionsManager({
  destinationId,
  initialSections,
}: {
  destinationId: string;
  initialSections: Section[];
}) {
  const router = useRouter();
  const [sections, setSections] = useState<Section[]>(initialSections);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form di creazione, sempre visibile in fondo alla lista.
  const [newLabel, setNewLabel] = useState("");
  const [newIcon, setNewIcon] = useState("");
  const [newBody, setNewBody] = useState("");
  const [creating, setCreating] = useState(false);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setCreating(true);
    setError(null);

    const nextSortOrder = sections.length > 0 ? Math.max(...sections.map((s) => s.sort_order)) + 1 : 1;

    const res = await fetch(`/api/admin/destinations/${destinationId}/sections`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: newLabel, icon: newIcon, body: newBody, sort_order: nextSortOrder }),
    });

    setCreating(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Creazione non riuscita.");
      return;
    }

    const created: Section = await res.json();
    setSections((prev) => [...prev, created]);
    setNewLabel("");
    setNewIcon("");
    setNewBody("");
    router.refresh();
  }

  async function handleSaveEdit(section: Section) {
    setError(null);
    const res = await fetch(`/api/admin/sections/${section.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(section),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Salvataggio non riuscito.");
      return;
    }

    const updated: Section = await res.json();
    setSections((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    setEditingId(null);
    router.refresh();
  }

  async function handleDelete(id: string) {
    setError(null);
    const res = await fetch(`/api/admin/sections/${id}`, { method: "DELETE" });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Eliminazione non riuscita.");
      return;
    }

    setSections((prev) => prev.filter((s) => s.id !== id));
    router.refresh();
  }

  // Scambia il sort_order con il vicino (sopra o sotto) e salva entrambe
  // le righe: riordino "semplice" per frecce, sufficiente per l'MVP
  // (Sezione 4.1), niente drag-and-drop.
  async function handleMove(index: number, direction: "up" | "down") {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sections.length) return;

    setError(null);
    const current = sections[index];
    const target = sections[targetIndex];
    const swapped = [...sections];
    swapped[index] = { ...target, sort_order: current.sort_order };
    swapped[targetIndex] = { ...current, sort_order: target.sort_order };
    swapped.sort((a, b) => a.sort_order - b.sort_order);
    setSections(swapped);

    await Promise.all([
      fetch(`/api/admin/sections/${current.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...current, sort_order: target.sort_order }),
      }),
      fetch(`/api/admin/sections/${target.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...target, sort_order: current.sort_order }),
      }),
    ]);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {error && <p className="rounded bg-red-900/50 px-3 py-2 text-sm text-red-200">{error}</p>}

      {sections.length === 0 ? (
        <p className="text-gray-400">Nessuna sezione ancora creata per questa destinazione.</p>
      ) : (
        <div className="space-y-3">
          {sections.map((section, index) =>
            editingId === section.id ? (
              <SectionEditForm
                key={section.id}
                section={section}
                onCancel={() => setEditingId(null)}
                onSave={handleSaveEdit}
              />
            ) : (
              <div
                key={section.id}
                className="flex items-start justify-between rounded-lg border border-gray-800 bg-gray-900 p-4"
              >
                <div>
                  <p className="font-semibold text-white">
                    <span className="mr-2">{section.icon || "📍"}</span>
                    {section.label}
                  </p>
                  <p className="mt-1 max-w-xl text-sm text-gray-400">{section.body}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3 text-sm">
                  <button
                    onClick={() => handleMove(index, "up")}
                    disabled={index === 0}
                    className="text-gray-400 hover:text-bordeaux-400 disabled:opacity-30"
                    aria-label="Sposta su"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => handleMove(index, "down")}
                    disabled={index === sections.length - 1}
                    className="text-gray-400 hover:text-bordeaux-400 disabled:opacity-30"
                    aria-label="Sposta giù"
                  >
                    ↓
                  </button>
                  <button onClick={() => setEditingId(section.id)} className="text-bordeaux-400 hover:underline">
                    Modifica
                  </button>
                  <button onClick={() => handleDelete(section.id)} className="text-red-400 hover:underline">
                    Elimina
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      )}

      <form onSubmit={handleCreate} className="max-w-lg space-y-3 rounded-lg border border-gray-800 bg-gray-900 p-4">
        <h2 className="font-semibold text-white">+ Nuova sezione</h2>
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2 space-y-1">
            <label className="text-sm text-gray-300">Etichetta</label>
            <input
              required
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="Storia, Cibi tipici, Usanze..."
              className="w-full rounded border border-gray-700 bg-gray-800 px-3 py-2"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-gray-300">Icona (facoltativa)</label>
            <input
              value={newIcon}
              onChange={(e) => setNewIcon(e.target.value)}
              placeholder="🏛️"
              className="w-full rounded border border-gray-700 bg-gray-800 px-3 py-2"
            />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-sm text-gray-300">Testo</label>
          <textarea
            required
            value={newBody}
            onChange={(e) => setNewBody(e.target.value)}
            rows={4}
            className="w-full rounded border border-gray-700 bg-gray-800 px-3 py-2"
          />
        </div>
        <button
          type="submit"
          disabled={creating}
          className="rounded bg-bordeaux-500 px-4 py-2 font-semibold text-black disabled:opacity-50"
        >
          {creating ? "Aggiunta..." : "Aggiungi sezione"}
        </button>
      </form>
    </div>
  );
}

function SectionEditForm({
  section,
  onCancel,
  onSave,
}: {
  section: Section;
  onCancel: () => void;
  onSave: (section: Section) => void;
}) {
  const [label, setLabel] = useState(section.label);
  const [icon, setIcon] = useState(section.icon ?? "");
  const [body, setBody] = useState(section.body);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    await onSave({ ...section, label, icon: icon || null, body });
    setSaving(false);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-lg border border-bordeaux-600 bg-gray-900 p-4"
    >
      <div className="grid grid-cols-3 gap-3">
        <input
          required
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="col-span-2 rounded border border-gray-700 bg-gray-800 px-3 py-2"
        />
        <input
          value={icon}
          onChange={(e) => setIcon(e.target.value)}
          placeholder="Icona"
          className="rounded border border-gray-700 bg-gray-800 px-3 py-2"
        />
      </div>
      <textarea
        required
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={4}
        className="w-full rounded border border-gray-700 bg-gray-800 px-3 py-2"
      />
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded bg-bordeaux-500 px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
        >
          {saving ? "Salvataggio..." : "Salva"}
        </button>
        <button type="button" onClick={onCancel} className="rounded border border-gray-700 px-4 py-2 text-sm">
          Annulla
        </button>
      </div>
    </form>
  );
}
