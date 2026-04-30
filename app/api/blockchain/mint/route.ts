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

const mintSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).default("Product"),
  image: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
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

    if (user.api_credits < 1) {
      return NextResponse.json(
        { error: "Insufficient API credits" },
        { status: 402 },
      );
    }

    const body = await req.json().catch(() => ({}));
    const parsed = mintSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const tokenId = parsed.data.id || generateTokenId();
    const verificationUrl = getVerificationUrl(tokenId);
    const transactionHash = generateTransactionHash(tokenId);
    const qrCodeDataUrl = await generateQrCodeDataUrl(verificationUrl);

    await prisma.qrCode.create({
      data: {
        user_id: user.id,
        token_id: tokenId,
        product_type: String(parsed.data.metadata?.productType ?? "general"),
        product_name: parsed.data.name,
        qr_data: verificationUrl,
        qr_image_url: qrCodeDataUrl,
        blockchain_tx_hash: transactionHash,
        blockchain_token_id: tokenId,
        metadata: {
          image: parsed.data.image,
          ...parsed.data.metadata,
        },
        updated_at: new Date(),
      },
    });

    await prisma.user.update({
      where: { id: user.id },
      data: {
        api_credits: { decrement: 1 },
        updated_at: new Date(),
      },
    });

    await prisma.auditLog.create({
      data: {
        user_id: user.id,
        action: "blockchain_mint",
        resource_type: "QrCode",
        metadata: { tokenId, productName: parsed.data.name },
      },
    });

    return NextResponse.json({
      qrCode: qrCodeDataUrl,
      hash: transactionHash,
      url: verificationUrl,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Minting failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
