import { createClient } from "@/lib/supabase/server";
import { AchievementForm } from "./achievement-form";

export default async function AdminAchievementsPage() {
  const supabase = await createClient();
  const { data: achievements } = await supabase
    .from("achievements")
    .select("*")
    .order("code");

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Achievement</h1>

      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-gray-800 text-sm text-gray-400">
            <th className="py-2">Icona</th>
            <th className="py-2">Codice</th>
            <th className="py-2">Nome</th>
            <th className="py-2">Condizione</th>
          </tr>
        </thead>
        <tbody>
          {achievements?.map((a) => (
            <tr key={a.id} className="border-b border-gray-900">
              <td className="py-3 text-xl">{a.icon}</td>
              <td className="py-3 font-mono text-sm text-gray-400">{a.code}</td>
              <td className="py-3">{a.name}</td>
              <td className="py-3 text-sm text-gray-400">
                {a.condition_type} {JSON.stringify(a.condition_value)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div>
        <h2 className="mb-4 text-lg font-semibold">Nuovo achievement</h2>
        <AchievementForm />
      </div>
    </div>
  );
}
