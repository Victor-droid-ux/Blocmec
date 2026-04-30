import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  applyBlockchainReadRateLimit,
  getBlockConfirmations,
  getBlockNumber,
  resolveTransactionHash,
  validateIdentifier,
} from "@/lib/blockchain/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ txHash: string }> },
) {
  try {
    const rateLimitResult = await applyBlockchainReadRateLimit(req);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    const { txHash: rawTxHash } = await params;
    const txHashResult = validateIdentifier(rawTxHash, "Transaction hash");
    if (txHashResult instanceof NextResponse) {
      return txHashResult;
    }

    const txHash = txHashResult;

    const qrCodes = await prisma.qrCode.findMany({
      where: { blockchain_tx_hash: txHash },
      orderBy: { created_at: "asc" },
      take: 1,
      select: {
        token_id: true,
        created_at: true,
        status: true,
        blockchain_tx_hash: true,
      },
    });

    const qrCode = qrCodes[0];
    if (!qrCode) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      hash: resolveTransactionHash(qrCode),
      blockNumber: getBlockNumber(qrCode.created_at),
      confirmations: getBlockConfirmations(qrCode.created_at),
      timestamp: qrCode.created_at.getTime(),
      status: qrCode.status === "active" ? "success" : "pending",
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Transaction lookup failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
