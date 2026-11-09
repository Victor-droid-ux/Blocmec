// app/api/user/privacy/export/route.ts
// GDPR-compliant data export endpoint
// Returns user's personal data in JSON format

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { supabase_id: authData.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        department: true,
        verification_domain: true,
        subscription_plan: true,
        api_credits: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get all QR codes
    const qrCodes = await prisma.qrCode.findMany({
      where: { user_id: dbUser.id },
      select: {
        id: true,
        token_id: true,
        product_name: true,
        product_type: true,
        scan_count: true,
        scan_limit: true,
        status: true,
        expires_at: true,
        created_at: true,
        updated_at: true,
      },
    });

    // Get all verifications
    const verifications = await prisma.verification.findMany({
      where: {
        qr_code: { user_id: dbUser.id },
      },
      select: {
        id: true,
        token_id: true,
        device_type: true,
        location_country: true,
        location_city: true,
        status: true,
        created_at: true,
      },
    });

    // Get all API keys (without revealing the actual key)
    const apiKeys = await prisma.apiKey.findMany({
      where: { user_id: dbUser.id },
      select: {
        id: true,
        name: true,
        status: true,
        last_used_at: true,
        created_at: true,
        expires_at: true,
      },
    });

    // Get all batches
    const batches = await prisma.batch.findMany({
      where: { user_id: dbUser.id },
      select: {
        id: true,
        name: true,
        batch_number: true,
        product_type: true,
        total_count: true,
        generated_count: true,
        status: true,
        created_at: true,
      },
    });

    const exportData = {
      export_date: new Date().toISOString(),
      user: dbUser,
      qr_codes: qrCodes,
      verifications: verifications,
      api_keys: apiKeys,
      batches: batches,
      summary: {
        total_qr_codes: qrCodes.length,
        total_verifications: verifications.length,
        total_api_keys: apiKeys.length,
        total_batches: batches.length,
      },
    };

    // Log the export
    await prisma.auditLog.create({
      data: {
        user_id: dbUser.id,
        action: "export_user_data",
        resource_type: "User",
        resource_id: dbUser.id,
        metadata: {
          export_scope: "full",
          qr_codes_count: qrCodes.length,
          verifications_count: verifications.length,
        },
      },
    });

    // Return as downloadable JSON file
    const response = new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="blockmec-data-${new Date().toISOString().split("T")[0]}.json"`,
      },
    });

    return response;
  } catch (error) {
    console.error("[Privacy Export] Error:", error);
    return NextResponse.json(
      { error: "Failed to export user data" },
      { status: 500 }
    );
  }
}
