"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, CircleMarker, useMapEvents } from "react-leaflet";

/**
 * Mini-mappa Leaflet cliccabile per impostare latitude/longitude di una
 * Quest (Sezione 16.2 della spec: "riduce il rischio di coordinate
 * imprecise" rispetto a trascriverle a mano).
 *
 * Usa un CircleMarker (un semplice cerchio disegnato via SVG/Canvas)
 * invece del marker di default di Leaflet: il marker di default richiede
 * immagini (icon.png, icon-2x.png, shadow.png) che i bundler come Webpack
 * non risolvono automaticamente dal pacchetto leaflet, causando icone
 * rotte se non configurate a mano. Il CircleMarker evita del tutto il
 * problema.
 *
 * Questo file va sempre importato con `next/dynamic` e `ssr: false` da chi
 * lo usa: Leaflet accede a `window` al caricamento e romperebbe il render
 * lato server se importato normalmente.
 */
function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function MapPicker({
  latitude,
  longitude,
  onChange,
}: {
  latitude: number;
  longitude: number;
  onChange: (lat: number, lng: number) => void;
}) {
  return (
    <MapContainer
      center={[latitude, longitude]}
      zoom={14}
      style={{ height: 300, width: "100%" }}
    >
      <TileLayer url={process.env.NEXT_PUBLIC_MAP_TILE_URL!} />
      <CircleMarker center={[latitude, longitude]} radius={10} pathOptions={{ color: "#eab308" }} />
      <ClickHandler onPick={onChange} />
    </MapContainer>
  );
}
