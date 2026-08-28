import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/require-admin-api";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/admin/destinations - crea una destinazione (Tabella 13).
 *
 * Scrive con la service_role key: le policy RLS su public.destinations
 * (Sezione 5.4) non permettono INSERT a nessun client autenticato "normale",
 * quindi questa è l'unica via per creare contenuto, dopo aver verificato
 * is_admin con requireAdminApi().
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdminApi();
  if (!auth.authorized) return auth.response;

  const body = await request.json();
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("destinations")
    .insert({
      name: body.name,
      country: body.country,
      description: body.description ?? null,
      image_url: body.image_url ?? null,
      latitude: body.latitude,
      longitude: body.longitude,
      is_active: body.is_active ?? true,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data, { status: 201 });
}
