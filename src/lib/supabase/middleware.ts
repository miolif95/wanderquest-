import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Rinfresca il token di sessione Supabase a ogni richiesta e propaga il
 * cookie aggiornato sia sulla request (per i Server Component a valle) sia
 * sulla response (per il browser). Va chiamata dal middleware.ts di root
 * per OGNI richiesta di pagina: senza questo passaggio, la sessione
 * dell'utente scadrebbe silenziosamente dopo il primo refresh del token
 * lato Supabase Auth, disconnettendolo senza un motivo apparente.
 *
 * Nota: tra `createServerClient` e `supabase.auth.getUser()` non va
 * inserita altra logica. È una scelta voluta della libreria Supabase: la
 * chiamata a `getUser()` è quella che effettivamente rivalida il token e
 * decide se va rinnovato, quindi separarla da questo punto rischia di
 * introdurre bug di sessione difficili da diagnosticare.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Rivalida/rinnova il token di sessione leggendo l'utente corrente.
  // Il valore non serve qui: l'effetto collaterale (cookie aggiornato)
  // è ciò che conta per questa funzione.
  await supabase.auth.getUser();

  return supabaseResponse;
}
