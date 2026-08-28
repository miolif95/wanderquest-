/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker";
import { Serwist } from "serwist";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";

/**
 * Sorgente del service worker (Fase 9, Sezione 10 della spec: "cache
 * dell'app shell per un avvio rapido; non è necessario un funzionamento
 * offline completo per l'MVP"). @serwist/next compila questo file in
 * public/sw.js durante la build (vedi next.config.ts), iniettando
 * __SW_MANIFEST con l'elenco degli asset statici da precaricare.
 *
 * defaultCache di @serwist/next/worker copre già le strategie di caching
 * comuni per un'app Next.js (pagine, chunk JS/CSS, immagini, font):
 * sufficiente per l'obiettivo "avvio rapido" richiesto in questa fase,
 * senza bisogno di configurare strategie di caching custom.
 */
declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
});

serwist.addEventListeners();
