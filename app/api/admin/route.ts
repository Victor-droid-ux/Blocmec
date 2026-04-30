import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";
import { UserRole } from "@/prisma/generated/enums";

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { supabase_id: data.user.id },
    });

    if (!user || user.role !== UserRole.admin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    // Run all counts in parallel
    const [
      totalUsers,
      totalQrCodes,
      totalBatches,
      totalTransactions,
      recentLogs,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.qrCode.count(),
      prisma.batch.count(),
      prisma.transaction.count(),
      prisma.auditLog.findMany({
        orderBy: { created_at: "desc" },
        take: 5,
        include: {
          user: {
            select: { email: true, username: true, name: true },
          },
        },
      }),
    ]);

    const formattedLogs = recentLogs.map((log) => ({
      id: log.id,
      action: log.action,
      user: log.user
        ? (log.user.username ?? log.user.name ?? log.user.email.split("@")[0])
        : "System",
      time: log.created_at.toISOString(),
      status:
        log.action.includes("fail") || log.action.includes("error")
          ? "warning"
          : "success",
    }));

    return NextResponse.json({
      stats: {
        totalUsers,
        totalQrCodes,
        totalBatches,
        totalTransactions,
      },
      recentActivity: formattedLogs,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
