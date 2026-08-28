"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";

type QuestMarker = {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
  status: "AVAILABLE" | "ACTIVE" | "COMPLETED";
};

// Stessi colori usati per i badge di stato nelle altre pagine (grigio =
// disponibile, giallo = in corso, verde = completata), qui come colori
// esadecimali perché pathOptions di Leaflet non accetta classi Tailwind.
const STATUS_COLORS: Record<QuestMarker["status"], string> = {
  AVAILABLE: "#6b7280",
  ACTIVE: "#eab308",
  COMPLETED: "#22c55e",
};

/**
 * Mappa Leaflet in sola lettura con un marker per ogni Quest della
 * destinazione che ha una posizione GPS (Sezione 29 / Fase 8), colorato
 * in base allo stato della Quest per l'utente corrente.
 *
 * Stesso pattern di src/app/admin/quests/map-picker.tsx (CircleMarker
 * invece del marker di default di Leaflet, import via next/dynamic con
 * ssr:false da chi usa questo componente) ma senza gestione del click:
 * qui si guarda la mappa, non si sceglie una posizione.
 */
export default function QuestMap({
  centerLat,
  centerLng,
  quests,
}: {
  centerLat: number;
  centerLng: number;
  quests: QuestMarker[];
}) {
  return (
    <MapContainer center={[centerLat, centerLng]} zoom={14} style={{ height: 450, width: "100%" }}>
      <TileLayer url={process.env.NEXT_PUBLIC_MAP_TILE_URL!} />
      {quests.map((q) => (
        <CircleMarker
          key={q.id}
          center={[q.latitude, q.longitude]}
          radius={10}
          pathOptions={{
            color: STATUS_COLORS[q.status],
            fillColor: STATUS_COLORS[q.status],
            fillOpacity: 0.7,
          }}
        >
          <Popup>
            <strong>{q.title}</strong>
            <br />
            <a href={`/quests/${q.id}`}>Vedi dettaglio</a>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
