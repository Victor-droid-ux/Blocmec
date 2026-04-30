# Environment Variables Setup Guide

This guide explains how to set up the required environment variables for the Blockmec Chain application.

## Quick Setup

1. Copy the `.env.example` file to `.env.local`:
   \`\`\`bash
   cp .env.example .env.local
   \`\`\`

2. Fill in the required values in `.env.local`

## Required Environment Variables

### 🔗 Blockchain Configuration

| Variable                    | Description                             | Example                                        |
| --------------------------- | --------------------------------------- | ---------------------------------------------- |
| `NEXT_PUBLIC_RPC_URL`       | Blockchain RPC endpoint                 | `https://mainnet.infura.io/v3/YOUR_PROJECT_ID` |
| `PRIVATE_KEY`               | Private key for blockchain transactions | `0x1234...`                                    |
| `BLOCKMEC_CONTRACT_ADDRESS` | Smart contract address                  | `0x1234567890123456789012345678901234567890`   |

### 💳 Payment Configuration

| Variable                                | Description            | Example                                       |
| --------------------------------------- | ---------------------- | --------------------------------------------- |
| `NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY`    | Flutterwave public key | `FLWPUBK_TEST-...`                            |
| `FLUTTERWAVE_SECRET_KEY`                | Flutterwave secret key | `FLWSECK_TEST-...`                            |
| `NEXT_PUBLIC_BLC_CRYPTO_WALLET_ADDRESS` | BLC wallet address     | `BLM7F5EB5bB5cF88cfcEe9613368636f458800e62CB` |

### 🔐 Security Configuration

| Variable         | Description                    | Example                            |
| ---------------- | ------------------------------ | ---------------------------------- |
| `JWT_SECRET`     | JWT signing secret             | `your-super-secret-jwt-key`        |
| `SESSION_SECRET` | Session encryption secret      | `your-session-secret`              |
| `ENCRYPTION_KEY` | Data encryption key (32 chars) | `your-32-character-encryption-key` |

## Optional Environment Variables

### 🗄️ Database Configuration

\`\`\`env
DATABASE_URL=postgresql://username:password@localhost:5432/blockmec_db
REDIS_URL=redis://localhost:6379
\`\`\`

### 📧 Email Configuration

\`\`\`env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
\`\`\`

### ☁️ File Storage

\`\`\`env
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_S3_BUCKET=blockmec-files
\`\`\`

### 📊 Analytics & Monitoring

\`\`\`env
NEXT_PUBLIC_GA_TRACKING_ID=G-XXXXXXXXXX
SENTRY_DSN=https://your-sentry-dsn-here
\`\`\`

## Development vs Production

### Development Setup

\`\`\`env
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
MOCK_BLOCKCHAIN=true
DEBUG=true
\`\`\`

### Production Setup

\`\`\`env
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://yourdomain.com
MOCK_BLOCKCHAIN=false
DEBUG=false
\`\`\`

### Staging and Dev Test-Only API Key Bypass

Use the settings below only for staging or development when you need free-plan test users to create API keys.

\`\`\`env
ALLOW_FREE_PLAN_API_KEYS_IN_NON_PROD=true
API_KEY_BYPASS_TEST_EMAILS=tester1@example.com,tester2@example.com
API_KEY_BYPASS_MAX_ACTIVE_KEYS=5
\`\`\`

Notes:

- If API_KEY_BYPASS_TEST_EMAILS is empty, all free-plan users in non-production can use the bypass.
- API_KEY_BYPASS_MAX_ACTIVE_KEYS defaults to 5 if not set.
- The application hard-blocks this bypass in production deployments.
- Never set ALLOW_FREE_PLAN_API_KEYS_IN_NON_PROD in production.

## Security Best Practices

1. **Never commit `.env.local` to version control**
2. **Use different keys for development and production**
3. **Rotate secrets regularly**
4. **Use environment-specific configurations**
5. **Keep private keys secure and never expose them**

## Getting API Keys

### Flutterwave

1. Sign up at [Flutterwave](https://flutterwave.com)
2. Go to Settings > API Keys
3. Copy your public and secret keys

### Infura (for Ethereum)

1. Sign up at [Infura](https://infura.io)
2. Create a new project
3. Copy the project ID for your RPC URL

### AWS S3

1. Sign up at [AWS](https://aws.amazon.com)
2. Create an IAM user with S3 permissions
3. Generate access keys

## Troubleshooting

### Common Issues

1. **MetaMask Connection Errors**: Set `MOCK_BLOCKCHAIN=true` for development
2. **Payment Gateway Errors**: Ensure you're using test keys for development
3. **Database Connection Issues**: Check your DATABASE_URL format
4. **CORS Errors**: Add your domain to CORS_ORIGINS

### Environment Variable Loading

Next.js loads environment variables in this order:

1. `.env.local` (always loaded, ignored by git)
2. `.env.development` or `.env.production`
3. `.env`

## Support

If you need help setting up environment variables, please:

1. Check this documentation first
2. Review the `.env.example` file
3. Contact the development team
