import crypto from "crypto";

const DEV_FALLBACK_SECRET = "blockmec-dev-verify-link-secret";

function getSecret() {
  const secret =
    process.env.BLOCKMEC_VERIFY_LINK_SECRET ??
    process.env.BLOCKMEC_SCRIPT_TOKEN_SECRET;

  if (secret) return secret;

  if (process.env.NODE_ENV !== "production") {
    return DEV_FALLBACK_SECRET;
  }

  throw new Error(
    "Missing BLOCKMEC_VERIFY_LINK_SECRET (or BLOCKMEC_SCRIPT_TOKEN_SECRET) environment variable.",
  );
}

/**
 * Signs a QR token id so the public verification page can prove the visitor
 * arrived from a code we issued, instead of accepting any guessed token id.
 */
export function signVerificationLink(tokenId: string) {
  return crypto
    .createHmac("sha256", getSecret())
    .update(`verify:${tokenId}`)
    .digest("base64url")
    .slice(0, 32);
}

export function verifyVerificationLink(tokenId: string, signature?: string | null) {
  if (!tokenId || !signature) return false;

  const expected = signVerificationLink(tokenId);
  const supplied = Buffer.from(signature, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");

  if (supplied.length !== expectedBuffer.length) return false;

  return crypto.timingSafeEqual(supplied, expectedBuffer);
}

/**
 * Build the URL encoded inside a QR code. When the customer has configured a
 * verification page on their own domain, the code points there (the embed
 * script handles the lookup); otherwise it falls back to our hosted page.
 */
export function buildVerificationUrl(params: {
  tokenId: string;
  appUrl: string;
  verificationBaseUrl?: string | null;
}) {
  const { tokenId, appUrl, verificationBaseUrl } = params;
  const signature = signVerificationLink(tokenId);

  if (verificationBaseUrl) {
    const base = verificationBaseUrl.trim();

    if (base.includes("{code}") || base.includes("{token}")) {
      return base
        .replace(/\{code\}|\{token\}/g, encodeURIComponent(tokenId))
        .replace(/\{signature\}/g, signature);
    }

    const separator = base.includes("?") ? "&" : "?";
    return `${base}${separator}qr=${encodeURIComponent(tokenId)}&t=${signature}`;
  }

  return `${appUrl}/verify/${encodeURIComponent(tokenId)}?t=${signature}`;
}
