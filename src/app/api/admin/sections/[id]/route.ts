import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/require-admin-api";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * PUT /api/admin/sections/:id - modifica un paragrafo della guida
 * (etichetta/icona/testo) o solo il suo sort_order (usato anche dal
 * riordino con le frecce su/giù, Sezione 4.1: "sufficiente per l'MVP, non
 * serve drag-and-drop").
 */
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
    .from("destination_sections")
    .update({
      label: body.label,
      icon: body.icon || null,
      body: body.body,
      sort_order: body.sort_order,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}

/** DELETE /api/admin/sections/:id */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi();
  if (!auth.authorized) return auth.response;

  const { id } = await params;
  const admin = createAdminClient();

  const { error } = await admin.from("destination_sections").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
