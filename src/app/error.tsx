"use client";

/**
 * Error boundary globale (Fase 9). Deve essere un Client Component per
 * costruzione di Next.js: intercetta gli errori non gestiti che sfuggono
 * al rendering di una pagina e mostra un messaggio coerente col tema
 * scuro dell'app invece della schermata di errore di default, con un
 * pulsante per ritentare (reset() re-informa il confine d'errore senza
 * ricaricare l'intera pagina).
 */
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 text-center">
      <p className="text-5xl">⚠️</p>
      <h1 className="mt-4 text-2xl font-bold text-white">Qualcosa è andato storto</h1>
      <p className="mt-2 text-gray-400">
        Si è verificato un errore imprevisto. Riprova, o torna più tardi se il problema persiste.
      </p>
      <button
        onClick={reset}
        className="mt-6 rounded bg-bordeaux-500 px-6 py-3 font-semibold text-black hover:bg-bordeaux-400"
      >
        Riprova
      </button>
    </main>
  );
}
