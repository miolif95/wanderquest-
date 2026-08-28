import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/require-admin-api";
import { createAdminClient } from "@/lib/supabase/admin";

/** PUT /api/admin/achievements/:id - aggiorna un achievement (Tabella 13). */
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
    .from("achievements")
    .update({
      code: body.code,
      name: body.name,
      description: body.description,
      icon: body.icon,
      condition_type: body.condition_type,
      condition_value: body.condition_value ?? {},
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}

/** DELETE /api/admin/achievements/:id (Tabella 13). */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi();
  if (!auth.authorized) return auth.response;

  const { id } = await params;
  const admin = createAdminClient();

  const { error } = await admin.from("achievements").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
