import { NextRequest, NextResponse } from "next/server";
import {
  createOptionalServerSupabaseClient,
  hasSupabaseEnv,
} from "@/lib/supabase/server";
import prisma from "@/lib/prisma";
import { UserRole } from "@/prisma/generated/enums";

export async function GET(req: NextRequest) {
  try {
    if (!hasSupabaseEnv()) {
      return NextResponse.json({
        totalQrCodes: 0,
        expiredQrCodes: 0,
        apiCredits: 0,
        totalBatches: 0,
      });
    }

    const supabase = await createOptionalServerSupabaseClient();
    if (!supabase) {
      return NextResponse.json({
        totalQrCodes: 0,
        expiredQrCodes: 0,
        apiCredits: 0,
        totalBatches: 0,
      });
    }

    const {
      data: { user: supUser },
      error: supError,
    } = await supabase.auth.getUser();

    if (supError || !supUser?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let user = await prisma.user.findUnique({
      where: { supabase_id: supUser.id },
    });
    if (!user && supUser.email) {
      user = await prisma.user.findUnique({
        where: { email: supUser.email },
      });
    }

    if (!user) {
      if (!supUser.email) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      user = await prisma.user.create({
        data: {
          email: supUser.email,
          supabase_id: supUser.id,
          name: supUser.user_metadata?.full_name ?? null,
          role: UserRole.user,
          email_verified: true,
        },
      });
    }

    const [qrCodeCount, batchCount, expiredQrCodes, totalCredits] =
      await Promise.all([
        prisma.qrCode.count({ where: { user_id: user.id } }),
        prisma.batch.count({ where: { user_id: user.id } }),
        prisma.qrCode.count({
          where: {
            user_id: user.id,
            status: "expired",
          },
        }),
        prisma.user.findUnique({
          where: { id: user.id },
          select: { api_credits: true },
        }),
      ]);

    return NextResponse.json({
      totalQrCodes: qrCodeCount,
      expiredQrCodes,
      apiCredits: totalCredits?.api_credits ?? 0,
      totalBatches: batchCount,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
