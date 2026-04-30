# Blockmec QR - Production Deployment Guide

## Prerequisites

Before deployment, ensure you have:
- ✅ Vercel account with access
- ✅ GitHub repository access
- ✅ PostgreSQL database (Neon/Supabase)
- ✅ AWS account (for S3)
- ✅ SendGrid account
- ✅ Flutterwave account
- ✅ Domain name (blockmec.org)
- ✅ SSL certificate (handled by Vercel)

---

## Step 1: Environment Setup

### 1.1 Create Production Database

**Using Neon:**
\`\`\`bash
# Sign up at https://neon.tech
# Create new project: "blockmec-production"
# Copy connection string
\`\`\`

**Using Supabase:**
\`\`\`bash
# Sign up at https://supabase.com
# Create new project: "blockmec-production"
# Go to Settings > Database
# Copy connection string
\`\`\`

### 1.2 Run Database Migrations

\`\`\`bash
# Install Prisma CLI
npm install -g prisma

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed initial data (if needed)
npx prisma db seed
\`\`\`

### 1.3 Set Up AWS S3

\`\`\`bash
# Create S3 bucket: "blockmec-qr-codes"
# Enable versioning
# Set CORS policy:
\`\`\`

\`\`\`json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["https://blockmec.org"],
    "ExposeHeaders": ["ETag"]
  }
]
\`\`\`

### 1.4 Configure SendGrid

\`\`\`bash
# Create SendGrid account
# Create API key with "Mail Send" permissions
# Set up sender authentication
# Create email templates
\`\`\`

### 1.5 Deploy Smart Contract

\`\`\`bash
# Navigate to contracts directory
cd contracts

# Install dependencies
npm install

# Create .env file
echo "PRIVATE_KEY=your_private_key" > .env
echo "RPC_URL=https://polygon-rpc.com" >> .env

# Compile contract
npx hardhat compile

# Deploy to Polygon mainnet
npx hardhat run scripts/deploy.js --network polygon

# Verify contract on PolygonScan
npx hardhat verify --network polygon CONTRACT_ADDRESS

# Save contract address
\`\`\`

---

## Step 2: Vercel Deployment

### 2.1 Connect GitHub Repository

\`\`\`bash
# 1. Go to Vercel Dashboard
# 2. Click "Add New Project"
# 3. Import GitHub repository
# 4. Select "blockmec-qr" repository
\`\`\`

### 2.2 Configure Build Settings

\`\`\`
Framework Preset: Next.js
Build Command: npm run build
Output Directory: .next
Install Command: npm install
Node Version: 18.x
\`\`\`

### 2.3 Add Environment Variables

Go to **Settings > Environment Variables** and add:

\`\`\`env
# Application
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://blockmec.org
NEXT_PUBLIC_API_URL=https://blockmec.org/api

# Database
DATABASE_URL=postgresql://...
POSTGRES_PRISMA_URL=postgresql://...

# Redis (from Upstash)
REDIS_URL=redis://...

# Authentication
JWT_SECRET=generate-with-openssl-rand-base64-32
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=generate-with-openssl-rand-base64-32
REFRESH_TOKEN_EXPIRES_IN=7d

# Blockchain
NEXT_PUBLIC_RPC_URL=https://polygon-rpc.com
PRIVATE_KEY=your_wallet_private_key
BLOCKMEC_CONTRACT_ADDRESS=0x... (from deployment)
NEXT_PUBLIC_CHAIN_ID=137

# AWS S3
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=blockmec-qr-codes

# SendGrid
SENDGRID_API_KEY=SG.your_api_key
EMAIL_FROM=noreply@blockmec.org

# Flutterwave
NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_your_key
FLUTTERWAVE_SECRET_KEY=FLWSECK_your_key
FLUTTERWAVE_ENCRYPTION_KEY=FLWSECK_your_key
FLUTTERWAVE_WEBHOOK_SECRET=generate_secret

# BLC Crypto
NEXT_PUBLIC_BLC_WALLET_ADDRESS=BLM7F5EB5bB5cF88cfcEe9613368636f458800e62CB

# Security
ALLOWED_ORIGINS=https://blockmec.org
RATE_LIMIT_MAX=100

# Monitoring
SENTRY_DSN=https://your_sentry_dsn
NEXT_PUBLIC_GA_TRACKING_ID=G-XXXXXXXXXX

# Feature Flags
ENABLE_BLOCKCHAIN=true
ENABLE_PAYMENTS=true
MAINTENANCE_MODE=false
\`\`\`

### 2.4 Deploy

\`\`\`bash
# Click "Deploy"
# Wait for build to complete
# Check deployment logs for errors
\`\`\`

---

## Step 3: Custom Domain Setup

### 3.1 Add Domain to Vercel

\`\`\`bash
# 1. Go to Project Settings > Domains
# 2. Add domain: blockmec.org
# 3. Add domain: www.blockmec.org
\`\`\`

### 3.2 Configure DNS

Add these records to your domain registrar:

\`\`\`
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
\`\`\`

### 3.3 Verify SSL Certificate

\`\`\`bash
# Vercel automatically provisions SSL
# Wait 24-48 hours for DNS propagation
# Verify HTTPS is working
\`\`\`

---

## Step 4: Configure External Services

### 4.1 Set Up Flutterwave Webhooks

\`\`\`bash
# 1. Go to Flutterwave Dashboard
# 2. Settings > Webhooks
# 3. Add webhook URL: https://blockmec.org/api/webhooks/flutterwave
# 4. Select events: "charge.completed"
# 5. Save webhook secret to environment variables
\`\`\`

### 4.2 Configure SendGrid Domain Authentication

\`\`\`bash
# 1. Go to SendGrid Settings > Sender Authentication
# 2. Authenticate Domain: blockmec.org
# 3. Add DNS records provided by SendGrid
# 4. Verify domain
\`\`\`

### 4.3 Set Up Google Analytics

\`\`\`bash
# 1. Create GA4 property
# 2. Get Measurement ID
# 3. Add to environment variables
\`\`\`

### 4.4 Configure Sentry

\`\`\`bash
# 1. Create Sentry project
# 2. Get DSN
# 3. Add to environment variables
# 4. Install Sentry SDK in project
\`\`\`

---

## Step 5: Post-Deployment Verification

### 5.1 Smoke Tests

\`\`\`bash
# Test user registration
curl -X POST https://blockmec.org/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","name":"Test User"}'

# Test QR generation
curl -X POST https://blockmec.org/api/qr/generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"productType":"electronics","productName":"Test Product"}'

# Test verification
curl https://blockmec.org/api/verify?tokenId=TEST_TOKEN
\`\`\`

### 5.2 Check Monitoring

\`\`\`bash
# Verify Sentry is receiving errors
# Check Google Analytics real-time data
# Test SendGrid email delivery
# Verify S3 file uploads
\`\`\`

### 5.3 Performance Tests

\`\`\`bash
# Install artillery for load testing
npm install -g artillery

# Run load test
artillery quick --count 10 -n 100 https://blockmec.org/api/health
\`\`\`

### 5.4 Security Scan

\`\`\`bash
# Run security headers check
curl -I https://blockmec.org

# Verify SSL certificate
openssl s_client -connect blockmec.org:443

# Check for vulnerabilities
npm audit --production
\`\`\`

---

## Step 6: Continuous Deployment

### 6.1 GitHub Actions Setup

Create `.github/workflows/deploy.yml`:

\`\`\`yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Build
        run: npm run build
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
\`\`\`

### 6.2 Branch Protection

\`\`\`bash
# 1. Go to GitHub repository settings
# 2. Branches > Add rule
# 3. Branch name pattern: main
# 4. Enable:
#    - Require pull request reviews
#    - Require status checks to pass
#    - Require branches to be up to date
\`\`\`

---

## Step 7: Backup & Recovery Setup

### 7.1 Database Backups

**For Neon:**
\`\`\`bash
# Automatic backups enabled by default
# Configure retention: 30 days
# Set up point-in-time recovery
\`\`\`

**For Supabase:**
\`\`\`bash
# Enable automatic backups in dashboard
# Configure backup schedule: Daily at 2 AM UTC
\`\`\`

### 7.2 File Backups

\`\`\`bash
# Enable S3 versioning
aws s3api put-bucket-versioning \
  --bucket blockmec-qr-codes \
  --versioning-configuration Status=Enabled

# Set up lifecycle policy
# Retain versions for 90 days
\`\`\`

### 7.3 Disaster Recovery Plan

Create `DISASTER_RECOVERY.md` with:
- RTO: 4 hours
- RPO: 1 hour
- Recovery procedures
- Contact information
- Escalation process

---

## Step 8: Monitoring & Alerts

### 8.1 Set Up Uptime Monitoring

\`\`\`bash
# Use UptimeRobot or similar
# Monitor endpoints:
# - https://blockmec.org
# - https://blockmec.org/api/health
# - https://blockmec.org/dashboard

# Alert contacts:
# - Email: admin@blockmec.org
# - SMS: +234...
\`\`\`

### 8.2 Configure Sentry Alerts

\`\`\`bash
# Alert on:
# - Error rate > 1%
# - Response time > 1s
# - Failed API calls
# - Payment errors
\`\`\`

### 8.3 Set Up LogDNA/DataDog

\`\`\`bash
# Aggregate logs from:
# - Vercel function logs
# - Database logs
# - Application logs
# - Security logs
\`\`\`

---

## Step 9: Documentation & Training

### 9.1 Create Runbooks

Document procedures for:
- Deployment rollback
- Database restore
- Security incident response
- Payment issue resolution
- API key rotation

### 9.2 User Documentation

Create help center with:
- Getting started guide
- QR generation tutorial
- API documentation
- Troubleshooting guide
- FAQ

### 9.3 Admin Training

Provide training on:
- Dashboard navigation
- User management
- Analytics interpretation
- Payment handling
- Security monitoring

---

## Step 10: Go-Live Checklist

### Pre-Launch

- [ ] All tests passing
- [ ] Database migrated
- [ ] Environment variables set
- [ ] Smart contract deployed
- [ ] Domain configured
- [ ] SSL certificate active
- [ ] Email service working
- [ ] Payment gateway tested
- [ ] Monitoring configured
- [ ] Backups enabled
- [ ] Security scan passed
- [ ] Load testing completed
- [ ] Documentation complete

### Launch Day

- [ ] Announce maintenance window
- [ ] Deploy to production
- [ ] Verify all features
- [ ] Test payment flows
- [ ] Monitor error rates
- [ ] Check performance
- [ ] Verify email delivery
- [ ] Test API endpoints
- [ ] Check analytics
- [ ] Monitor user feedback

### Post-Launch

- [ ] Monitor for 24 hours
- [ ] Address any issues
- [ ] Collect user feedback
- [ ] Performance tuning
- [ ] Security review
- [ ] Documentation updates
- [ ] Team retrospective

---

## Troubleshooting

### Deployment Fails

\`\`\`bash
# Check build logs in Vercel
# Verify environment variables
# Test build locally:
npm run build

# Check for missing dependencies
npm install
\`\`\`

### Database Connection Issues

\`\`\`bash
# Test connection string
npx prisma db push

# Check firewall rules
# Verify SSL mode
# Check connection limits
\`\`\`

### Email Not Sending

\`\`\`bash
# Verify SendGrid API key
# Check sender authentication
# Review email logs
# Test with SendGrid dashboard
\`\`\`

### Payment Failures

\`\`\`bash
# Check Flutterwave credentials
# Verify webhook endpoint
# Review transaction logs
# Test in Flutterwave dashboard
\`\`\`

---

## Rollback Procedure

If critical issues occur:

\`\`\`bash
# 1. Go to Vercel Dashboard
# 2. Select project
# 3. Go to Deployments
# 4. Find last stable deployment
# 5. Click "..." > "Promote to Production"
# 6. Verify rollback successful
# 7. Investigate issue
# 8. Fix and redeploy
\`\`\`

---

## Support & Maintenance

### Regular Maintenance Tasks

**Daily:**
- Monitor error logs
- Check payment processing
- Review user feedback
- Verify backups

**Weekly:**
- Security updates
- Performance review
- Database optimization
- User analytics review

**Monthly:**
- Security audit
- Cost optimization
- Feature planning
- Documentation updates

---

## Emergency Contacts

**Technical Issues:**
- Developer: [Contact Info]
- DevOps: [Contact Info]
- Database: [Contact Info]

**Business Issues:**
- Product Owner: [Contact Info]
- Customer Support: [Contact Info]

**External Services:**
- Vercel Support: vercel.com/support
- Neon Support: neon.tech/docs/support
- SendGrid Support: sendgrid.com/support
- Flutterwave Support: flutterwave.com/support

---

**Document Version:** 1.0  
**Last Updated:** January 2024  
**Next Review:** February 2024
