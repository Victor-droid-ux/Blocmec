import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
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

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 100);
    const skip = (page - 1) * limit;

    const [batches, total] = await Promise.all([
      prisma.batch.findMany({
        where: { user_id: user.id },
        orderBy: { created_at: "desc" },
        take: limit,
        skip,
        include: {
          _count: { select: { qr_codes: true } },
        },
      }),
      prisma.batch.count({ where: { user_id: user.id } }),
    ]);

    const formatted = batches.map((batch) => ({
      id: batch.id,
      name: batch.name,
      productType: batch.product_type,
      batchNumber: batch.batch_number,
      status: batch.status,
      totalCount: batch.total_count,
      generatedCount: batch.generated_count,
      qrCodeCount: batch._count.qr_codes,
      createdAt: batch.created_at.toISOString(),
      updatedAt: batch.updated_at.toISOString(),
      metadata: batch.metadata,
    }));

    return NextResponse.json({ batches: formatted, total, page, limit });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
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

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Batch ID required" }, { status: 400 });
    }

    const batch = await prisma.batch.findFirst({
      where: { id, user_id: user.id },
    });
    if (!batch) {
      return NextResponse.json({ error: "Batch not found" }, { status: 404 });
    }

    await prisma.batch.delete({ where: { id } });

    return NextResponse.json({ message: "Batch deleted successfully" });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
