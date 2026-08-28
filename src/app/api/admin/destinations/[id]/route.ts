import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/require-admin-api";
import { createAdminClient } from "@/lib/supabase/admin";

/** PUT /api/admin/destinations/:id - aggiorna una destinazione (Tabella 13). */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi();
  if (!auth.authorized) return auth.response;

  const { id } = await params;
  const body = await request.json();
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("destinations")
    .update({
      name: body.name,
      country: body.country,
      description: body.description ?? null,
      image_url: body.image_url ?? null,
      latitude: body.latitude,
      longitude: body.longitude,
      is_active: body.is_active,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}

/**
 * DELETE /api/admin/destinations/:id (Tabella 13).
 *
 * Cancella in cascata anche le Quest della destinazione (on delete cascade
 * definito nella migrazione, Sezione 5): usare con attenzione dal
 * pannello, non c'è conferma a livello di API.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi();
  if (!auth.authorized) return auth.response;

  const { id } = await params;
  const admin = createAdminClient();

  const { error } = await admin.from("destinations").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
