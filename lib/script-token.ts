//lib/script-token.ts

import crypto from "crypto";

type ScriptTokenPayload = {
  v: 1;
  apiKeyId: string;
  userId: string;
  domain: string;
  exp: number;
};

function getScriptTokenSecret() {
  const secret = process.env.BLOCKMEC_SCRIPT_TOKEN_SECRET;

  if (secret) {
    return secret;
  }

  if (process.env.NODE_ENV !== "production") {
    return "blockmec-dev-script-token-secret";
  }

  throw new Error("Missing BLOCKMEC_SCRIPT_TOKEN_SECRET environment variable.");
}

function base64UrlEncode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signPayload(encodedPayload: string) {
  return crypto
    .createHmac("sha256", getScriptTokenSecret())
    .update(encodedPayload)
    .digest("base64url");
}

export function normalizeBoundDomain(input: string) {
  const trimmed = input.trim().toLowerCase();
  if (!trimmed) {
    return "";
  }

  const candidate =
    trimmed.startsWith("http://") || trimmed.startsWith("https://")
      ? trimmed
      : `https://${trimmed}`;

  const url = new URL(candidate);
  const normalizedPath = url.pathname.replace(/\/$/, "");
  return `${url.host}${normalizedPath === "/" ? "" : normalizedPath}`;
}

export function createScriptToken(params: {
  apiKeyId: string;
  userId: string;
  domain: string;
  expiresInSeconds?: number;
}) {
  const payload: ScriptTokenPayload = {
    v: 1,
    apiKeyId: params.apiKeyId,
    userId: params.userId,
    domain: normalizeBoundDomain(params.domain),
    exp:
      Math.floor(Date.now() / 1000) +
      (params.expiresInSeconds ?? 60 * 60 * 24 * 30),
  };

  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = signPayload(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function verifyScriptToken(token: string) {
  const [encodedPayload, suppliedSignature] = token.split(".");
  if (!encodedPayload || !suppliedSignature) {
    return null;
  }

  const expectedSignature = signPayload(encodedPayload);
  const suppliedBuffer = Buffer.from(suppliedSignature, "utf8");
  const expectedBuffer = Buffer.from(expectedSignature, "utf8");

  if (
    suppliedBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(suppliedBuffer, expectedBuffer)
  ) {
    return null;
  }

  const payload = JSON.parse(
    base64UrlDecode(encodedPayload),
  ) as ScriptTokenPayload;
  if (payload.v !== 1 || payload.exp <= Math.floor(Date.now() / 1000)) {
    return null;
  }

  return payload;
}

export function doesPageMatchBoundDomain(params: {
  pageUrl?: string | null;
  origin?: string | null;
  referer?: string | null;
  boundDomain: string;
}) {
  const bound = normalizeBoundDomain(params.boundDomain);
  if (!bound) {
    return false;
  }

  const candidates = [params.pageUrl, params.origin, params.referer]
    .filter(Boolean)
    .map((value) => {
      try {
        return normalizeBoundDomain(String(value));
      } catch {
        return "";
      }
    })
    .filter(Boolean);

  if (candidates.length === 0) {
    return true;
  }

  return candidates.some((candidate) => candidate.startsWith(bound));
}
