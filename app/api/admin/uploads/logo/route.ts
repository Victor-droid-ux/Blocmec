import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/server";
import { UserRole } from "@/prisma/generated/enums";

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

async function requireAdmin() {
  const user = await getAuthenticatedUser();
  if (!user || user.role !== UserRole.admin) return null;
  return user;
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
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
  const targetDir = path.join(process.cwd(), "public", "uploads", "branding");
  const relativePath = path.posix.join("/uploads/branding", storedName);

  await mkdir(targetDir, { recursive: true });
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(targetDir, storedName), bytes);

  return NextResponse.json({ url: relativePath });
}
