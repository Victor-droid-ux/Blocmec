import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  createSupabaseAdminClient,
  hasSupabaseAdminEnv,
} from "@/lib/supabase/admin";
import { UserRole } from "@/prisma/generated/enums";

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

async function requireAdmin() {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;

  const user = await prisma.user.findUnique({
    where: { supabase_id: data.user.id },
  });
  if (!user || user.role !== UserRole.admin) return null;
  return user;
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasSupabaseAdminEnv()) {
    return NextResponse.json(
      { error: "Storage is not configured on the server." },
      { status: 503 },
    );
  }

  const formData = await req.formData().catch(() => null);
  const file = formData?.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No image uploaded" }, { status: 400 });
  }

  const extension = ALLOWED_TYPES[file.type];
  if (!extension) {
    return NextResponse.json(
      { error: "Use a PNG, JPG or WebP image." },
      { status: 400 },
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "Image must be 2MB or smaller." },
      { status: 400 },
    );
  }

  const bucket = process.env.SUPABASE_BRAND_BUCKET ?? "brand-logos";
  const supabase = createSupabaseAdminClient();

  const { error: bucketError } = await supabase.storage.getBucket(bucket);
  if (bucketError) {
    const { error: createError } = await supabase.storage.createBucket(
      bucket,
      {
        public: true,
        fileSizeLimit: MAX_BYTES,
        allowedMimeTypes: Object.keys(ALLOWED_TYPES),
      },
    );
    if (createError) {
      console.error("Could not prepare logo bucket:", createError);
      return NextResponse.json(
        { error: "Could not prepare image storage." },
        { status: 500 },
      );
    }
  }

  const path = `${admin.id}/${crypto.randomUUID()}.${extension}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, bytes, { contentType: file.type, upsert: false });

  if (uploadError) {
    console.error("Logo upload failed:", uploadError);
    return NextResponse.json(
      { error: "Could not upload the image." },
      { status: 500 },
    );
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
}
