import { randomUUID } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rateLimiter";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

async function resolveCurrentUser() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user: supUser },
    error: supError,
  } = await supabase.auth.getUser();

  if (supError || !supUser?.id) {
    return { error: "Unauthorized", status: 401 as const, user: null };
  }

  let user = await prisma.user.findUnique({
    where: { supabase_id: supUser.id },
    select: { id: true, email: true },
  });

  if (!user && supUser.email) {
    user = await prisma.user.findUnique({
      where: { email: supUser.email },
      select: { id: true, email: true },
    });
  }

  if (!user) {
    return { error: "User not found", status: 404 as const, user: null };
  }

  return { error: null, status: 200 as const, user };
}

export async function GET() {
  try {
    const auth = await resolveCurrentUser();
    if (auth.error || !auth.user) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const files = await prisma.userFile.findMany({
      where: { user_id: auth.user.id },
      orderBy: { created_at: "desc" },
      select: {
        id: true,
        original_name: true,
        mime_type: true,
        size_bytes: true,
        storage_path: true,
        created_at: true,
      },
    });

    return NextResponse.json({
      files: files.map((file) => ({
        id: file.id,
        name: file.original_name,
        mimeType: file.mime_type,
        sizeBytes: file.size_bytes,
        url: file.storage_path,
        createdAt: file.created_at.toISOString(),
      })),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Failed to list files" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const limited = await rateLimit(req, {
      maxRequests: 10,
      windowMs: 60_000,
    });
    if (limited) return limited;

    const auth = await resolveCurrentUser();
    if (auth.error || !auth.user) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size <= 0) {
      return NextResponse.json({ error: "File is empty" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "File exceeds 10MB limit" },
        { status: 400 },
      );
    }

    const safeName = sanitizeFilename(file.name || "upload.bin");
    const storedName = `${randomUUID()}-${safeName}`;
    const relativeDir = path.posix.join("/uploads/profile", auth.user.id);
    const relativePath = path.posix.join(relativeDir, storedName);

    const targetDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      "profile",
      auth.user.id,
    );
    const targetPath = path.join(targetDir, storedName);

    await mkdir(targetDir, { recursive: true });
    const bytes = Buffer.from(await file.arrayBuffer());
    await writeFile(targetPath, bytes);

    const created = await prisma.userFile.create({
      data: {
        user_id: auth.user.id,
        original_name: safeName,
        stored_name: storedName,
        mime_type: file.type || "application/octet-stream",
        size_bytes: file.size,
        storage_path: relativePath,
      },
      select: {
        id: true,
        original_name: true,
        mime_type: true,
        size_bytes: true,
        storage_path: true,
        created_at: true,
      },
    });

    return NextResponse.json(
      {
        file: {
          id: created.id,
          name: created.original_name,
          mimeType: created.mime_type,
          sizeBytes: created.size_bytes,
          url: created.storage_path,
          createdAt: created.created_at.toISOString(),
        },
      },
      { status: 201 },
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Failed to upload file" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await resolveCurrentUser();
    if (auth.error || !auth.user) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(req.url);
    const fileId = searchParams.get("fileId");

    if (!fileId) {
      return NextResponse.json({ error: "Missing fileId" }, { status: 400 });
    }

    const existing = await prisma.userFile.findFirst({
      where: { id: fileId, user_id: auth.user.id },
      select: { id: true, storage_path: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const absolutePath = path.join(
      process.cwd(),
      "public",
      existing.storage_path,
    );

    await prisma.userFile.delete({
      where: { id: existing.id },
    });

    await unlink(absolutePath).catch(() => undefined);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Failed to delete file" },
      { status: 500 },
    );
  }
}
