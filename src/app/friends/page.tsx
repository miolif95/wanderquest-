import Link from "next/link";
import { requireUser } from "@/lib/auth/require-user";
import { getLevel } from "@/lib/game/level";

/**
 * Amici (nuova pagina, richiesta dall'utente insieme alla bottom nav):
 * elenco di tutti gli utenti registrati, da cui aprire il profilo
 * pubblico (/u/[username], Sezione 15.1) di ciascuno. Non esiste un
 * concetto di "amicizia" vero e proprio nel modello dati (nessuna
 * richiesta/accettazione): qui semplicemente si sfoglia la community,
 * coerente con l'impostazione "profilo pubblico a tutti gli utenti
 * registrati fin dalla prima versione" della Sezione 15 della spec
 * tecnica.
 *
 * profiles è leggibile pubblicamente (policy profiles_select_public,
 * Tabella 2/10), quindi nessuna query privilegiata necessaria qui.
 */
export default async function FriendsPage() {
  const { user, supabase } = await requireUser();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, avatar_url, xp")
    .neq("id", user.id)
    .order("username", { ascending: true });

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
      <h1 className="mb-6 text-2xl font-bold text-white">Amici</h1>

      {!profiles || profiles.length === 0 ? (
        <p className="text-gray-400">Nessun altro utente registrato ancora.</p>
      ) : (
        <div className="space-y-3">
          {profiles.map((p) => (
            <Link
              key={p.id}
              href={`/u/${p.username}`}
              className="flex items-center gap-4 rounded-lg border border-gray-800 bg-gray-900 p-4 transition-colors hover:border-yellow-500"
            >
              {p.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element -- URL dinamico da Supabase Storage
                <img
                  src={p.avatar_url}
                  alt={p.username}
                  className="h-12 w-12 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-800 text-xl">
                  🧭
                </div>
              )}
              <div>
                <p className="font-semibold text-white">{p.username}</p>
                <p className="text-sm text-gray-400">Livello {getLevel(p.xp)}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
