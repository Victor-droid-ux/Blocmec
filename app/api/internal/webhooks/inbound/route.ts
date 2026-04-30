//app/api/internal/webhooks/inbound/route.ts

import { NextRequest, NextResponse } from "next/server";
import { verifySignedWebhookRequest } from "@/lib/webhook-verifier";

function getInboundSecret() {
  return process.env.WEBHOOK_INBOUND_SECRET ?? "";
}

export async function POST(req: NextRequest) {
  try {
    const secret = getInboundSecret();
    if (!secret) {
      return NextResponse.json(
        { error: "Inbound webhook secret is not configured" },
        { status: 503 },
      );
    }

    const rawBody = await req.text();
    const verification = await verifySignedWebhookRequest({
      secret,
      rawBody,
      headers: req.headers,
      replayNamespace: "webhook:inbound",
      maxSkewSeconds: 300,
    });

    if (!verification.ok) {
      return NextResponse.json(
        { error: verification.error },
        { status: verification.status },
      );
    }

    const payload = JSON.parse(rawBody || "{}");

    return NextResponse.json({
      ok: true,
      deliveryId: verification.deliveryId,
      timestamp: verification.timestamp,
      event: req.headers.get("x-blockmec-event") ?? payload?.event ?? null,
      received: true,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to process inbound webhook" },
      { status: 500 },
    );
  }
}
