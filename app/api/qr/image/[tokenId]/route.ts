// app/api/qr/image/[tokenId]/route.ts
// On-demand QR code image generation endpoint
// Generates QR images only when requested, reducing database bloat

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import QRCode from "qrcode";

const CACHE_DURATION_SECONDS = 86400; // 24 hours

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ tokenId: string }> }
) {
  try {
    const { tokenId } = await params;

    if (!tokenId || typeof tokenId !== "string") {
      return NextResponse.json(
        { error: "Invalid token ID" },
        { status: 400 }
      );
    }

    // Find the QR code record
    const qrCode = await prisma.qrCode.findUnique({
      where: { token_id: tokenId },
      select: {
        id: true,
        token_id: true,
        qr_data: true,
        status: true,
        user_id: true,
      },
    });

    if (!qrCode) {
      return NextResponse.json(
        { error: "QR code not found" },
        { status: 404 }
      );
    }

    if (qrCode.status !== "active") {
      return NextResponse.json(
        { error: "QR code is not active" },
        { status: 410 } // Gone
      );
    }

    // Generate QR image on-demand
    const qrImageDataUrl = await QRCode.toDataURL(qrCode.qr_data, {
      width: 512,
      margin: 2,
      errorCorrectionLevel: "H",
      color: { dark: "#000000", light: "#FFFFFF" },
    });

    // Convert data URL to buffer
    const base64Data = qrImageDataUrl.replace(/^data:image\/png;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    // Set cache headers
    const response = new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": `public, max-age=${CACHE_DURATION_SECONDS}`,
        "X-QR-Token": tokenId,
      },
    });

    return response;
  } catch (error) {
    console.error("[QR Image] Generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate QR image" },
      { status: 500 }
    );
  }
}
