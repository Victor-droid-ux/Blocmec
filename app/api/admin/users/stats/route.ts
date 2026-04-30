import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";

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
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
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
