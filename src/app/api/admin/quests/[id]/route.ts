import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/require-admin-api";
import { createAdminClient } from "@/lib/supabase/admin";

/** PUT /api/admin/quests/:id - aggiorna una Quest (Tabella 13). */
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
    .from("quests")
    .update({
      title: body.title,
      description: body.description,
      category: body.category,
      difficulty: body.difficulty,
      xp_reward: body.xp_reward,
      completion_type: body.completion_type,
      latitude: body.latitude ?? null,
      longitude: body.longitude ?? null,
      radius_m: body.radius_m ?? null,
      image_url: body.image_url ?? null,
      instructions: body.instructions ?? null,
      sort_order: body.sort_order ?? 0,
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

/** DELETE /api/admin/quests/:id (Tabella 13). */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi();
  if (!auth.authorized) return auth.response;

  const { id } = await params;
  const admin = createAdminClient();

  const { error } = await admin.from("quests").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
