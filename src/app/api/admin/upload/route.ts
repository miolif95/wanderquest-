import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/require-admin-api";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/admin/upload
 *
 * Carica un'immagine (destinazione o Quest) nel bucket Storage pubblico
 * "content-images" usando la service_role key, e ritorna l'URL pubblico
 * risultante da salvare nel campo image_url del form (Sezione 16.3).
 *
 * L'upload passa da qui invece che da una scrittura diretta del client
 * per restare coerenti col pattern usato in tutto il pannello admin: solo
 * un chiamante verificato is_admin può scrivere contenuto pubblico.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdminApi();
  if (!auth.authorized) return auth.response;

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Nessun file ricevuto." }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Il file deve essere un'immagine." }, { status: 400 });
  }

  const admin = createAdminClient();
  const extension = file.name.split(".").pop() ?? "jpg";
  const path = `${crypto.randomUUID()}.${extension}`;

  const { error: uploadError } = await admin.storage
    .from("content-images")
    .upload(path, file, { contentType: file.type });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const {
    data: { publicUrl },
  } = admin.storage.from("content-images").getPublicUrl(path);

  return NextResponse.json({ url: publicUrl });
}
