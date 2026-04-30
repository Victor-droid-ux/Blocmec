# Blockmec QR - Complete Task List for Freelance Developer

## 📋 Task Organization

Tasks are organized by priority:
- 🔴 **Critical** - Must be completed first
- 🟡 **Important** - Required for production
- 🟢 **Nice to Have** - Post-launch improvements

---

## PHASE 1: Backend Setup & Database (Week 1-2)

### 🔴 Task 1.1: Database Setup
**Estimated Time:** 6-8 hours

**Requirements:**
- Set up PostgreSQL database (Neon or Supabase recommended)
- Create database schema for all tables
- Set up database migrations
- Configure connection pooling

**Tables to Create:**
\`\`\`sql
- users (id, email, password_hash, name, role, created_at, updated_at)
- qr_codes (id, user_id, token_id, data, type, status, created_at)
- batches (id, user_id, name, type, count, status, created_at)
- verifications (id, qr_code_id, ip_address, location, timestamp, status)
- transactions (id, user_id, amount, type, status, reference, created_at)
- api_keys (id, user_id, key, permissions, expires_at, created_at)
- api_credits (id, user_id, credits, used, purchased_at)
\`\`\`

**Deliverables:**
- [ ] Database hosted and accessible
- [ ] Schema migration files in `/prisma` or `/drizzle`
- [ ] Connection string in environment variables
- [ ] Seed data for testing

**Acceptance Criteria:**
- Database accessible from application
- All tables created with proper relationships
- Seed data loads successfully
- Connection pooling configured

---

### 🔴 Task 1.2: Authentication System
**Estimated Time:** 10-12 hours

**Requirements:**
- Implement JWT-based authentication
- Replace localStorage auth with secure tokens
- Add password hashing (bcrypt)
- Implement refresh token mechanism
- Add email verification flow

**Files to Create/Modify:**
\`\`\`
/lib/auth.ts - Authentication utilities
/lib/jwt.ts - JWT token management
/app/api/auth/register/route.ts
/app/api/auth/login/route.ts
/app/api/auth/logout/route.ts
/app/api/auth/verify-email/route.ts
/app/api/auth/refresh/route.ts
/middleware.ts - Auth middleware
\`\`\`

**Deliverables:**
- [ ] User registration with email verification
- [ ] Secure login/logout flow
- [ ] JWT token management
- [ ] Protected API routes
- [ ] Session management

**Acceptance Criteria:**
- Users can register and receive verification email
- Login returns JWT tokens
- Protected routes require valid token
- Tokens expire and refresh properly
- Passwords are hashed securely

---

### 🔴 Task 1.3: Core API Endpoints
**Estimated Time:** 12-15 hours

**Create the following API routes:**

**User Management:**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update profile
- `PUT /api/user/password` - Change password

**QR Code Management:**
- `POST /api/qr/generate` - Generate single QR code
- `POST /api/qr/batch` - Generate batch of QR codes
- `GET /api/qr/:id` - Get QR code details
- `GET /api/qr/user/:userId` - Get user's QR codes
- `DELETE /api/qr/:id` - Delete QR code

**Batch Management:**
- `POST /api/batch/create` - Create batch file
- `GET /api/batch/:id` - Get batch details
- `GET /api/batch/user/:userId` - Get user's batches
- `DELETE /api/batch/:id` - Delete batch

**Verification:**
- `POST /api/verify` - Verify QR code
- `GET /api/verify/:tokenId` - Get verification history
- `GET /api/analytics/verifications` - Get verification analytics

**Deliverables:**
- [ ] All API endpoints implemented
- [ ] Request validation using Zod
- [ ] Error handling middleware
- [ ] API response standardization
- [ ] API documentation (Swagger/OpenAPI)

**Acceptance Criteria:**
- All endpoints work with real database
- Proper error messages returned
- Authentication required for protected routes
- Request validation prevents invalid data
- Response format is consistent

---

### 🔴 Task 1.4: File Upload & Storage
**Estimated Time:** 8-10 hours

**Requirements:**
- Set up AWS S3 or Cloudinary
- Implement file upload API
- Add image optimization
- Handle file validation

**Implementation:**
\`\`\`typescript
- AWS S3 bucket setup
- Image upload to S3
- Generate signed URLs
- Image compression (sharp)
- File type validation
- Size limits (10MB max)
\`\`\`

**Deliverables:**
- [ ] File upload API endpoint
- [ ] Image storage in S3/Cloudinary
- [ ] Image optimization pipeline
- [ ] Secure file access URLs
- [ ] File deletion capability

**Acceptance Criteria:**
- Images upload successfully
- Images are optimized (compressed)
- Only allowed file types accepted
- Files stored in cloud storage
- Old files can be deleted

---

## PHASE 2: Blockchain Integration (Week 2-3)

### 🔴 Task 2.1: Smart Contract Development
**Estimated Time:** 15-20 hours

**Requirements:**
- Write Solidity smart contract for QR minting
- Add verification functions
- Implement access control
- Add event logging

**Smart Contract Functions Needed:**
```solidity
- mintQR(tokenId, metadata, scanLimit)
- verifyQR(tokenId)
- getQRData(tokenId)
- updateScanCount(tokenId)
- transferOwnership(tokenId, newOwner)
- pause() / unpause()
