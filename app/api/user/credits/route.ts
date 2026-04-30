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
      .object({ credits: z.number().int().min(1) })
      .safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid credits amount" },
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

    // Log the transaction
    await prisma.transaction.create({
      data: {
        user_id: user.id,
        type: "credit_purchase",
        amount: parsed.data.credits * 0.01, // $0.01 per credit
        currency: "USD",
        status: "completed",
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
        metadata: { credits: parsed.data.credits },
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
