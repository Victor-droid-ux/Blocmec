import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { UserRole } from "@/prisma/generated/enums";

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

// Map AuditLog action strings to the log types the frontend expects
function inferType(
  action: string,
): "info" | "warning" | "error" | "user_action" | "system" {
  if (action.includes("fail") || action.includes("error")) return "error";
  if (action.includes("unauthorized") || action.includes("attempt"))
    return "warning";
  if (
    action.startsWith("create_") ||
    action.startsWith("update_") ||
    action.startsWith("delete_")
  )
    return "user_action";
  if (action.startsWith("system_")) return "system";
  return "info";
}

function formatLog(log: any) {
  return {
    id: log.id,
    timestamp: log.created_at.toISOString(),
    userId: log.user_id ?? undefined,
    username: log.user
      ? (log.user.username ?? log.user.name ?? log.user.email.split("@")[0])
      : undefined,
    action: log.action,
    type: inferType(log.action),
    message: log.metadata?.message ?? undefined,
    ipAddress: log.ip_address ?? undefined,
    userAgent: log.user_agent ?? undefined,
  };
}

// GET /api/admin/logs
export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type"); // optional filter
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "100"), 500);
  const offset = parseInt(searchParams.get("offset") ?? "0");

  const logs = await prisma.auditLog.findMany({
    orderBy: { created_at: "desc" },
    take: limit,
    skip: offset,
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          username: true,
        },
      },
    },
  });

  const formatted = logs.map(formatLog);

  // Filter by type client-side after mapping (keeps query simple)
  const filtered =
    type && type !== "all"
      ? formatted.filter((log) => log.type === type)
      : formatted;

  return NextResponse.json(filtered);
}
