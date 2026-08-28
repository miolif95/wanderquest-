import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
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

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="it"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-black">
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
