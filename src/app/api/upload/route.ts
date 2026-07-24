import { NextRequest, NextResponse } from "next/server";
import { isAdminLoggedIn } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const MEDIA_BUCKET = "media";
const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export async function POST(req: NextRequest) {
  if (!(await isAdminLoggedIn())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const ext = ALLOWED_TYPES[file.type];
  if (!ext) {
    return NextResponse.json(
      { error: "Unsupported file type. Use JPG, PNG, WEBP, or GIF." },
      { status: 400 }
    );
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });
  }

  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const supabase = getSupabaseAdmin();

  const { error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(filename, file, { contentType: file.type, cacheControl: "31536000" });

  if (error) {
    return NextResponse.json({ error: `Upload failed: ${error.message}` }, { status: 500 });
  }

  const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(filename);

  return NextResponse.json({ url: data.publicUrl });
}
