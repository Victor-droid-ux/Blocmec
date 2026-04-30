import { createHash, randomBytes, createCipheriv, createDecipheriv } from "crypto"

// Secret key for encryption/decryption - in production, use environment variables
const SECRET_KEY = "blockmec-verification-secret-key-2024"
const IV_LENGTH = 16 // For AES, this is always 16 bytes

interface QRCodeGenerationParams {
  type: string
  identifier: string
  customData?: Record<string, any>
  expiresIn?: number // in seconds
}

/**
 * Generate QR code data with optional encryption and expiration
 */
export async function generateQRCodeData(params: QRCodeGenerationParams): Promise<string> {
  const { type, identifier, customData = {}, expiresIn } = params

  // Create base payload
  const payload = {
    type,
    id: identifier,
    timestamp: Date.now(),
    data: customData,
    ...(expiresIn ? { expires: Date.now() + expiresIn * 1000 } : {}),
  }

  // Add signature for verification
  const signature = createHash("sha256")
    .update(JSON.stringify(payload) + SECRET_KEY)
    .digest("hex")

  const signedPayload = {
    ...payload,
    signature,
  }

  // Encrypt if secure type
  if (type === "secure") {
    return encryptData(JSON.stringify(signedPayload))
  }

  return JSON.stringify(signedPayload)
}

/**
 * Verify QR code data
 */
export async function verifyQRCode(qrData: string): Promise<{
  verified: boolean
  message: string
  data?: any
}> {
  try {
    // Try to parse as JSON first (for standard and timed types)
    let payload

    try {
      payload = JSON.parse(qrData)
    } catch (e) {
      // If parsing fails, try to decrypt (for secure type)
      const decrypted = decryptData(qrData)
      payload = JSON.parse(decrypted)
    }

    // Check if payload has required fields
    if (!payload.id || !payload.timestamp || !payload.signature) {
      return {
        verified: false,
        message: "Invalid QR code format",
      }
    }

    // Check expiration for timed QR codes
    if (payload.expires && payload.expires < Date.now()) {
      return {
        verified: false,
        message: "QR code has expired",
        data: payload,
      }
    }

    // Verify signature
    const { signature, ...dataWithoutSignature } = payload
    const expectedSignature = createHash("sha256")
      .update(JSON.stringify(dataWithoutSignature) + SECRET_KEY)
      .digest("hex")

    if (signature !== expectedSignature) {
      return {
        verified: false,
        message: "Invalid signature - QR code may have been tampered with",
      }
    }

    return {
      verified: true,
      message: `Successfully verified ${payload.type} QR code for ID: ${payload.id}`,
      data: payload,
    }
  } catch (error) {
    console.error("QR verification error:", error)
    return {
      verified: false,
      message: "Failed to verify QR code: " + (error instanceof Error ? error.message : String(error)),
    }
  }
}

/**
 * Encrypt data using AES-256-CBC
 */
function encryptData(text: string): string {
  // Create a hash of the secret key to get a key of the right length
  const key = createHash("sha256").update(SECRET_KEY).digest()
  const iv = randomBytes(IV_LENGTH)

  const cipher = createCipheriv("aes-256-cbc", key, iv)
  let encrypted = cipher.update(text, "utf8", "base64")
  encrypted += cipher.final("base64")

  // Return IV + encrypted data
  return iv.toString("hex") + ":" + encrypted
}

/**
 * Decrypt data using AES-256-CBC
 */
function decryptData(text: string): string {
  const [ivHex, encryptedData] = text.split(":")

  if (!ivHex || !encryptedData) {
    throw new Error("Invalid encrypted data format")
  }

  // Create a hash of the secret key to get a key of the right length
  const key = createHash("sha256").update(SECRET_KEY).digest()
  const iv = Buffer.from(ivHex, "hex")

  const decipher = createDecipheriv("aes-256-cbc", key, iv)
  let decrypted = decipher.update(encryptedData, "base64", "utf8")
  decrypted += decipher.final("utf8")

  return decrypted
}
