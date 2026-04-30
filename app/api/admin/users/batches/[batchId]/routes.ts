import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { batchId: string } },
) {
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

    // Verify batch belongs to this user
    const batch = await prisma.batch.findFirst({
      where: { id: params.batchId, user_id: user.id },
    });
    if (!batch) {
      return NextResponse.json({ error: "Batch not found" }, { status: 404 });
    }

    const qrCodes = await prisma.qrCode.findMany({
      where: { batch_id: params.batchId },
      orderBy: { created_at: "asc" },
      select: {
        id: true,
        token_id: true,
        product_name: true,
        qr_data: true,
        qr_image_url: true,
        status: true,
        scan_count: true,
        scan_limit: true,
        expires_at: true,
        created_at: true,
      },
    });

    const formatted = qrCodes.map((qr) => ({
      id: qr.id,
      tokenId: qr.token_id,
      productName: qr.product_name ?? batch.name,
      qrData: qr.qr_data,
      qrImageUrl: qr.qr_image_url ?? "",
      status: qr.status,
      scanCount: qr.scan_count,
      scanLimit: qr.scan_limit,
      expiresAt: qr.expires_at?.toISOString() ?? null,
      createdAt: qr.created_at.toISOString(),
    }));

    return NextResponse.json({ qrCodes: formatted });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
