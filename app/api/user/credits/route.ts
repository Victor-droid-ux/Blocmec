import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";
import { z } from "zod";

export async function POST(req: NextRequest) {
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

    const body = await req.json().catch(() => ({}));
    const parsed = z
      .object({ 
        credits: z.number().int().min(1),
        transaction_reference: z.string().min(1),
      })
      .safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request - credits and transaction_reference required" },
        { status: 400 },
      );
    }

    // Verify transaction exists and is completed
    const transaction = await prisma.transaction.findUnique({
      where: { transaction_reference: parsed.data.transaction_reference },
    });

    if (!transaction || transaction.user_id !== user.id) {
      return NextResponse.json(
        { error: "Transaction not found or unauthorized" },
        { status: 403 },
      );
    }

    if (transaction.status !== "completed") {
      return NextResponse.json(
        { error: "Payment transaction is not in completed status" },
        { status: 400 },
      );
    }

    if (transaction.credits_added > 0) {
      return NextResponse.json(
        { error: "Credits already added for this transaction" },
        { status: 400 },
      );
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        api_credits: { increment: parsed.data.credits },
        updated_at: new Date(),
      },
    });

    // Update transaction to mark credits as applied
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        credits_added: parsed.data.credits,
        updated_at: new Date(),
      },
    });

    await prisma.auditLog.create({
      data: {
        user_id: user.id,
        action: "purchase_credits",
        resource_type: "User",
        resource_id: user.id,
        metadata: { 
          credits: parsed.data.credits,
          transaction_id: transaction.id,
        },
      },
    });

    return NextResponse.json({
      message: "Credits added successfully",
      api_credits: updated.api_credits,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
