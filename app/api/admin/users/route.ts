import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { UserRole, UserStatus } from "@/prisma/generated/enums";
import { z } from "zod";

// Auth helper — verify caller is admin
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

// Shape the DB user into what the frontend expects
function formatUser(user: any) {
  return {
    id: user.id,
    username: user.username ?? user.name ?? user.email.split("@")[0],
    email: user.email,
    role: user.role,
    status: user.status,
    apiCredits: user.api_credits,
    subscriptionPlan: user.subscription_plan,
    lastLogin: user.updated_at?.toISOString() ?? "Never",
    createdAt: user.created_at.toISOString(),
  };
}

const createUserSchema = z.object({
  username: z.string().min(1),
  email: z.string().email(),
  role: z.nativeEnum(UserRole),
  status: z.nativeEnum(UserStatus).default(UserStatus.active),
  apiCredits: z.number().int().min(0).default(0),
  subscriptionPlan: z.string().default("free"),
});

const updateUserSchema = createUserSchema.partial();

// GET /api/admin/users
export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    orderBy: { created_at: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      username: true,
      role: true,
      status: true,
      api_credits: true,
      subscription_plan: true,
      created_at: true,
      updated_at: true,
    },
  });

  return NextResponse.json(users.map(formatUser));
}

// POST /api/admin/users
export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { username, email, role, status, apiCredits, subscriptionPlan } =
    parsed.data;

  // Check if email already exists
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "Email already in use" },
      { status: 409 },
    );
  }

  const user = await prisma.user.create({
    data: {
      email,
      username,
      name: username,
      role,
      status,
      api_credits: apiCredits,
      subscription_plan: subscriptionPlan,
      email_verified: false,
      updated_at: new Date(),
    },
  });

  // Log the action
  await prisma.auditLog.create({
    data: {
      user_id: admin.id,
      action: "create_user",
      resource_type: "User",
      resource_id: user.id,
      metadata: { email, role },
    },
  });

  return NextResponse.json(formatUser(user), { status: 201 });
}

// PUT /api/admin/users?id=xxx
export async function PUT(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "User ID required" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = updateUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { username, email, role, status, apiCredits, subscriptionPlan } =
    parsed.data;

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const updated = await prisma.user.update({
    where: { id },
    data: {
      ...(username && { username, name: username }),
      ...(email && { email }),
      ...(role && { role }),
      ...(status && { status }),
      ...(typeof apiCredits === "number" && { api_credits: apiCredits }),
      ...(subscriptionPlan && { subscription_plan: subscriptionPlan }),
      updated_at: new Date(),
    },
  });

  // Log the action
  await prisma.auditLog.create({
    data: {
      user_id: admin.id,
      action: "update_user",
      resource_type: "User",
      resource_id: id,
      metadata: parsed.data,
    },
  });

  return NextResponse.json(formatUser(updated));
}

// DELETE /api/admin/users?id=xxx
export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "User ID required" }, { status: 400 });
  }

  // Prevent admin from deleting themselves
  if (id === admin.id) {
    return NextResponse.json(
      { error: "Cannot delete your own account" },
      { status: 400 },
    );
  }

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  await prisma.user.delete({ where: { id } });

  // Log the action
  await prisma.auditLog.create({
    data: {
      user_id: admin.id,
      action: "delete_user",
      resource_type: "User",
      resource_id: id,
      metadata: { email: existing.email },
    },
  });

  return NextResponse.json({ message: "User deleted successfully" });
}
