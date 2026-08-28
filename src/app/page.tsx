import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getLevelProgress } from "@/lib/game/level";

/**
 * Home (Sezione 12 della spec / route da Tabella 6: /).
 *
 * Punto di ingresso del Core Loop (Sezione 2): mostra un saluto e i
 * progressi se l'utente è loggato, altrimenti invita a iniziare. In
 * entrambi i casi porta a /destinations, dato che le destinazioni sono
 * pubbliche in lettura (policy destinations_select_public, Sezione 5.4)
 * e possono essere sfogliate anche senza account.
 *
 * Nota: la spec tecnica non descrive nel dettaglio il contenuto di questa
 * schermata (rimanda al PRD prodotto, che non è stato fornito insieme al
 * documento tecnico) - questa è quindi una versione minima e funzionale,
 * da rifinire quando il PRD sarà disponibile o in Fase 9.
 */
export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profile = user
    ? (
        await supabase.from("profiles").select("username, xp").eq("id", user.id).single()
      ).data
    : null;

  // Titolo di livello + barra di progresso (Change Request "Guida,
  // Profilo, Livelli", Sezione 3.4): stesso getLevelProgress() usato in
  // /profile e nella Completion Screen, mai un calcolo duplicato.
  const progress = profile ? getLevelProgress(profile.xp) : null;

  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-black px-4 text-center">
      <h1 className="text-4xl font-bold text-white">WanderQuest</h1>
      <p className="mt-2 max-w-md text-gray-400">
        Trasforma l&apos;esplorazione di una città in una serie di Quest nel mondo reale.
      </p>

      {profile && progress ? (
        <div className="mt-6 w-full max-w-xs">
          <p className="text-gray-300">
            Bentornato, <strong className="text-yellow-400">{profile.username}</strong>
          </p>
          <p className="mt-1 text-sm text-gray-400">
            Livello {progress.level} · <span className="text-yellow-400">{progress.title}</span>
          </p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-800">
            <div className="h-full bg-yellow-500" style={{ width: `${progress.progressRatio * 100}%` }} />
          </div>
        </div>
      ) : (
        <p className="mt-6 text-gray-300">Registrati per iniziare a tracciare i tuoi progressi.</p>
      )}

      <Link
        href="/destinations"
        className="mt-8 rounded bg-yellow-500 px-6 py-3 font-semibold text-black hover:bg-yellow-400"
      >
        Scegli una destinazione
      </Link>
    </main>
  );
}
