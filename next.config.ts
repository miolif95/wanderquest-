import path from "node:path";
import withSerwistInit from "@serwist/next";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Fissa esplicitamente la root del progetto: senza questo, Turbopack la
    // inferisce risalendo le cartelle alla ricerca di un package-lock.json,
    // e può agganciarsi per errore a uno trovato più in alto (es. nella
    // home dell'utente), fuori dal repository git di questo progetto.
    root: path.resolve(__dirname),
  },
};

// Genera public/sw.js da src/sw.ts durante la build (Fase 9). Disabilitato
// in sviluppo: un service worker che intercetta le richieste renderebbe
// più fastidioso il normale ciclo di modifica-e-ricarica in dev.
const withSerwist = withSerwistInit({
  swSrc: "src/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

export default withSerwist(nextConfig);
