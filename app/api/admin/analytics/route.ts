import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";
import { UserRole } from "@/prisma/generated/enums";

// Safe read-only analytics queries mapped by keyword patterns
async function runAnalyticsQuery(query: string) {
  const q = query.toLowerCase();
  const start = Date.now();

  let data: any[] = [];

  if (q.includes("product_type") || q.includes("producttype")) {
    const results = await prisma.qrCode.groupBy({
      by: ["product_type"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    });
    data = results.map((r) => ({
      product_type: r.product_type,
      count: r._count.id,
    }));
  } else if (q.includes("status")) {
    const results = await prisma.qrCode.groupBy({
      by: ["status"],
      _count: { id: true },
    });
    data = results.map((r) => ({ status: r.status, count: r._count.id }));
  } else if (q.includes("user") || q.includes("role")) {
    const results = await prisma.user.groupBy({
      by: ["role"],
      _count: { id: true },
    });
    data = results.map((r) => ({ role: r.role, count: r._count.id }));
  } else if (q.includes("verification") || q.includes("scan")) {
    const results = await prisma.verification.groupBy({
      by: ["status"],
      _count: { id: true },
    });
    data = results.map((r) => ({ status: r.status, count: r._count.id }));
  } else if (q.includes("batch")) {
    const results = await prisma.batch.groupBy({
      by: ["status"],
      _count: { id: true },
      _sum: { total_count: true },
    });
    data = results.map((r) => ({
      status: r.status,
      batches: r._count.id,
      total_qr_codes: r._sum.total_count ?? 0,
    }));
  } else {
    // Default: return platform overview
    const [users, qrCodes, batches, verifications] = await Promise.all([
      prisma.user.count(),
      prisma.qrCode.count(),
      prisma.batch.count(),
      prisma.verification.count(),
    ]);
    data = [
      { metric: "Total Users", value: users },
      { metric: "QR Codes Generated", value: qrCodes },
      { metric: "Batches Created", value: batches },
      { metric: "Verifications", value: verifications },
    ];
  }

  return { data, executionTime: Date.now() - start };
}

export async function POST(req: NextRequest) {
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

    const body = await req.json().catch(() => ({}));
    const { query } = body;
    if (!query) {
      return NextResponse.json({ error: "Query required" }, { status: 400 });
    }

    const result = await runAnalyticsQuery(query);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
