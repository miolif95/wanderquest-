import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/require-admin-api";
import { createAdminClient } from "@/lib/supabase/admin";

/** POST /api/admin/quests - crea una Quest (Tabella 13). */
export async function POST(request: NextRequest) {
  const auth = await requireAdminApi();
  if (!auth.authorized) return auth.response;

  const body = await request.json();
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("quests")
    .insert({
      destination_id: body.destination_id,
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
      deep_info: body.deep_info ?? null,
      completion_fact: body.completion_fact ?? null,
      requires_quest_id: body.requires_quest_id ?? null,
      sort_order: body.sort_order ?? 0,
      is_active: body.is_active ?? true,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data, { status: 201 });
}
