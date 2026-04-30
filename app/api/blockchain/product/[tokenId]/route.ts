import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  applyBlockchainReadRateLimit,
  getVerificationUrl,
  resolveTransactionHash,
  validateIdentifier,
} from "@/lib/blockchain/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ tokenId: string }> },
) {
  try {
    const rateLimitResult = await applyBlockchainReadRateLimit(req);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    const { tokenId: rawTokenId } = await params;
    const tokenIdResult = validateIdentifier(rawTokenId, "Token ID");
    if (tokenIdResult instanceof NextResponse) {
      return tokenIdResult;
    }

    const tokenId = tokenIdResult;

    const qrCode = await prisma.qrCode.findFirst({
      where: {
        OR: [{ token_id: tokenId }, { blockchain_token_id: tokenId }],
      },
      select: {
        id: true,
        token_id: true,
        product_name: true,
        product_type: true,
        qr_data: true,
        status: true,
        scan_count: true,
        scan_limit: true,
        expires_at: true,
        created_at: true,
        metadata: true,
        blockchain_tx_hash: true,
      },
    });

    if (!qrCode) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const metadata = (qrCode.metadata as Record<string, unknown> | null) ?? {};

    return NextResponse.json({
      id: qrCode.id,
      tokenId: qrCode.token_id,
      productName: qrCode.product_name,
      productType: qrCode.product_type,
      batchNumber: metadata.batchNumber ?? null,
      manufacturer: metadata.manufacturer ?? null,
      qrData: qrCode.qr_data,
      verificationUrl: qrCode.qr_data || getVerificationUrl(qrCode.token_id),
      transactionHash: resolveTransactionHash(qrCode),
      status: qrCode.status,
      scanCount: qrCode.scan_count,
      scanLimit: qrCode.scan_limit,
      expiresAt: qrCode.expires_at?.toISOString() ?? null,
      createdAt: qrCode.created_at.toISOString(),
      metadata,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Product lookup failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
