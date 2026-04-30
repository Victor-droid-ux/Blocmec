import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import {
  applyBlockchainWriteRateLimit,
  generateQrCodeDataUrl,
  generateTokenId,
  generateTransactionHash,
  getAuthenticatedUser,
  getVerificationUrl,
} from "@/lib/blockchain/server";

const mintWithDetailsSchema = z.object({
  productName: z.string().min(1),
  batchNumber: z.string().min(1),
  manufacturer: z.string().min(1),
  quantity: z.number().int().min(1).max(1000).default(1),
});

export async function POST(req: NextRequest) {
  try {
    const rateLimitResult = await applyBlockchainWriteRateLimit(req);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = mintWithDetailsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { productName, batchNumber, manufacturer, quantity } = parsed.data;

    if (user.api_credits < quantity) {
      return NextResponse.json(
        {
          error: `Insufficient credits. You need ${quantity} credits but have ${user.api_credits}`,
        },
        { status: 402 },
      );
    }

    const transactionHash = generateTransactionHash(
      `${productName}:${batchNumber}`,
    );

    const batch = await prisma.batch.create({
      data: {
        user_id: user.id,
        name: `${productName} - ${batchNumber}`,
        product_type: "general",
        batch_number: batchNumber,
        total_count: quantity,
        generated_count: quantity,
        status: "completed",
        metadata: {
          manufacturer,
          source: "blockchain-mint-with-details",
        },
        updated_at: new Date(),
      },
    });

    const createdTokens: Array<{ tokenId: string; verificationUrl: string }> =
      [];

    for (let index = 0; index < quantity; index += 1) {
      const tokenId = generateTokenId();
      const verificationUrl = getVerificationUrl(tokenId);
      const qrCodeDataUrl = await generateQrCodeDataUrl(verificationUrl);

      createdTokens.push({ tokenId, verificationUrl });

      await prisma.qrCode.create({
        data: {
          user_id: user.id,
          batch_id: batch.id,
          token_id: tokenId,
          product_type: "general",
          product_name: productName,
          qr_data: verificationUrl,
          qr_image_url: qrCodeDataUrl,
          blockchain_tx_hash: transactionHash,
          blockchain_token_id: tokenId,
          metadata: {
            batchNumber,
            manufacturer,
            sequence: index + 1,
            total: quantity,
          },
          updated_at: new Date(),
        },
      });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        api_credits: { decrement: quantity },
        updated_at: new Date(),
      },
    });

    await prisma.auditLog.create({
      data: {
        user_id: user.id,
        action: "blockchain_mint_with_details",
        resource_type: "Batch",
        resource_id: batch.id,
        metadata: { productName, batchNumber, manufacturer, quantity },
      },
    });

    const firstToken = createdTokens[0];

    return NextResponse.json({
      tokenId: firstToken.tokenId,
      transactionHash,
      verificationUrl: firstToken.verificationUrl,
      metadata: {
        productName,
        batchNumber,
        timestamp: Date.now(),
        manufacturer,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Minting failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
