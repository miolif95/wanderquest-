import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/require-admin-api";
import { createAdminClient } from "@/lib/supabase/admin";

/** POST /api/admin/achievements - crea un achievement (Tabella 13). */
export async function POST(request: NextRequest) {
  const auth = await requireAdminApi();
  if (!auth.authorized) return auth.response;

  const body = await request.json();
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("achievements")
    .insert({
      code: body.code,
      name: body.name,
      description: body.description,
      icon: body.icon,
      condition_type: body.condition_type,
      condition_value: body.condition_value ?? {},
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data, { status: 201 });
}
