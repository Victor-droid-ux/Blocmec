import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [qrCodeCountResult, batchCountResult, expiredQrCodesResult] =
      await Promise.allSettled([
        prisma.qrCode.count({ where: { user_id: user.id } }),
        prisma.batch.count({ where: { user_id: user.id } }),
        prisma.qrCode.count({
          where: {
            user_id: user.id,
            expires_at: {
              lte: new Date(),
            },
          },
        }),
      ]);

    const qrCodeCount =
      qrCodeCountResult.status === "fulfilled" ? qrCodeCountResult.value : 0;
    const batchCount =
      batchCountResult.status === "fulfilled" ? batchCountResult.value : 0;
    const expiredQrCodes =
      expiredQrCodesResult.status === "fulfilled"
        ? expiredQrCodesResult.value
        : 0;

    return NextResponse.json({
      totalQrCodes: qrCodeCount,
      expiredQrCodes,
      apiCredits: user.api_credits ?? 0,
      totalBatches: batchCount,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
