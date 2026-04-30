# Blockmec Chain - Environment Setup Instructions

## ✅ Environment Variables Setup Complete

Your `.env.local` file has been created with development-friendly values. Here's what's configured:

### 🔧 Current Configuration

- **Environment**: Development mode
- **Blockchain**: Mock mode enabled (no MetaMask required)
- **Database**: Local SQLite file
- **Payments**: Test keys configured
- **Debug**: Enabled for development

### 🚀 Next Steps

1. **Start the application**:
   \`\`\`bash
   npm run dev

   # or

   yarn dev
   \`\`\`

2. **Access the application**:
   - Main app: http://localhost:3000
   - Dashboard: http://localhost:3000/dashboard
   - Admin panel: http://localhost:3000/admin-panel

3. **Test credentials**:
   - **User login**: user@blockmec.org / userpass
   - **Admin login**: info@blockmec.org / Akachukwu1@1

### 🔄 For Production Deployment

When ready for production, update these values in your hosting platform:

1. **Blockchain Configuration**:
   - Get a real Infura project ID
   - Use a secure private key
   - Deploy your smart contract and update the address

2. **Payment Configuration**:
   - Get production Flutterwave keys
   - Update BLC wallet address

3. **Security**:
   - Generate secure random secrets (32+ characters)
   - Use environment-specific encryption keys

4. **Database**:
   - Set up PostgreSQL or your preferred database
   - Update DATABASE_URL

5. **Test-only API key bypass**:
   - Do not enable the free-plan API key bypass in production.
   - Ensure ALLOW_FREE_PLAN_API_KEYS_IN_NON_PROD is not set, or set to false, in production.

### Staging and Development: Free-plan API key test bypass

If you need test users on free plans to create API keys in staging/dev, set:

\`\`\`env
ALLOW_FREE_PLAN_API_KEYS_IN_NON_PROD=true
API_KEY_BYPASS_TEST_EMAILS=tester1@example.com,tester2@example.com
API_KEY_BYPASS_MAX_ACTIVE_KEYS=5
\`\`\`

Behavior:

- Bypass is allowed only in non-production environments.
- If API_KEY_BYPASS_TEST_EMAILS is omitted, bypass applies to all free-plan users in non-production.
- API_KEY_BYPASS_MAX_ACTIVE_KEYS defaults to 5.
- Production deployments ignore this bypass.

### 🛠️ Environment Validation

The application includes environment variable validation:

- Invalid or missing required variables will show clear error messages
- Type checking ensures correct formats
- Development vs production configurations are handled automatically

### 🔍 Troubleshooting

If you encounter issues:

1. **MetaMask errors**: Ensure `MOCK_BLOCKCHAIN=true` is set
2. **Payment errors**: Verify Flutterwave test keys are correct
3. **Database errors**: Check DATABASE_URL format
4. **CORS errors**: Ensure CORS_ORIGINS includes your domain

### 📝 Customization

You can modify `.env.local` to:

- Change API endpoints
- Enable/disable features
- Adjust rate limits
- Configure file upload settings
- Set custom QR code parameters

The application will automatically reload when you change environment variables.
