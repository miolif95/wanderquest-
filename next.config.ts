import path from "node:path";
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

export default nextConfig;
