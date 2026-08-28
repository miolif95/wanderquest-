import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getLevel } from "@/lib/game/level";

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

  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-black px-4 text-center">
      <h1 className="text-4xl font-bold text-white">WanderQuest</h1>
      <p className="mt-2 max-w-md text-gray-400">
        Trasforma l&apos;esplorazione di una città in una serie di Quest nel mondo reale.
      </p>

      {profile ? (
        <p className="mt-6 text-gray-300">
          Bentornato, <strong className="text-yellow-400">{profile.username}</strong> — Livello{" "}
          {getLevel(profile.xp)} · {profile.xp} XP
        </p>
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
