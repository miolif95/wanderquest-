import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Middleware globale: gira prima di ogni richiesta che matcha `config`
 * qui sotto, e si limita a tenere fresco il token di sessione Supabase
 * (vedi updateSession). Il controllo vero e proprio "questa pagina admin
 * richiede is_admin" NON avviene qui, ma nelle singole pagine /admin/*
 * (Sezione 16.2 della spec): il middleware gira su edge runtime e non è il
 * posto giusto per query al database, serve solo a non far scadere la
 * sessione dell'utente.
 */
export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Esegue il middleware su tutte le richieste tranne asset statici e
     * file immagine, per non sprecare esecuzioni su risorse che non hanno
     * bisogno di sessione aggiornata.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
