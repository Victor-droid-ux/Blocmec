import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  applyBlockchainReadRateLimit,
  buildVerificationResult,
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
        hash: tokenId,
      });
    }

    return NextResponse.json(buildVerificationResult(qrCode));
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Token verification failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
