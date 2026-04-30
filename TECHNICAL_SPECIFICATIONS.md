# Blockmec QR - Technical Specifications

## System Architecture

### High-Level Architecture
\`\`\`
┌─────────────────┐
│   Client Apps   │ (Web Browser, Mobile)
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│   Next.js App   │ (Frontend + API Routes)
│   (Vercel)      │
└────────┬────────┘
         │
    ┌────┴────────────────────────┐
    │                             │
    ↓                             ↓
┌─────────────┐         ┌─────────────────┐
│  PostgreSQL │         │   Blockchain    │
│  (Database) │         │  (Polygon/BSC)  │
└─────────────┘         └─────────────────┘
         │                       │
         ↓                       ↓
┌─────────────┐         ┌─────────────────┐
│  AWS S3     │         │   Redis Cache   │
│  (Storage)  │         │                 │
└─────────────┘         └─────────────────┘
         │
         ↓
┌─────────────┐
│  SendGrid   │
│  (Email)    │
└─────────────┘
\`\`\`

---

## Database Schema

### Users Table
\`\`\`sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user', -- 'user', 'admin', 'developer'
    api_credits INTEGER DEFAULT 0,
    subscription_plan VARCHAR(100) DEFAULT 'free',
    email_verified BOOLEAN DEFAULT false,
    verification_token VARCHAR(255),
    reset_token VARCHAR(255),
    reset_token_expires TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
\`\`\`

### QR Codes Table
\`\`\`sql
CREATE TABLE qr_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token_id VARCHAR(255) UNIQUE NOT NULL,
    batch_id UUID REFERENCES batches(id) ON DELETE SET NULL,
    product_type VARCHAR(100) NOT NULL,
    product_name VARCHAR(255),
    qr_data TEXT NOT NULL,
    qr_image_url TEXT,
    blockchain_tx_hash VARCHAR(255),
    blockchain_token_id VARCHAR(255),
    metadata JSONB,
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'inactive', 'expired'
    scan_limit INTEGER DEFAULT 0, -- 0 = unlimited
    scan_count INTEGER DEFAULT 0,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_qr_codes_user_id ON qr_codes(user_id);
CREATE INDEX idx_qr_codes_token_id ON qr_codes(token_id);
CREATE INDEX idx_qr_codes_batch_id ON qr_codes(batch_id);
\`\`\`

### Batches Table
\`\`\`sql
CREATE TABLE batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    product_type VARCHAR(100) NOT NULL,
    batch_number VARCHAR(255),
    total_count INTEGER NOT NULL,
    generated_count INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_batches_user_id ON batches(user_id);
\`\`\`

### Verifications Table
\`\`\`sql
CREATE TABLE verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    qr_code_id UUID REFERENCES qr_codes(id) ON DELETE CASCADE,
    token_id VARCHAR(255) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    location_country VARCHAR(100),
    location_city VARCHAR(255),
    location_coordinates POINT,
    device_type VARCHAR(50),
    status VARCHAR(50) NOT NULL, -- 'verified', 'failed', 'expired', 'counterfeit'
    verification_method VARCHAR(50), -- 'qr_scan', 'api', 'manual'
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_verifications_qr_code_id ON verifications(qr_code_id);
CREATE INDEX idx_verifications_token_id ON verifications(token_id);
CREATE INDEX idx_verifications_created_at ON verifications(created_at DESC);
\`\`\`

### Transactions Table
\`\`\`sql
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL, -- 'credit_purchase', 'subscription', 'refund'
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    status VARCHAR(50) NOT NULL, -- 'pending', 'completed', 'failed', 'refunded'
    payment_method VARCHAR(50), -- 'flutterwave', 'card', 'crypto'
    payment_provider_id VARCHAR(255),
    transaction_reference VARCHAR(255) UNIQUE,
    credits_added INTEGER DEFAULT 0,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_reference ON transactions(transaction_reference);
\`\`\`

### API Keys Table
\`\`\`sql
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    key_hash VARCHAR(255) UNIQUE NOT NULL,
    key_prefix VARCHAR(50) NOT NULL, -- First 8 chars for display
    name VARCHAR(255),
    permissions JSONB DEFAULT '{"read": true, "write": true, "verify": true}',
    last_used_at TIMESTAMP,
    expires_at TIMESTAMP,
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'revoked', 'expired'
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);
\`\`\`

### Audit Logs Table
\`\`\`sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100),
    resource_id UUID,
    ip_address INET,
    user_agent TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
\`\`\`

---

## API Endpoints Specification

### Authentication Endpoints

#### POST /api/auth/register
**Request:**
\`\`\`json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "name": "John Doe"
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "message": "Registration successful. Please check your email to verify your account.",
  "data": {
    "userId": "uuid",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
\`\`\`

#### POST /api/auth/login
**Request:**
\`\`\`json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "user",
      "apiCredits": 1000
    }
  }
}
\`\`\`

---

### QR Code Endpoints

#### POST /api/qr/generate
**Headers:**
\`\`\`
Authorization: Bearer <access_token>
\`\`\`

**Request:**
\`\`\`json
{
  "productType": "electronics",
  "productName": "iPhone 15 Pro",
  "metadata": {
    "model": "A3108",
    "serialNumber": "SERIAL123",
    "manufacturer": "Apple Inc."
  },
  "scanLimit": 100,
  "expiryDays": 365
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "data": {
    "tokenId": "BM-2024-ABC123",
    "qrCodeUrl": "https://s3.amazonaws.com/blockmec/qr/...",
    "qrData": "encrypted_data_string",
    "blockchainTxHash": "0x1234...",
    "verificationUrl": "https://blockmec.org/verify/BM-2024-ABC123",
    "expiresAt": "2025-01-15T10:00:00Z"
  }
}
\`\`\`

#### POST /api/qr/batch
**Headers:**
\`\`\`
Authorization: Bearer <access_token>
\`\`\`

**Request:**
\`\`\`json
{
  "batchName": "Product Batch Jan 2024",
  "productType": "medicine",
  "count": 1000,
  "metadata": {
    "batchNumber": "BATCH-2024-001",
    "manufacturer": "PharmaCo Ltd",
    "expiryDate": "2026-01-01"
  }
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "data": {
    "batchId": "uuid",
    "totalCount": 1000,
    "status": "processing",
    "estimatedCompletionTime": "2024-01-15T10:30:00Z"
  }
}
\`\`\`

#### POST /api/verify
**Request:**
\`\`\`json
{
  "tokenId": "BM-2024-ABC123"
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "verified": true,
  "data": {
    "tokenId": "BM-2024-ABC123",
    "productName": "iPhone 15 Pro",
    "productType": "electronics",
    "manufacturer": "Apple Inc.",
    "metadata": {...},
    "scanCount": 5,
    "scanLimit": 100,
    "status": "active",
    "blockchainVerified": true,
    "blockchainTxHash": "0x1234...",
    "blockConfirmations": 1234,
    "verifiedAt": "2024-01-15T10:00:00Z"
  }
}
\`\`\`

---

## Smart Contract Specification

### Contract: BlockmecQR.sol

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract BlockmecQR is ERC721, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    struct QRData {
        string tokenId;
        string productType;
        string metadata;
        uint256 scanLimit;
        uint256 scanCount;
        uint256 createdAt;
        uint256 expiresAt;
        bool isActive;
    }

    mapping(uint256 => QRData) public qrCodes;
    mapping(string => uint256) public tokenIdToNftId;

    event QRMinted(
        uint256 indexed nftId,
        string tokenId,
        address indexed owner,
        uint256 timestamp
    );

    event QRVerified(
        uint256 indexed nftId,
        string tokenId,
        uint256 scanCount,
        uint256 timestamp
    );

    constructor() ERC721("BlockmecQR", "BMQ") {}

    function mintQR(
        address to,
        string memory tokenId,
        string memory productType,
        string memory metadata,
        uint256 scanLimit,
        uint256 expiryDuration
    ) public onlyOwner returns (uint256) {
        _tokenIds.increment();
        uint256 newNftId = _tokenIds.current();

        _safeMint(to, newNftId);

        qrCodes[newNftId] = QRData({
            tokenId: tokenId,
            productType: productType,
            metadata: metadata,
            scanLimit: scanLimit,
            scanCount: 0,
            createdAt: block.timestamp,
            expiresAt: block.timestamp + expiryDuration,
            isActive: true
        });

        tokenIdToNftId[tokenId] = newNftId;

        emit QRMinted(newNftId, tokenId, to, block.timestamp);

        return newNftId;
    }

    function verifyQR(string memory tokenId) public returns (bool) {
        uint256 nftId = tokenIdToNftId[tokenId];
        require(nftId > 0, "QR code not found");

        QRData storage qr = qrCodes[nftId];
        require(qr.isActive, "QR code is not active");
        require(
            qr.expiresAt == 0 || block.timestamp <= qr.expiresAt,
            "QR code has expired"
        );
        require(
            qr.scanLimit == 0 || qr.scanCount < qr.scanLimit,
            "Scan limit reached"
        );

        qr.scanCount++;

        emit QRVerified(nftId, tokenId, qr.scanCount, block.timestamp);

        return true;
    }

    function getQRData(string memory tokenId)
        public
        view
        returns (QRData memory)
    {
        uint256 nftId = tokenIdToNftId[tokenId];
        require(nftId > 0, "QR code not found");
        return qrCodes[nftId];
    }

    function deactivateQR(string memory tokenId) public onlyOwner {
        uint256 nftId = tokenIdToNftId[tokenId];
        require(nftId > 0, "QR code not found");
        qrCodes[nftId].isActive = false;
    }

    function getTotalQRs() public view returns (uint256) {
        return _tokenIds.current();
    }
}
