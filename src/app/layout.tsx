import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/site-header";
import { BottomNav } from "@/components/bottom-nav";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WanderQuest",
  description: "Trasforma l'esplorazione di una città in una serie di Quest nel mondo reale.",
  // Collega il manifest PWA (Fase 9, Sezione 10): senza questo il browser
  // non offre "Aggiungi a schermata Home" e ignora le icone/il tema
  // definiti in public/manifest.json.
  manifest: "/manifest.json",
  appleWebApp: {
    title: "WanderQuest",
    statusBarStyle: "black-translucent",
  },
  // iOS non legge le icone dal manifest per "Aggiungi a Home": serve un
  // <link rel="apple-touch-icon"> esplicito, che Next.js genera da qui.
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Autenticazione letta una sola volta qui e passata giù a SiteHeader e
  // BottomNav (invece che ciascuno rifacesse la stessa query): la barra di
  // navigazione in basso (richiesta dall'utente: Home/Amici/Destinazioni/
  // Passport/Profilo, solo icone) compare solo per chi ha già effettuato
  // l'accesso, dato che quattro delle cinque destinazioni lo richiedono.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profile = user
    ? (
        await supabase.from("profiles").select("username, avatar_url").eq("id", user.id).single()
      ).data
    : null;

  return (
    <html
      lang="it"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-black">
        <SiteHeader user={user} username={profile?.username ?? null} />
        {/* pb-16 riserva lo spazio della bottom nav fissa, così non copre
            mai l'ultimo contenuto della pagina - solo quando la bottom nav
            è effettivamente presente (utente loggato). */}
        <div className={user ? "flex flex-1 flex-col pb-16" : "flex flex-1 flex-col"}>
          {children}
        </div>
        {user && <BottomNav avatarUrl={profile?.avatar_url ?? null} />}
      </body>
    </html>
  );
}
