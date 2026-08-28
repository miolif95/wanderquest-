import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/require-admin-api";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/admin/destinations/:id/sections - crea un paragrafo della
 * guida di una destinazione (Change Request "Guida, Profilo, Livelli",
 * Sezione 4.1). Stesso pattern degli altri Route Handler /api/admin/*:
 * verifica is_admin, poi scrive con la service role key perché
 * destination_sections non ha nessuna policy INSERT per client
 * autenticati (Checkpoint 1, coerente con destinations/quests/achievements).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi();
  if (!auth.authorized) return auth.response;

  const { id } = await params;
  const body = await request.json();
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("destination_sections")
    .insert({
      destination_id: id,
      label: body.label,
      icon: body.icon || null,
      body: body.body,
      sort_order: body.sort_order ?? 0,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data, { status: 201 });
}
