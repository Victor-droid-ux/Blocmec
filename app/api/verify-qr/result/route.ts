import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const tokenId = req.nextUrl.searchParams.get("id");
    
    if (!tokenId) {
      return NextResponse.json(
        { error: "Missing token ID" },
        { status: 400 }
      );
    }

    // Fetch the QR code and its verification status from the database
    const qrCode = await prisma.qrCode.findUnique({
      where: { token_id: tokenId },
      include: {
        verifications: {
          orderBy: { created_at: "desc" },
          take: 1,
        },
      },
    });

    if (!qrCode) {
      return NextResponse.json(
        { error: "QR code not found" },
        { status: 404 }
      );
    }

    const lastVerification = qrCode.verifications[0];

    // Return verified data from database - never trust client-side data
    return NextResponse.json({
      verified: lastVerification?.status === "verified",
      productName: qrCode.product_name || "Unknown Product",
      transactionId: qrCode.token_id,
      blockConfirmations: 0,
      scanCount: qrCode.scan_count || 0,
      userProducts: 0,
      hash: qrCode.blockchain_tx_hash || qrCode.token_id,
      productImage: (qrCode.metadata as any)?.image,
      timestamp: qrCode.created_at.getTime(),
      message: lastVerification?.status === "verified" ? "Product verified" : "Verification pending",
      type: qrCode.product_type || "standard",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to retrieve verification result" },
      { status: 500 }
    );
  }
}
