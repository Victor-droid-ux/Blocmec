import { NextResponse } from "next/server";
import { subDays } from "date-fns";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";
import { UserRole } from "@/prisma/generated/enums";

async function getAdminUser() {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return null;
  }

  let user = await prisma.user.findUnique({
    where: { supabase_id: data.user.id },
  });

  if (!user && data.user.email) {
    user = await prisma.user.findUnique({
      where: { email: data.user.email },
    });
  }

  if (!user || user.role !== UserRole.admin) {
    return null;
  }

  return user;
}

export async function GET() {
  try {
    const adminUser = await getAdminUser();
    if (!adminUser) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    const now = new Date();
    const last7Days = subDays(now, 7);
    const previous7Days = subDays(now, 14);

    const [
      topProductTypes,
      activeQrCodes,
      expiredQrCodes,
      failedVerifications,
      recentVerifications,
      previousVerifications,
    ] = await Promise.all([
      prisma.qrCode.groupBy({
        by: ["product_type"],
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 1,
      }),
      prisma.qrCode.count({ where: { status: "active" } }),
      prisma.qrCode.count({ where: { status: "expired" } }),
      prisma.verification.count({
        where: {
          status: {
            in: ["failed", "counterfeit", "expired"],
          },
        },
      }),
      prisma.verification.count({ where: { created_at: { gte: last7Days } } }),
      prisma.verification.count({
        where: {
          created_at: {
            gte: previous7Days,
            lt: last7Days,
          },
        },
      }),
    ]);

    const topProductType = topProductTypes[0];
    const growthRate =
      previousVerifications > 0
        ? Number(
            (
              ((recentVerifications - previousVerifications) /
                previousVerifications) *
              100
            ).toFixed(1),
          )
        : recentVerifications > 0
          ? 100
          : 0;

    const insights = [
      topProductType
        ? {
            id: "top-product-type",
            severity: "positive",
            title: "Most issued product type",
            description: `${topProductType.product_type} leads issuance with ${topProductType._count.id.toLocaleString()} QR codes generated.`,
          }
        : {
            id: "no-products",
            severity: "neutral",
            title: "No product issuance data yet",
            description: "Generate QR codes to unlock product-type insights.",
          },
      {
        id: "verification-trend",
        severity: growthRate >= 0 ? "positive" : "warning",
        title: "7-day verification trend",
        description:
          growthRate >= 0
            ? `Verification activity is up ${growthRate}% versus the previous 7-day window.`
            : `Verification activity is down ${Math.abs(growthRate)}% versus the previous 7-day window.`,
      },
      expiredQrCodes > 0
        ? {
            id: "expired-codes",
            severity: "warning",
            title: "Expired QR inventory needs review",
            description: `${expiredQrCodes.toLocaleString()} QR codes are expired while ${activeQrCodes.toLocaleString()} remain active.`,
          }
        : {
            id: "active-inventory",
            severity: "positive",
            title: "QR inventory is healthy",
            description: `No expired QR codes detected across ${activeQrCodes.toLocaleString()} active codes.`,
          },
      failedVerifications > 0
        ? {
            id: "failed-verifications",
            severity: "warning",
            title: "Verification failures detected",
            description: `${failedVerifications.toLocaleString()} failed or suspicious verification events have been recorded.`,
          }
        : {
            id: "clean-verifications",
            severity: "positive",
            title: "Verification traffic is clean",
            description:
              "No failed, counterfeit, or expired verification attempts were recorded.",
          },
    ];

    return NextResponse.json({ insights });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
