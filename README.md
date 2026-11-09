# Blockmec QR Code Platform

A secure, scalable QR code generation and verification platform built with Next.js, Prisma, and PostgreSQL.

## Features

- **QR Code Generation**: Create unlimited QR codes with customizable metadata
- **Verification System**: Track and verify QR code scans with detailed analytics
- **Multi-tenant API**: Secure API with rate limiting and credit-based usage
- **Admin Dashboard**: Manage users, batches, and monitor system health
- **Webhook Support**: Real-time event notifications for QR generation and verification
- **Data Privacy**: IP/UA redaction policies with automatic retention management
- **On-demand QR Images**: Generate images on-request to minimize database bloat

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Supabase account (for auth)
- Upstash Redis account (for caching/rate limiting)

### Installation

1. Clone and install:
```bash
npm install
```

2. Set up environment variables (see [Environment Variables](#environment-variables))

3. Set up database:
```bash
npm run db:push
```

4. Start development server:
```bash
npm run dev
```

Visit `http://localhost:3000`

### Environment Variables

**Required:**
```
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx

DATABASE_URL=postgresql://user:pass@host/db
DIRECT_URL=postgresql://user:pass@host/db

UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx

SUPABASE_JWT_SECRET=xxx
```

**Optional:**
```
NEXT_PUBLIC_BLOCKCHAIN_ENABLED=true
NEXT_PUBLIC_VERIFY_PAGE_URL=https://verify.yourdomain.com
```

See `.env.example` for full list.

## API Documentation

### Base URL
All API endpoints use the base URL: `https://yourdomain.com/api`

### Authentication

**Session-based** (for web dashboard):
- Use Supabase auth session

**API Key** (for programmatic access):
- Pass `X-API-Key` header with your API key
- Obtain keys in dashboard at `/api-keys`

### Endpoints

#### QR Code Generation

**POST** `/generate-qr`

Generate QR codes for a batch.

```json
{
  "productName": "Warranty Certificate",
  "productType": "warranty",
  "quantity": 100,
  "scanLimit": 5,
  "expiryDays": 365,
  "description": "2-year warranty",
  "metadata": {
    "sku": "PROD-123"
  }
}
```

Response:
```json
{
  "success": true,
  "batchId": "550e8400-e29b-41d4-a716-446655440000",
  "quantity": 100,
  "productName": "Warranty Certificate",
  "productType": "warranty"
}
```

#### QR Code Verification

**POST** `/verify-qr`

Verify a QR code scan.

```json
{
  "tokenId": "token-uuid-here"
}
```

Response:
```json
{
  "success": true,
  "productName": "Warranty Certificate",
  "productType": "warranty",
  "scanCount": 3,
  "isValid": true,
  "lastScanned": "2026-11-09T02:00:00Z"
}
```

#### Get QR Image (On-demand)

**GET** `/qr/image/[tokenId]`

Get QR code image as PNG. Images are generated on-demand and cached for 24 hours.

```bash
curl https://yourdomain.com/api/qr/image/token-uuid-here -o qr.png
```

Response: PNG image with `Cache-Control: public, max-age=86400`

#### User Credits

**GET** `/user/credits`

Get current credit balance.

Response:
```json
{
  "credits": 5000,
  "used": 1250,
  "plan": "professional"
}
```

**POST** `/user/credits`

Purchase additional credits.

```json
{
  "quantity": 1000,
  "paymentMethod": "flutterwave"
}
```

#### User Batches

**GET** `/user/batches`

List all QR code batches for the user.

Query parameters:
- `limit` (default: 50)
- `offset` (default: 0)
- `status` (active, completed, archived)

#### User Settings

**GET** `/user/settings`

**PUT** `/user/settings`

Update verification domain, privacy settings, etc.

```json
{
  "verification_domain": "https://verify.mycompany.com"
}
```

### Rate Limiting

Rate limits vary by plan:

- **Free**: 10 requests/min, 100 QR codes/day
- **Professional**: 100 requests/min, 10k QR codes/day
- **Enterprise**: Custom limits

When rate limited, API returns:
```json
{
  "error": "Rate limit exceeded",
  "retryAfter": 60
}
```
Status code: `429`

### Error Handling

All errors return JSON with `error` and optional `code`:

```json
{
  "error": "Insufficient API credits",
  "code": "INSUFFICIENT_CREDITS"
}
```

Common error codes:
- `UNAUTHORIZED` - Missing or invalid auth
- `INSUFFICIENT_CREDITS` - Not enough credits for operation
- `CATEGORY_NOT_ALLOWED` - QR category not allowed for your account
- `RATE_LIMITED` - Rate limit exceeded
- `INVALID_VERIFICATION_DOMAIN` - Domain mismatch

## Deployment

### Environment Setup

1. Create `.env.local` with all required variables (see Environment Variables section)
2. For production, use environment secrets management (Vercel, AWS Secrets Manager, etc.)

### Database Migrations

Run migrations before deployment:

```bash
npm run db:deploy
```

### Build & Test

```bash
npm run build
npm run lint
```

### Deployment Targets

**Vercel** (recommended):
```bash
vercel deploy
```

**Docker**:
```bash
docker build -t blockmec-qr .
docker run -e DATABASE_URL=... blockmec-qr
```

**Traditional Node Server**:
```bash
npm run build
npm start
```

## Credential Rotation

### API Keys

1. Generate new API key in dashboard
2. Update application configuration with new key
3. Wait 24 hours, then delete old key

### Database

1. Create new Postgres user with same permissions
2. Update `DATABASE_URL` and `DIRECT_URL` environment variables
3. Test connection
4. Delete old user

### Supabase JWT

1. Rotate signing key in Supabase dashboard
2. Redeploy application with new `SUPABASE_JWT_SECRET`
3. Sessions auto-expire, users will re-authenticate

### Redis

1. Create new Upstash database
2. Update `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`
3. Deploy update

## Architecture

### Tech Stack

- **Frontend**: React 19, Next.js 15, Tailwind CSS
- **Backend**: Next.js API routes, TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Upstash Redis
- **Auth**: Supabase
- **QR Generation**: qrcode library (server-side)

### Database Schema

Key tables:
- `User` - User accounts and subscription info
- `QrCode` - Individual QR codes with metadata
- `Batch` - Batch generation records
- `Verification` - QR verification scan records
- `WebhookEndpoint` - User webhook subscriptions
- `WebhookEvent` - Event queue for webhook delivery
- `ApiKey` - API credentials for programmatic access

### Security Features

- Rate limiting (per-user, per-plan)
- API key hashing (SHA-256)
- Credit deduction in atomic transactions
- IP/UA redaction after 30 days
- CORS protection
- CSRF tokens on forms
- Input validation with Zod

## Monitoring

Check dashboard at `/admin-panel` for:
- Real-time verification analytics
- Webhook delivery status
- System health metrics
- User activity logs

## Support & Contributing

For issues, please create a GitHub issue.

For security vulnerabilities, please email security@blockmec.com

## License

MIT
