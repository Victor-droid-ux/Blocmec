import { NextResponse } from "next/server";

export const dynamic = "force-static";
export const revalidate = 3600; // Cache for 1 hour

export async function GET() {
  try {
    const pricingData = {
      methods: {
        blc: {
          name: "BLC Tokens",
          currency: "BLC",
          pricePerCredit: 0.05,
          description: "Pay with BLOCKMEC tokens",
        },
        card: {
          name: "Credit/Debit Card",
          currency: "USD",
          pricePerCredit: 0.01,
          description: "Pay with credit or debit card",
        },
        flutterwave: {
          name: "Flutterwave",
          currency: "USD",
          pricePerCredit: 0.01,
          description: "Pay with Flutterwave",
        },
      },
      minimumCredits: 100,
      bulkDiscounts: [
        {
          minCredits: 1000,
          discountPercent: 5,
          note: "Save 5% on 1,000+ credits",
        },
        {
          minCredits: 5000,
          discountPercent: 10,
          note: "Save 10% on 5,000+ credits",
        },
        {
          minCredits: 10000,
          discountPercent: 15,
          note: "Save 15% on 10,000+ credits",
        },
      ],
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json(pricingData);
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch pricing" },
      { status: 500 },
    );
  }
}
