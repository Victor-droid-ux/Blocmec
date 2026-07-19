import { NextResponse } from "next/server";
import {
  createOptionalServerSupabaseClient,
  hasSupabaseEnv,
} from "@/lib/supabase/server";
import prisma from "@/lib/prisma";
import { UserRole } from "@/prisma/generated/enums";

export async function GET() {
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

    let supUser: {
      id?: string;
      email?: string | null;
      user_metadata?: any;
    } | null = null;
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      supUser = user;
    } catch {
      // Treat transient auth client failures as unauthorized rather than 500s.
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!supUser?.id) {
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
      const normalizedEmail = supUser.email?.trim().toLowerCase();
      if (!normalizedEmail) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      // Upsert avoids race-condition 500s when multiple first-load requests
      // try to create the same user immediately after login.
      user = await prisma.user.upsert({
        where: { email: normalizedEmail },
        update: {
          supabase_id: supUser.id,
          email_verified: true,
          updated_at: new Date(),
        },
        create: {
          email: normalizedEmail,
          supabase_id: supUser.id,
          name: supUser.user_metadata?.full_name ?? null,
          role: UserRole.user,
          email_verified: true,
        },
      });
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
