import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/server";
import prisma from "@/lib/prisma";
import { UserRole } from "@/prisma/generated/enums";

async function getAdminUser() {
  const user = await getAuthenticatedUser();
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

    const [totalVerifications, successfulVerifications, activeQrCodes] =
      await Promise.all([
        prisma.verification.count(),
        prisma.verification.count({ where: { status: "verified" } }),
        prisma.qrCode.count({ where: { status: "active" } }),
      ]);

    const successRate =
      totalVerifications > 0
        ? Number(
            ((successfulVerifications / totalVerifications) * 100).toFixed(1),
          )
        : 0;

    return NextResponse.json({
      totalVerifications,
      successRate,
      activeQrCodes,
      avgResponseTimeMs: null,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
