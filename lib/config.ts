// Application configuration using environment variables
import {
  validateEnv,
  isDevelopment,
  isMockBlockchain,
  isDebugEnabled,
} from "./env";

// Validate environment variables on startup
const env = validateEnv();

export const config = {
  // Application
  app: {
    name: "Blockmec Chain",
    version: "1.0.0",
    url: env.NEXT_PUBLIC_APP_URL,
    apiUrl: env.NEXT_PUBLIC_API_URL,
    environment: env.NODE_ENV,
  },

  // Blockchain
  blockchain: {
    rpcUrl: env.NEXT_PUBLIC_RPC_URL,
    privateKey: env.PRIVATE_KEY,
    contractAddress: env.BLOCKMEC_CONTRACT_ADDRESS,
    mockMode: isMockBlockchain(),
  },

  // Payment
  payment: {
    flutterwave: {
      publicKey: env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY,
      secretKey: env.FLUTTERWAVE_SECRET_KEY,
    },
    blc: {
      walletAddress: env.NEXT_PUBLIC_BLC_CRYPTO_WALLET_ADDRESS,
    },
  },

  // Security
  security: {
    jwtSecret: env.JWT_SECRET,
    sessionSecret: env.SESSION_SECRET,
    encryptionKey: env.ENCRYPTION_KEY,
  },

  // Database
  database: {
    url: env.DATABASE_URL || "file:./dev.db",
  },

  // Features
  features: {
    debug: isDebugEnabled(),
    mockBlockchain: isMockBlockchain(),
    apiDocs: isDevelopment(),
    emailVerification: !isDevelopment(),
  },

  // Rate limiting
  rateLimit: {
    maxRequests: Number.parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100"),
    windowMs: Number.parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000"),
  },

  // File upload
  upload: {
    maxSize: Number.parseInt(process.env.MAX_FILE_SIZE || "10485760"), // 10MB
    allowedTypes: ["image/jpeg", "image/png", "image/gif", "application/pdf"],
    directory: process.env.UPLOAD_DIR || "./uploads",
  },

  // QR Code
  qrCode: {
    size: Number.parseInt(process.env.QR_CODE_SIZE || "256"),
    errorCorrection: process.env.QR_CODE_ERROR_CORRECTION || "M",
  },

  // Admin — all values must come from environment variables
  admin: {
    email: process.env.ADMIN_EMAIL!, // set ADMIN_EMAIL in your .env — no hardcoded fallback
    passwordHash: process.env.ADMIN_PASSWORD_HASH,
  },
} as const;

export default config;
