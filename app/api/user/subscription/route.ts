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

// POST — activate subscription after successful Paystack payment
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
    const { plan, reference, currency } = body as {
      plan: string;
      reference: string;
      currency: string;
    };

    if (!VALID_PLANS.includes(plan as PlanSlug)) {
      return NextResponse.json(
        { error: `Invalid plan. Must be one of: ${VALID_PLANS.join(", ")}` },
        { status: 400 },
      );
    }

    if (!reference) {
      return NextResponse.json(
        { error: "Missing payment reference" },
        { status: 400 },
      );
    }

    const planSlug = plan as PlanSlug;
    const pricing = PLAN_PRICING[planSlug];
    const amount =
      (currency ?? "NGN").toUpperCase() === "NGN" ? pricing.ngn : pricing.usd;

    // Verify with Paystack
    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecretKey) {
      return NextResponse.json(
        { error: "Payment gateway not configured" },
        { status: 500 },
      );
    }

    const expectedAmountMinor = Math.round(amount * 100);

    const verifyRes = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
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
      status: boolean;
      data?: {
        status: string;
        reference: string;
        amount: number;
        currency: string;
        id: number;
      };
    };

    const txData = verifyData.data;
    if (
      verifyData.status !== true ||
      txData?.status !== "success" ||
      txData?.reference !== reference ||
      (txData?.currency ?? "").toUpperCase() !==
        (currency ?? "NGN").toUpperCase() ||
      (txData?.amount ?? 0) < expectedAmountMinor
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
        payment_method: "paystack",
        payment_provider_id: String(txData.id),
        transaction_reference: txData.reference,
        credits_added: pricing.credits,
        metadata: { plan: planSlug, reference },
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
