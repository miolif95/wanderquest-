import Link from "next/link";

/**
 * Pagina 404 personalizzata (Fase 9, "nessuno stato rotto o vuoto senza
 * messaggio"). Senza questo file, Next.js mostra la sua pagina 404 di
 * default - bianca, non coerente col tema scuro fisso di tutta l'app -
 * per qualunque notFound() chiamato dalle pagine (destinazione o Quest
 * inesistente, ecc.) o per una URL non corrispondente a nessuna route.
 */
export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 text-center">
      <p className="text-5xl">🧭</p>
      <h1 className="mt-4 text-2xl font-bold text-white">Pagina non trovata</h1>
      <p className="mt-2 text-gray-400">
        Il contenuto che cerchi non esiste o è stato rimosso.
      </p>
      <Link
        href="/"
        className="mt-6 rounded bg-yellow-500 px-6 py-3 font-semibold text-black hover:bg-yellow-400"
      >
        Torna alla Home
      </Link>
    </main>
  );
}
