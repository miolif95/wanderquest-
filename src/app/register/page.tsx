"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

/**
 * Pagina di registrazione (Fase 3, Sezione 11 della spec / route da
 * Tabella 6: /register).
 *
 * Il progetto Supabase ha la conferma email attiva di default
 * (mailer_autoconfirm: false, verificato via /auth/v1/settings): dopo la
 * registrazione l'utente NON ha subito una sessione valida, deve prima
 * cliccare il link ricevuto via email. Per questo qui non si fa alcun
 * redirect automatico al login riuscito, ma si mostra solo un messaggio
 * di conferma.
 */
export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();

    // Pre-check dello username prima di provare la registrazione vera e
    // propria: il trigger handle_new_user (Sezione 5.3) fallirebbe
    // comunque per via del vincolo unique su profiles.username, ma
    // l'errore che arriverebbe da supabase.auth.signUp() in quel caso non
    // è un messaggio pensato per l'utente finale ("Database error saving
    // new user" o simile) - meglio intercettare il problema prima e dare
    // un messaggio chiaro, come richiesto dalla Sezione 5.3 della spec.
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", username)
      .maybeSingle();

    if (existing) {
      setError("Questo username è già in uso, scegline un altro.");
      setLoading(false);
      return;
    }

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });

    setLoading(false);

    if (signUpError) {
      setError(
        signUpError.message.includes("already registered")
          ? "Questa email è già registrata."
          : "Registrazione non riuscita, riprova."
      );
      return;
    }

    setSuccess(true);
  }

  if (success) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black px-4">
        <div className="w-full max-w-sm space-y-4 rounded-lg border border-gray-700 bg-gray-900 p-6 text-center">
          <h1 className="text-xl font-bold text-white">Controlla la tua email</h1>
          <p className="text-sm text-gray-300">
            Ti abbiamo inviato un link di conferma a <strong>{email}</strong>. Clicca il
            link per attivare l&apos;account, poi torna qui per accedere.
          </p>
          <Link href="/login" className="text-yellow-400 hover:underline">
            Vai al login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-lg border border-gray-700 bg-gray-900 p-6"
      >
        <h1 className="text-xl font-bold text-white">Crea un account</h1>

        {error && (
          <p className="rounded bg-red-900/50 px-3 py-2 text-sm text-red-200">{error}</p>
        )}

        <div className="space-y-1">
          <label htmlFor="username" className="text-sm text-gray-300">
            Username
          </label>
          <input
            id="username"
            required
            minLength={3}
            pattern="[a-zA-Z0-9_]+"
            title="Solo lettere, numeri e underscore"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-2 text-white"
          />
        </div>

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
            minLength={6}
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
          {loading ? "Registrazione in corso..." : "Registrati"}
        </button>

        <p className="text-center text-sm text-gray-400">
          Hai già un account?{" "}
          <Link href="/login" className="text-yellow-400 hover:underline">
            Accedi
          </Link>
        </p>
      </form>
    </main>
  );
}
