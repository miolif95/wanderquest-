"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/friends", label: "Amici", icon: "👥" },
  { href: "/destinations", label: "Destinazioni", icon: "🗺️" },
  { href: "/passport", label: "Passport", icon: "🛂" },
];

/**
 * Barra di navigazione fissa in basso, richiesta dall'utente:
 * Home/Amici/Destinazioni/Passport/Profilo, solo icone senza etichetta
 * testuale. Renderizzata da root layout.tsx solo per utenti loggati (le
 * ultime tre voci richiedono un account). Client Component perché serve
 * usePathname() per evidenziare la voce corrente.
 */
export function BottomNav({ avatarUrl }: { avatarUrl: string | null }) {
  const pathname = usePathname();

  function isActive(href: string) {
    return href === "/" ? pathname === "/" : pathname.startsWith(href);
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 flex items-center justify-around border-t border-gray-800 bg-gray-900 py-2">
      {ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-label={item.label}
          className={`flex h-11 w-11 items-center justify-center rounded-full text-2xl ${
            isActive(item.href) ? "bg-bordeaux-500/20 text-bordeaux-400" : "text-gray-400"
          }`}
        >
          {item.icon}
        </Link>
      ))}
      <Link
        href="/profile"
        aria-label="Profilo"
        className={`flex h-11 w-11 items-center justify-center overflow-hidden rounded-full ${
          isActive("/profile") ? "ring-2 ring-bordeaux-400" : ""
        }`}
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- URL dinamico da Supabase Storage
          <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <span
            className={`flex h-full w-full items-center justify-center text-2xl ${
              isActive("/profile") ? "text-bordeaux-400" : "text-gray-400"
            }`}
          >
            👤
          </span>
        )}
      </Link>
    </nav>
  );
}
