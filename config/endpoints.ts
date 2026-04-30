//config/endpoints.ts

export const API_ENDPOINTS = {
  AUTH: {
    SIGN_IN: "/api/auth/signin",
    SIGN_OUT: "/api/auth/signout",
    ADMIN: "/api/auth/admin",
    ME: "/api/auth/me",
  },

  USER: {
    PROFILE: "/api/user/profile",
    STATS: "/api/user/stats",
    API_KEYS: "/api/user/api-keys",
    SCRIPT_TOKEN: "/api/user/script-token",
    CREDITS: "/api/user/credits",
    BATCHES: "/api/user/batches",
    WEBHOOKS: "/api/user/webhooks",
  },

  QR: {
    GENERATE: "/api/generate-qr",
    VERIFY: "/api/verify-qr",
  },

  BLOCKCHAIN: {
    VERIFY: "/api/blockchain/verify",
    GENERATE_QR: "/api/blockchain/generate-qr",
    TRANSACTION: "/api/blockchain/transaction",
    MINT: "/api/blockchain/mint",
    MINT_WITH_DETAILS: "/api/blockchain/mint-with-details",
    VERIFY_TOKEN: "/api/blockchain/verify-token",
    PRODUCT: "/api/blockchain/product",
  },

  ADMIN: {
    ROOT: "/api/admin",
    LOGS: "/api/admin/logs",
    USERS: "/api/admin/users",
    ANALYTICS: "/api/admin/analytics",
    ANALYTICS_SUMMARY: "/api/admin/analytics/summary",
    ANALYTICS_INSIGHTS: "/api/admin/analytics/insights",
    USER_STATS: "/api/admin/users/stats",
  },

  PRICING: {
    CREDITS: "/api/pricing/credits",
  },

  INTERNAL: {
    WEBHOOK_DISPATCH: "/api/internal/webhooks/dispatch",
  },
} as const;
