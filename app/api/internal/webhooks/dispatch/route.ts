//app/api/internal/webhooks/dispatch/route.ts

import { NextRequest, NextResponse } from "next/server";
import { dispatchPendingWebhookJobs } from "@/lib/webhooks";

function isAuthorized(req: NextRequest) {
  const expected =
    process.env.WEBHOOK_DISPATCH_SECRET ?? process.env.CRON_SECRET;
  if (!expected) {
    return false;
  }

  const suppliedHeader = req.headers.get("x-dispatch-secret");
  if (suppliedHeader === expected) {
    return true;
  }

  const authHeader = req.headers.get("authorization") ?? "";
  if (authHeader.toLowerCase().startsWith("bearer ")) {
    const token = authHeader.slice(7).trim();
    if (token === expected) {
      return true;
    }
  }

  return false;
}

export async function POST(req: NextRequest) {
  try {
    if (!isAuthorized(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const limit =
      typeof body.limit === "number" && Number.isFinite(body.limit)
        ? Math.max(1, Math.min(body.limit, 100))
        : 20;

    const result = await dispatchPendingWebhookJobs(limit);
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to dispatch webhook jobs" },
      { status: 500 },
    );
  }
}
