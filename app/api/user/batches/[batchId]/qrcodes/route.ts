import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";

async function getAuthenticatedUser() {
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

  return user;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ batchId: string }> },
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { batchId } = await params;

    const batch = await prisma.batch.findFirst({
      where: { id: batchId, user_id: user.id },
    });

    if (!batch) {
      return NextResponse.json({ error: "Batch not found" }, { status: 404 });
    }

    const qrCodes = await prisma.qrCode.findMany({
      where: { batch_id: batchId, user_id: user.id },
      orderBy: { created_at: "asc" },
      select: {
        id: true,
        token_id: true,
        product_name: true,
        qr_data: true,
        qr_image_url: true,
      },
    });

    return NextResponse.json({
      qrCodes: qrCodes.map((qrCode) => ({
        id: qrCode.id,
        tokenId: qrCode.token_id,
        productName: qrCode.product_name ?? batch.name,
        qrData: qrCode.qr_data,
        qrImageUrl: qrCode.qr_image_url ?? "",
      })),
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
