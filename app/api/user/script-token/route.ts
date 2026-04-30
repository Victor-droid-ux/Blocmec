// app/api/user/script-token/route.ts

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createScriptToken, normalizeBoundDomain } from "@/lib/script-token";
import { hasAnyPermission } from "@/lib/developer-policy";

const schema = z.object({
  apiKeyId: z.string().uuid(),
  domain: z.string().trim().min(1),
});

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

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const boundDomain = normalizeBoundDomain(parsed.data.domain);
    if (!boundDomain) {
      return NextResponse.json({ error: "Invalid domain" }, { status: 400 });
    }

    const apiKey = await prisma.apiKey.findFirst({
      where: {
        id: parsed.data.apiKeyId,
        user_id: user.id,
        status: "active",
        OR: [{ expires_at: null }, { expires_at: { gt: new Date() } }],
      },
      select: {
        id: true,
        permissions: true,
        allowed_domains: true,
      },
    });

    if (!apiKey) {
      return NextResponse.json(
        { error: "Active API key not found" },
        { status: 404 },
      );
    }

    if (!hasAnyPermission(apiKey.permissions, ["verify", "qr:read"])) {
      return NextResponse.json(
        { error: "API key does not have verify permission" },
        { status: 403 },
      );
    }

    const currentAllowed = Array.isArray(apiKey.allowed_domains)
      ? apiKey.allowed_domains
      : [];

    if (currentAllowed.length > 0 && !currentAllowed.includes(boundDomain)) {
      return NextResponse.json(
        {
          error:
            "Domain is not in this API key allowlist. Add the domain to the key before generating a script token.",
        },
        { status: 403 },
      );
    }

    if (currentAllowed.length === 0) {
      await prisma.apiKey.update({
        where: { id: apiKey.id },
        data: {
          allowed_domains: [boundDomain],
          updated_at: new Date(),
        },
      });
    }

    const token = createScriptToken({
      apiKeyId: apiKey.id,
      userId: user.id,
      domain: boundDomain,
    });

    const origin = req.nextUrl.origin;
    const scriptUrl = `${origin}/api/script/api.js?token=${encodeURIComponent(token)}`;

    return NextResponse.json({
      token,
      domain: boundDomain,
      scriptUrl,
      scriptTag: `<script async src="${scriptUrl}"></script>`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to create script token" },
      { status: 500 },
    );
  }
}
