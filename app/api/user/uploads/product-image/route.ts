import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/server";

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

/**
 * Uploads a product photo to local disk storage and returns its public URL, so
 * the image lives in a file instead of being copied as base64 into
 * every QR row of a batch.
 */
export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

  const storedName = `${randomUUID()}.${extension}`;
  const targetDir = path.join(
    process.cwd(),
    "public",
    "uploads",
    "products",
    user.id,
  );
  const relativePath = path.posix.join(
    "/uploads/products",
    user.id,
    storedName,
  );

  await mkdir(targetDir, { recursive: true });
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(targetDir, storedName), bytes);

  return NextResponse.json({ url: relativePath });
}
