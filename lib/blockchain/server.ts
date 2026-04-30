import crypto from "crypto";
import QRCode from "qrcode";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";
import { rateLimit } from "@/lib/rateLimiter";

const BLOCKCHAIN_READ_LIMIT = {
  maxRequests: 60,
  windowMs: 60_000,
} as const;

const BLOCKCHAIN_WRITE_LIMIT = {
  maxRequests: 15,
  windowMs: 60_000,
} as const;

export async function getAuthenticatedUser() {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return null;
  }

  let user = await prisma.user.findUnique({
    where: { supabase_id: data.user.id },
  });

  if (!user && data.user.email) {
    user = await prisma.user.findUnique({
      where: { email: data.user.email },
    });
  }

  return user;
}

export async function applyBlockchainReadRateLimit(request: NextRequest) {
  return rateLimit(request, BLOCKCHAIN_READ_LIMIT);
}

export async function applyBlockchainWriteRateLimit(request: NextRequest) {
  return rateLimit(request, BLOCKCHAIN_WRITE_LIMIT);
}

export function validateIdentifier(
  value: string | undefined,
  label: string,
): string | NextResponse {
  const normalized = value?.trim();

  if (!normalized) {
    return NextResponse.json(
      { error: `${label} is required` },
      { status: 400 },
    );
  }

  if (normalized.length > 255) {
    return NextResponse.json(
      { error: `${label} is too long` },
      { status: 400 },
    );
  }

  return normalized;
}

export function generateTokenId() {
  return `BM-${Date.now()}-${Math.random().toString(36).slice(2, 9).toUpperCase()}`;
}

export function generateTransactionHash(seed: string) {
  return `0x${crypto
    .createHash("sha256")
    .update(`${seed}:${Date.now()}:${crypto.randomUUID()}`)
    .digest("hex")}`;
}

export function getVerificationUrl(tokenId: string) {
  const appUrl = (
    process.env.NEXT_PUBLIC_APP_URL ?? "https://blockmec.org"
  ).replace(/\/$/, "");
  return `${appUrl}/verify/${tokenId}`;
}

export async function generateQrCodeDataUrl(verificationUrl: string) {
  return QRCode.toDataURL(verificationUrl, {
    width: 512,
    margin: 2,
    color: {
      dark: "#000000",
      light: "#FFFFFF",
    },
  });
}

export function resolveTransactionHash(qrCode: {
  token_id: string;
  blockchain_tx_hash: string | null;
}) {
  return (
    qrCode.blockchain_tx_hash ??
    `0x${crypto.createHash("sha256").update(qrCode.token_id).digest("hex")}`
  );
}

export function getBlockConfirmations(createdAt: Date) {
  return Math.max(
    1,
    Math.floor((Date.now() - createdAt.getTime()) / 12_000) + 1,
  );
}

export function getBlockNumber(createdAt: Date) {
  return Math.max(1, Math.floor(createdAt.getTime() / 12_000));
}

export function buildVerificationResult(qrCode: {
  token_id: string;
  status: string;
  created_at: Date;
  blockchain_tx_hash: string | null;
}) {
  return {
    verified: qrCode.status === "active",
    transactionId: resolveTransactionHash(qrCode),
    blockConfirmations: getBlockConfirmations(qrCode.created_at),
    timestamp: qrCode.created_at.getTime(),
    hash: qrCode.token_id,
  };
}
