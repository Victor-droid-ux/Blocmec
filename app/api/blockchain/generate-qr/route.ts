import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  applyBlockchainWriteRateLimit,
  generateQrCodeDataUrl,
  generateTokenId,
  getVerificationUrl,
} from "@/lib/blockchain/server";

const generateQrSchema = z.object({
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

    const body = await req.json().catch(() => ({}));
    const parsed = generateQrSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const tokenId = parsed.data.id || generateTokenId();
    const verificationUrl = getVerificationUrl(tokenId);
    const qrCode = await generateQrCodeDataUrl(verificationUrl);

    return NextResponse.json({
      qrCode,
      hash: tokenId,
      url: verificationUrl,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to generate QR";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
