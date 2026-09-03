import Link from "next/link";
import { requireAdmin } from "@/lib/admin/require-admin";

/**
 * Layout condiviso da tutte le pagine /admin/*. Chiama requireAdmin() per
 * primo: se l'utente non è admin, requireAdmin() fa già il redirect prima
 * che qualunque form o dato riservato venga renderizzato (Sezione 16.2).
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = await requireAdmin();

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 bg-gray-900 px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <nav className="flex items-center gap-6 text-sm">
            <Link href="/admin" className="font-bold text-bordeaux-400">
              WanderQuest Admin
            </Link>
            <Link href="/admin" className="hover:text-bordeaux-400">
              Destinazioni
            </Link>
            <Link href="/admin/achievements" className="hover:text-bordeaux-400">
              Achievement
            </Link>
          </nav>
          <span className="text-sm text-gray-400">{profile?.username}</span>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}
