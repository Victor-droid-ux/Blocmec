//app/api/user/webhooks/payloads/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createServerSupabaseClient } from "@/lib/supabase/server";

async function getAuthenticatedUser() {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return null;
  }

  let user = await prisma.user.findUnique({
    where: { supabase_id: data.user.id },
  });

  if (!user && data.user.email) {
    user = await prisma.user.findUnique({ where: { email: data.user.email } });
  }

  return user;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const payload = await prisma.webhookEventPayload.findFirst({
      where: { id, user_id: user.id },
      select: {
        id: true,
        event_type: true,
        summary: true,
        payload: true,
        batch_id: true,
        created_at: true,
        expires_at: true,
      },
    });

    if (!payload) {
      return NextResponse.json({ error: "Payload not found" }, { status: 404 });
    }

    if (payload.expires_at && payload.expires_at < new Date()) {
      return NextResponse.json({ error: "Payload expired" }, { status: 410 });
    }

    const page = Math.max(
      1,
      Number.parseInt(req.nextUrl.searchParams.get("page") ?? "1", 10) || 1,
    );
    const limit = Math.min(
      500,
      Math.max(
        1,
        Number.parseInt(req.nextUrl.searchParams.get("limit") ?? "100", 10) ||
          100,
      ),
    );

    let items: Array<{ tokenId: string; qrData: string }> = [];
    let total = 0;

    if (payload.batch_id) {
      total = await prisma.qrCode.count({
        where: { batch_id: payload.batch_id },
      });

      const qrs = await prisma.qrCode.findMany({
        where: { batch_id: payload.batch_id },
        orderBy: { created_at: "asc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          token_id: true,
          qr_data: true,
        },
      });

      items = qrs.map((row) => ({
        tokenId: row.token_id,
        qrData: row.qr_data,
      }));
    }

    return NextResponse.json({
      payload: {
        id: payload.id,
        eventType: payload.event_type,
        summary: payload.summary,
        createdAt: payload.created_at,
        expiresAt: payload.expires_at,
      },
      data: {
        page,
        limit,
        total,
        items,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to load payload" },
      { status: 500 },
    );
  }
}
