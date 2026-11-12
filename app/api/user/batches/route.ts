import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(parseInt(searchParams.get("page") ?? "1", 10), 1);
    const limit = Math.min(
      Math.max(parseInt(searchParams.get("limit") ?? "20", 10), 1),
      100,
    );
    const skip = (page - 1) * limit;

    const [batches, total] = await Promise.all([
      prisma.batch.findMany({
        where: { user_id: user.id },
        orderBy: { created_at: "desc" },
        skip,
        take: limit,
        include: {
          _count: { select: { qr_codes: true } },
        },
      }),
      prisma.batch.count({ where: { user_id: user.id } }),
    ]);

    return NextResponse.json({
      batches: batches.map((batch) => ({
        id: batch.id,
        name: batch.name,
        productType: batch.product_type,
        batchNumber: batch.batch_number,
        status: batch.status,
        totalCount: batch.total_count,
        generatedCount: batch.generated_count,
        qrCodeCount: batch._count.qr_codes,
        createdAt: batch.created_at.toISOString(),
        metadata: batch.metadata,
      })),
      total,
      page,
      limit,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    await prisma.batch.delete({ where: { id: batch.id } });

    return NextResponse.json({ message: "Batch deleted successfully" });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
