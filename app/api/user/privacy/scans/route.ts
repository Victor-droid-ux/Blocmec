// app/api/user/privacy/scans/route.ts
// Allows users to view and manage their verification scan history

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { supabase_id: authData.user.id },
      select: { id: true },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const offset = Math.max(parseInt(searchParams.get("offset") || "0"), 0);
    const days = parseInt(searchParams.get("days") || "90");

    const since = new Date();
    since.setDate(since.getDate() - days);

    // Get user's verification scans (without sensitive IP data if redacted)
    const scans = await prisma.verification.findMany({
      where: {
        qr_code: { user_id: dbUser.id },
        created_at: { gte: since },
      },
      select: {
        id: true,
        token_id: true,
        qr_code: {
          select: {
            product_name: true,
            product_type: true,
          },
        },
        ip_address: true, // Will show "[REDACTED]" if redacted
        device_type: true,
        location_country: true,
        location_city: true,
        status: true,
        created_at: true,
      },
      orderBy: { created_at: "desc" },
      skip: offset,
      take: limit,
    });

    const total = await prisma.verification.count({
      where: {
        qr_code: { user_id: dbUser.id },
        created_at: { gte: since },
      },
    });

    return NextResponse.json({
      scans,
      total,
      limit,
      offset,
      daysShown: days,
    });
  } catch (error) {
    console.error("[Privacy] Scan history error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve scan history" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { supabase_id: authData.user.id },
      select: { id: true },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const { tokenId, days } = body;

    let where: any = { qr_code: { user_id: dbUser.id } };

    if (tokenId) {
      // Delete specific scan
      where.token_id = tokenId;
    } else if (days) {
      // Delete scans older than N days
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      where.created_at = { lt: cutoff };
    }

    const deleted = await prisma.verification.deleteMany({ where });

    // Log the action
    await prisma.auditLog.create({
      data: {
        user_id: dbUser.id,
        action: "delete_user_scans",
        resource_type: "Verification",
        resource_id: tokenId || "batch",
        metadata: {
          count: deleted.count,
          scope: tokenId ? "single" : `older_than_${days}_days`,
        },
      },
    });

    return NextResponse.json({
      success: true,
      deletedCount: deleted.count,
      message: `Deleted ${deleted.count} scan record(s)`,
    });
  } catch (error) {
    console.error("[Privacy] Scan deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete scan records" },
      { status: 500 }
    );
  }
}
