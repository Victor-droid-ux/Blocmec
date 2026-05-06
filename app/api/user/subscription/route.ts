// app/api/user/subscription/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const VALID_PLANS = ["business", "conglomerate", "conglomerate-pro"] as const;
type PlanSlug = (typeof VALID_PLANS)[number];

// Monthly prices in NGN and USD
const PLAN_PRICING: Record<
  PlanSlug,
  { ngn: number; usd: number; credits: number }
> = {
  business: { ngn: 5000, usd: 5, credits: 5000 },
  conglomerate: { ngn: 40000, usd: 25, credits: 25000 },
  "conglomerate-pro": { ngn: 100000, usd: 60, credits: 75000 },
};

async function getAuthenticatedUser() {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;

  let user = await prisma.user.findUnique({
    where: { supabase_id: data.user.id },
  });

  if (!user && data.user.email) {
    user = await prisma.user.findUnique({ where: { email: data.user.email } });
  }

  return user;
}

// GET — return available plans and pricing
export async function GET() {
  return NextResponse.json({
    plans: VALID_PLANS.map((slug) => ({
      slug,
      ngn: PLAN_PRICING[slug].ngn,
      usd: PLAN_PRICING[slug].usd,
      credits: PLAN_PRICING[slug].credits,
    })),
  });
}

// POST — activate subscription after successful Flutterwave payment
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.status !== "active") {
      return NextResponse.json(
        { error: "Account is inactive or suspended" },
        { status: 403 },
      );
    }

    const body = await req.json().catch(() => ({}));
    const { plan, transaction_id, tx_ref, currency } = body as {
      plan: string;
      transaction_id: number;
      tx_ref: string;
      currency: string;
    };

    if (!VALID_PLANS.includes(plan as PlanSlug)) {
      return NextResponse.json(
        { error: `Invalid plan. Must be one of: ${VALID_PLANS.join(", ")}` },
        { status: 400 },
      );
    }

    if (!transaction_id || !tx_ref) {
      return NextResponse.json(
        { error: "Missing transaction_id or tx_ref" },
        { status: 400 },
      );
    }

    const planSlug = plan as PlanSlug;
    const pricing = PLAN_PRICING[planSlug];
    const amount =
      (currency ?? "NGN").toUpperCase() === "NGN" ? pricing.ngn : pricing.usd;

    // Verify with Flutterwave
    const flwSecretKey = process.env.FLUTTERWAVE_SECRET_KEY;
    if (!flwSecretKey) {
      return NextResponse.json(
        { error: "Payment gateway not configured" },
        { status: 500 },
      );
    }

    const verifyRes = await fetch(
      `https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`,
      {
        headers: {
          Authorization: `Bearer ${flwSecretKey}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!verifyRes.ok) {
      return NextResponse.json(
        { error: "Payment verification failed" },
        { status: 402 },
      );
    }

    const verifyData = (await verifyRes.json()) as {
      status: string;
      data?: {
        status: string;
        tx_ref: string;
        amount: number;
        currency: string;
        flw_ref: string;
      };
    };

    const txData = verifyData.data;
    if (
      verifyData.status !== "success" ||
      txData?.status !== "successful" ||
      txData?.tx_ref !== tx_ref ||
      txData?.amount < amount
    ) {
      return NextResponse.json(
        { error: "Payment could not be verified" },
        { status: 402 },
      );
    }

    // Update user's plan and add monthly credits
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        subscription_plan: planSlug,
        api_credits: { increment: pricing.credits },
      },
      select: { subscription_plan: true, api_credits: true },
    });

    // Record the transaction
    await prisma.transaction.create({
      data: {
        user_id: user.id,
        type: "subscription",
        amount: amount,
        currency: (currency ?? "NGN").toUpperCase(),
        status: "completed",
        payment_method: "flutterwave",
        payment_provider_id: String(transaction_id),
        transaction_reference: txData.flw_ref,
        credits_added: pricing.credits,
        metadata: { plan: planSlug, tx_ref },
      },
    });

    return NextResponse.json({
      success: true,
      subscription_plan: updated.subscription_plan,
      api_credits: updated.api_credits,
      credits_added: pricing.credits,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to activate subscription" },
      { status: 500 },
    );
  }
}
