// app/api/user/webhooks/status/route.ts
// Monitor webhook delivery status and pending events

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser();

    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: { id: true },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const webhookId = searchParams.get("webhookId");

    let where: any = {
      webhook: { user_id: dbUser.id },
    };

    if (webhookId) {
      where.webhook_id = webhookId;
    }

    // Get webhook status
    const webhooks = await prisma.webhookEndpoint.findMany({
      where: { user_id: dbUser.id },
      select: {
        id: true,
        name: true,
        endpoint_url: true,
        status: true,
        events: true,
        last_delivery_at: true,
        last_delivery_status: true,
        last_error: true,
      },
    });

    // Get delivery statistics
    const allJobs = await prisma.webhookDeliveryJob.findMany({
      where,
      select: {
        id: true,
        webhook_id: true,
        event_type: true,
        status: true,
        attempts: true,
        next_attempt_at: true,
        last_error: true,
        created_at: true,
        delivered_at: true,
      },
    });

    // Calculate metrics
    const metrics = {
      total_jobs: allJobs.length,
      pending: allJobs.filter((j) => j.status === "queued").length,
      processing: allJobs.filter((j) => j.status === "processing").length,
      delivered: allJobs.filter((j) => j.status === "delivered").length,
      failed: allJobs.filter((j) => j.status === "failed").length,
      dead_lettered: allJobs.filter(
        (j) => j.status === "failed" && j.attempts >= 6,
      ).length,
    };

    // Get recent failed events for debugging
    const recentFailures = await prisma.webhookDeliveryJob.findMany({
      where: {
        ...where,
        status: "failed",
      },
      select: {
        id: true,
        webhook_id: true,
        event_type: true,
        attempts: true,
        last_error: true,
        next_attempt_at: true,
        created_at: true,
      },
      orderBy: { created_at: "desc" },
      take: 10,
    });

    // Get pending events (oldest first)
    const pendingEvents = await prisma.webhookDeliveryJob.findMany({
      where: {
        ...where,
        status: { in: ["queued", "failed"] },
        next_attempt_at: { lte: new Date() },
      },
      select: {
        id: true,
        webhook_id: true,
        event_type: true,
        attempts: true,
        next_attempt_at: true,
        created_at: true,
      },
      orderBy: { next_attempt_at: "asc" },
      take: 20,
    });

    return NextResponse.json({
      metrics,
      webhooks,
      recentFailures,
      pendingEvents,
      summary: {
        webhookCount: webhooks.length,
        activeWebhooks: webhooks.filter((w) => w.status === "active").length,
        jobsReadyForDelivery: allJobs.filter(
          (j) =>
            (j.status === "queued" || j.status === "failed") &&
            j.next_attempt_at <= new Date(),
        ).length,
      },
    });
  } catch (error) {
    console.error("[Webhook Status] Error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve webhook status" },
      { status: 500 },
    );
  }
}
