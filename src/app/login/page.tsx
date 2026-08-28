"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Pagina di login (Sezione 11 della spec / route da Tabella 6: /login).
 * Creata come infrastruttura minima in Fase 2 per testare il pannello
 * admin, ora fa parte del flusso di autenticazione completo insieme a
 * /register (Fase 3).
 *
 * L'intera pagina è un Client Component ('use client') perché è solo un
 * form interattivo con stato locale (campi, errore, caricamento): non ha
 * bisogno di dati caricati lato server, quindi non serve separare una
 * versione server-component più complessa per ora.
 */
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (signInError) {
      setError("Email o password non corrette.");
      return;
    }

    // router.refresh() forza i Server Component della pagina di
    // destinazione a rileggere la sessione appena creata (senza, il
    // middleware avrebbe comunque aggiornato il cookie, ma la navigazione
    // client-side di Next.js potrebbe mostrare dati di una cache
    // precedente alla login).
    router.push("/admin");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-lg border border-gray-700 bg-gray-900 p-6"
      >
        <h1 className="text-xl font-bold text-white">Accedi</h1>

        {error && (
          <p className="rounded bg-red-900/50 px-3 py-2 text-sm text-red-200">
            {error}
          </p>
        )}

        <div className="space-y-1">
          <label htmlFor="email" className="text-sm text-gray-300">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-2 text-white"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="password" className="text-sm text-gray-300">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-2 text-white"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-yellow-500 py-2 font-semibold text-black disabled:opacity-50"
        >
          {loading ? "Accesso in corso..." : "Accedi"}
        </button>

        <p className="text-center text-sm text-gray-400">
          Non hai un account?{" "}
          <Link href="/register" className="text-yellow-400 hover:underline">
            Registrati
          </Link>
        </p>
      </form>
    </main>
  );
}
