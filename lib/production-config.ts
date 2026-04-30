/**
 * Production Configuration Setup Guide
 * This file contains the configuration structure needed for production
 */

export const productionConfig = {
  // Database Configuration
  database: {
    // PostgreSQL Configuration
    postgres: {
      host: process.env.POSTGRES_HOST || "localhost",
      port: Number.parseInt(process.env.POSTGRES_PORT || "5432"),
      database: process.env.POSTGRES_DATABASE || "blockmec",
      user: process.env.POSTGRES_USER || "blockmec_user",
      password: process.env.POSTGRES_PASSWORD,
      ssl: process.env.NODE_ENV === "production",
      maxConnections: 20,
      idleTimeoutMillis: 30000,
    },

    // Redis Configuration (for caching and sessions)
    redis: {
      host: process.env.REDIS_HOST || "localhost",
      port: Number.parseInt(process.env.REDIS_PORT || "6379"),
      password: process.env.REDIS_PASSWORD,
      db: Number.parseInt(process.env.REDIS_DB || "0"),
      ttl: 3600, // 1 hour default
    },
  },

  // Authentication Configuration
  auth: {
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: "7d",
    refreshTokenExpiresIn: "30d",
    bcryptRounds: 10,
    sessionSecret: process.env.SESSION_SECRET,
    passwordResetExpiry: 3600, // 1 hour
    verificationExpiry: 86400, // 24 hours
  },

  // Email Configuration
  email: {
    provider: "sendgrid", // or 'aws-ses', 'resend'
    apiKey: process.env.SENDGRID_API_KEY,
    from: {
      email: process.env.EMAIL_FROM || "noreply@blockmec.org",
      name: "Blockmec",
    },
    replyTo: "support@blockmec.org",
    templates: {
      welcome: "d-xxx",
      verification: "d-xxx",
      passwordReset: "d-xxx",
      paymentConfirmation: "d-xxx",
    },
  },

  // File Storage Configuration
  storage: {
    provider: "s3", // or 'cloudinary', 'vercel-blob'
    aws: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || "us-east-1",
      bucket: process.env.AWS_S3_BUCKET || "blockmec-files",
    },
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ["image/jpeg", "image/png", "image/gif", "application/pdf"],
  },

  // Payment Configuration
  payment: {
    flutterwave: {
      publicKey: process.env.FLUTTERWAVE_PUBLIC_KEY,
      secretKey: process.env.FLUTTERWAVE_SECRET_KEY,
      encryptionKey: process.env.FLUTTERWAVE_ENCRYPTION_KEY,
      webhookSecret: process.env.FLUTTERWAVE_WEBHOOK_SECRET,
    },
    currency: "USD",
    plans: {
      starter: {
        price: 29,
        qrLimit: 1000,
        features: ["basic-analytics", "email-support"],
      },
      professional: {
        price: 99,
        qrLimit: 10000,
        features: ["advanced-analytics", "priority-support", "api-access"],
      },
      enterprise: {
        price: 299,
        qrLimit: -1, // unlimited
        features: [
          "advanced-analytics",
          "priority-support",
          "api-access",
          "white-label",
          "custom-branding",
        ],
      },
    },
  },

  // Blockchain Configuration
  blockchain: {
    network: process.env.BLOCKCHAIN_NETWORK || "polygon", // 'ethereum', 'polygon', 'bsc'
    rpcUrl: process.env.BLOCKCHAIN_RPC_URL,
    chainId: Number.parseInt(process.env.BLOCKCHAIN_CHAIN_ID || "137"),
    contractAddress: process.env.CONTRACT_ADDRESS,
    privateKey: process.env.BLOCKCHAIN_PRIVATE_KEY,
    gasLimit: 500000,
    confirmations: 3,
  },

  // Security Configuration
  security: {
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      skipSuccessfulRequests: false,
    },
    apiKeyRateLimit: {
      windowMs: 60 * 1000, // 1 minute
      max: 1000, // 1000 requests per minute for API keys
    },
    cors: {
      origin: process.env.ALLOWED_ORIGINS?.split(",") || [
        "https://blockmec.org",
      ],
      credentials: true,
    },
    helmet: {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: [
            "'self'",
            "'unsafe-inline'",
            "https://verify.blockmec.org",
          ],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    },
  },

  // Monitoring Configuration
  monitoring: {
    sentry: {
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 0.1,
    },
    analytics: {
      googleAnalyticsId: process.env.GA_TRACKING_ID,
      mixpanelToken: process.env.MIXPANEL_TOKEN,
    },
    logging: {
      level: process.env.LOG_LEVEL || "info",
      format: "json",
      destination: process.env.LOG_DESTINATION || "stdout",
    },
  },

  // Feature Flags
  features: {
    enableBlockchain: process.env.ENABLE_BLOCKCHAIN === "true",
    enablePayments: process.env.ENABLE_PAYMENTS === "true",
    enableAnalytics: process.env.ENABLE_ANALYTICS === "true",
    enableNotifications: process.env.ENABLE_NOTIFICATIONS === "true",
    maintenanceMode: process.env.MAINTENANCE_MODE === "true",
  },

  // API Configuration
  api: {
    version: "v1",
    baseUrl: process.env.NEXT_PUBLIC_API_URL || "https://api.blockmec.org",
    timeout: 30000, // 30 seconds
    retryAttempts: 3,
  },
};

// Validate required environment variables
export function validateProductionConfig() {
  const required = [
    "POSTGRES_HOST",
    "POSTGRES_PASSWORD",
    "JWT_SECRET",
    "SESSION_SECRET",
    "SENDGRID_API_KEY",
    "AWS_ACCESS_KEY_ID",
    "AWS_SECRET_ACCESS_KEY",
    "FLUTTERWAVE_SECRET_KEY",
    "BLOCKCHAIN_RPC_URL",
    "CONTRACT_ADDRESS",
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
  }

  return true;
}
