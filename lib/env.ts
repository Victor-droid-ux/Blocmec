// Environment variable validation and type safety
import { z } from "zod"

const envSchema = z.object({
  // Blockchain
  NEXT_PUBLIC_RPC_URL: z.string().url(),
  PRIVATE_KEY: z.string().min(64),
  BLOCKMEC_CONTRACT_ADDRESS: z.string().regex(/^0x[a-fA-F0-9]{40}$/),

  // Payment
  NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY: z.string().min(10),
  FLUTTERWAVE_SECRET_KEY: z.string().min(10),
  NEXT_PUBLIC_BLC_CRYPTO_WALLET_ADDRESS: z.string().min(10),

  // Security
  JWT_SECRET: z.string().min(32),
  SESSION_SECRET: z.string().min(32),
  ENCRYPTION_KEY: z.string().min(32),

  // Application
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_API_URL: z.string().url(),
  NODE_ENV: z.enum(["development", "production", "test"]),

  // Optional
  DATABASE_URL: z.string().optional(),
  MOCK_BLOCKCHAIN: z.string().optional(),
  DEBUG: z.string().optional(),
})

export type Env = z.infer<typeof envSchema>

// Validate environment variables
export function validateEnv(): Env {
  try {
    return envSchema.parse({
      NEXT_PUBLIC_RPC_URL: process.env.NEXT_PUBLIC_RPC_URL,
      PRIVATE_KEY: process.env.PRIVATE_KEY,
      BLOCKMEC_CONTRACT_ADDRESS: process.env.BLOCKMEC_CONTRACT_ADDRESS,
      NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY: process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY,
      FLUTTERWAVE_SECRET_KEY: process.env.FLUTTERWAVE_SECRET_KEY,
      NEXT_PUBLIC_BLC_CRYPTO_WALLET_ADDRESS: process.env.NEXT_PUBLIC_BLC_CRYPTO_WALLET_ADDRESS,
      JWT_SECRET: process.env.JWT_SECRET,
      SESSION_SECRET: process.env.SESSION_SECRET,
      ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL: process.env.DATABASE_URL,
      MOCK_BLOCKCHAIN: process.env.MOCK_BLOCKCHAIN,
      DEBUG: process.env.DEBUG,
    })
  } catch (error) {
    console.error("❌ Invalid environment variables:", error)
    throw new Error("Invalid environment variables")
  }
}

// Helper functions
export const isDevelopment = () => process.env.NODE_ENV === "development"
export const isProduction = () => process.env.NODE_ENV === "production"
export const isMockBlockchain = () => process.env.MOCK_BLOCKCHAIN === "true"
export const isDebugEnabled = () => process.env.DEBUG === "true"
