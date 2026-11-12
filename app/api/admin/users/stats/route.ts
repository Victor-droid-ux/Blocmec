import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [totalQrCodes, expiredQrCodes, totalBatches] = await Promise.all([
      prisma.qrCode.count({
        where: { user_id: user.id },
      }),
      prisma.qrCode.count({
        where: {
          user_id: user.id,
          status: "expired",
        },
      }),
      prisma.batch.count({
        where: { user_id: user.id },
      }),
    ]);

    return NextResponse.json({
      totalQrCodes,
      expiredQrCodes,
      apiCredits: user.api_credits,
      totalBatches,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
