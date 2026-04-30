import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  applyBlockchainReadRateLimit,
  buildVerificationResult,
  validateIdentifier,
} from "@/lib/blockchain/server";

export async function POST(req: NextRequest) {
  try {
    const rateLimitResult = await applyBlockchainReadRateLimit(req);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    const body = await req.json().catch(() => ({}));
    const productIdResult = validateIdentifier(
      typeof body.productId === "string" ? body.productId : undefined,
      "Product ID",
    );

    if (productIdResult instanceof NextResponse) {
      return productIdResult;
    }

    const productId = productIdResult;

    const qrCode = await prisma.qrCode.findFirst({
      where: {
        OR: [
          { id: productId },
          { token_id: productId },
          { blockchain_token_id: productId },
        ],
      },
      select: {
        token_id: true,
        status: true,
        created_at: true,
        blockchain_tx_hash: true,
      },
    });

    if (!qrCode) {
      return NextResponse.json({
        verified: false,
        transactionId: "",
        blockConfirmations: 0,
        timestamp: Date.now(),
        hash: productId,
      });
    }

    return NextResponse.json(buildVerificationResult(qrCode));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Verification failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
