# Blockmec QR - Project Structure Guide

## Overview

This document explains the organization of the Blockmec QR codebase to help you navigate and understand where everything is located.

---

## Root Directory Structure

\`\`\`
blockmec-qr/
├── app/                      # Next.js 14 App Router
├── components/               # React components
├── lib/                      # Utility functions and configurations
├── public/                   # Static assets
├── prisma/                   # Database schema and migrations
├── contracts/                # Smart contracts (Solidity)
├── scripts/                  # Utility scripts
├── tests/                    # Test files
├── .github/                  # GitHub Actions workflows
├── .env.example              # Environment variables template
├── .env.local                # Local environment variables (gitignored)
├── next.config.mjs           # Next.js configuration
├── tailwind.config.ts        # Tailwind CSS configuration
├── tsconfig.json             # TypeScript configuration
├── package.json              # Dependencies and scripts
└── README.md                 # Project documentation
\`\`\`

---

## `/app` Directory (Next.js App Router)

\`\`\`
app/
├── layout.tsx                       # Root layout
├── page.tsx                         # Landing page (Login)
├── globals.css                      # Global styles
│
├── dashboard/                       # Dashboard pages
│   ├── page.tsx                     # Dashboard home
│   ├── layout.tsx                   # Dashboard layout
│   ├── loading.tsx                  # Loading state
│   │
│   ├── batch-files/                 # Batch management
│   │   ├── page.tsx                 # Batch files list
│   │   └── loading.tsx              # Loading state
│   │
│   ├── create-file/                 # Create batch
│   │   └── page.tsx                 # Create batch form
│   │
│   ├── developer/                   # Developer tools
│   │   ├── page.tsx                 # Developer dashboard
│   │   ├── loading.tsx              # Loading state
│   │   ├── blc-payment/             # BLC payment page
│   │   ├── card-payment/            # Card payment page
│   │   ├── flutterwave-payment/     # Flutterwave page
│   │   └── script-integration/      # Script integration
│   │
│   ├── profile/                     # User profile
│   │   ├── page.tsx                 # Profile page
│   │   └── loading.tsx              # Loading state
│   │
│   └── settings/                    # Settings page
│       ├── page.tsx                 # Settings form
│       └── loading.tsx              # Loading state
│
├── admin-panel/                     # Admin panel
│   ├── page.tsx                     # Admin dashboard
│   ├── layout.tsx                   # Admin layout
│   └── loading.tsx                  # Loading state
│
├── admin/                           # Admin routes
│   └── login/                       # Admin login
│       ├── page.tsx                 # Admin login form
│       └── loading.tsx              # Loading state
│
├── qr-verification/                 # QR verification
│   └── page.tsx                     # Verification page
│
├── verification-results/            # Verification results
│   ├── page.tsx                     # General results
│   └── loading.tsx                  # Loading state
│
├── verification-results-*/          # Product-specific results
│   ├── -id/                         # ID cards
│   ├── -passport/                   # Passports
│   ├── -documents/                  # Documents
│   ├── -medicine/                   # Medicine
│   ├── -electronics/                # Electronics
│   ├── -apparel/                    # Apparel
│   ├── -luxury-goods/               # Luxury goods
│   ├── -food-beverages/             # Food & beverages
│   ├── -artwork/                    # Artwork
│   ├── -tickets/                    # Tickets
│   ├── -cosmetics/                  # Cosmetics
│   ├── -automotive/                 # Automotive
│   ├── -toys/                       # Toys
│   ├── -books/                      # Books
│   └── -bank-checks/                # Bank checks
│
├── verify/                          # Verification routes
│   └── [tokenId]/                   # Dynamic verification
│       └── page.tsx                 # Verification page
│
└── api/                             # API routes
    ├── auth/                        # Authentication
    │   ├── register/                # User registration
    │   ├── login/                   # User login
    │   ├── logout/                  # User logout
    │   └── verify-email/            # Email verification
    │
    ├── qr/                          # QR code management
    │   ├── generate/                # Generate QR
    │   └── batch/                   # Batch generation
    │
    ├── verify/                      # Verification
    │   └── route.ts                 # Verify QR code
    │
    ├── verify-qr/                   # Verification API
    │   └── route.ts                 # QR verification
    │
    ├── admin/                       # Admin APIs
    │   ├── users/                   # User management
    │   └── logs/                    # System logs
    │
    ├── blockchain/                  # Blockchain APIs
    │   ├── mint/                    # Mint QR
    │   └── verify/                  # Verify on chain
    │
    ├── webhooks/                    # Webhook handlers
    │   └── flutterwave/             # Flutterwave webhooks
    │
    └── script/                      # Script integration
        └── api.js/                  # Integration script
            └── route.tsx            # Script route
\`\`\`

---

## `/components` Directory

\`\`\`
components/
├── ui/                              # shadcn/ui components
│   ├── button.tsx                   # Button component
│   ├── card.tsx                     # Card component
│   ├── input.tsx                    # Input component
│   ├── dialog.tsx                   # Dialog component
│   ├── dropdown-menu.tsx            # Dropdown menu
│   ├── select.tsx                   # Select component
│   ├── table.tsx                    # Table component
│   ├── tabs.tsx                     # Tabs component
│   ├── badge.tsx                    # Badge component
│   ├── avatar.tsx                   # Avatar component
│   ├── scroll-area.tsx              # Scroll area
│   ├── separator.tsx                # Separator
│   ├── switch.tsx                   # Switch component
│   ├── textarea.tsx                 # Textarea
│   ├── toast.tsx                    # Toast notification
│   ├── toaster.tsx                  # Toast container
│   ├── label.tsx                    # Label component
│   └── accordion.tsx                # Accordion
│
├── dashboard/                       # Dashboard components
│   ├── dashboard-shell.tsx          # Dashboard wrapper
│   ├── dashboard-header.tsx         # Dashboard header
│   ├── dashboard-nav.tsx            # Dashboard navigation
│   ├── sidebar.tsx                  # Sidebar component
│   ├── search.tsx                   # Search component
│   ├── user-nav.tsx                 # User navigation
│   ├── overview.tsx                 # Overview charts
│   ├── recent-sales.tsx             # Recent sales
│   ├── states-chart.tsx             # States chart
│   ├── countries-chart.tsx          # Countries chart
│   ├── regions-chart.tsx            # Regions chart
│   └── ai-data-analyst.tsx          # AI analyst component
│
├── admin/                           # Admin components
│   ├── admin-sidebar.tsx            # Admin sidebar
│   ├── admin-header.tsx             # Admin header
│   ├── admin-login-form.tsx         # Admin login form
│   ├── user-management.tsx          # User management
│   └── log-viewer.tsx               # Log viewer
│
├── verification/                    # Verification components
│   ├── verification-result.tsx      # Generic result
│   ├── id-verification-result.tsx   # ID verification
│   ├── passport-verification-result.tsx  # Passport
│   ├── documents-verification-result.tsx # Documents
│   ├── medicine-verification-result.tsx  # Medicine
│   ├── electronics-verification-result.tsx # Electronics
│   ├── apparel-verification-result.tsx   # Apparel
│   ├── luxury-goods-verification-result.tsx # Luxury
│   ├── food-beverages-verification-result.tsx # Food
│   ├── artwork-verification-result.tsx   # Artwork
│   ├── tickets-verification-result.tsx   # Tickets
│   ├── cosmetics-verification-result.tsx # Cosmetics
│   ├── automotive-verification-result.tsx # Automotive
│   ├── toys-verification-result.tsx      # Toys
│   ├── books-verification-result.tsx     # Books
│   ├── bank-checks-verification-result.tsx # Checks
│   └── generic-product-verification.tsx  # Generic
│
├── login-form.tsx                   # Login form
├── batch-file-details.tsx           # Batch details modal
├── image-upload.tsx                 # Image upload
├── qr-code-scanner.tsx              # QR scanner
├── qr-code-generator.tsx            # QR generator
├── verify-product-popup.tsx         # Verify popup
├── error-boundary.tsx               # Error boundary
├── mode-toggle.tsx                  # Dark mode toggle
└── theme-provider.tsx               # Theme provider
\`\`\`

---

## `/lib` Directory

\`\`\`
lib/
├── blockchain/                      # Blockchain utilities
│   ├── contract.ts                  # Contract interaction
│   ├── web3.ts                      # Web3 setup
│   └── wallet.ts                    # Wallet management
│
├── auth.ts                          # Authentication utilities
├── jwt.ts                           # JWT token management
├── utils.ts                         # General utilities
├── qr-generator.ts                  # QR generation
├── qr-verification.ts               # QR verification
├── env.ts                           # Environment validation
├── config.ts                        # App configuration
└── production-config.ts             # Production config
\`\`\`

---

## `/public` Directory

\`\`\`
public/
└── images/                          # Image assets
    ├── blockmec-logo.png            # Main logo
    ├── 1base-logo.png               # 1BASE logo
    ├── verification-banner.png      # Verification banner
    ├── ceo-akachukwu.jpg            # CEO photo
    ├── coca-cola-bottle.jpg         # Product image
    ├── coca-cola-bottle-new.jpg     # Product image
    ├── verification-design-reference.jpg # Design ref
    ├── id-card-sample.jpg           # ID card sample
    ├── passport-photo.jpg           # Passport sample
    ├── document-certificate.jpg     # Document sample
    ├── medicine-product.jpg         # Medicine sample
    ├── electronics-product.jpg      # Electronics sample
    ├── apparel-product.jpg          # Apparel sample
    ├── luxury-watch.jpg             # Luxury sample
    ├── food-beverage-product.jpg    # Food sample
    ├── artwork-painting.jpg         # Artwork sample
    ├── event-ticket.jpg             # Ticket sample
    ├── cosmetics-product.jpg        # Cosmetics sample
    ├── automotive-part.jpg          # Auto part sample
    ├── toy-product.jpg              # Toy sample
    ├── book-cover.jpg               # Book sample
    └── bank-check.jpg               # Check sample
\`\`\`

---

## `/prisma` Directory (To Be Created)

\`\`\`
prisma/
├── schema.prisma                    # Database schema
├── migrations/                      # Migration files
│   ├── 20240115_init/              # Initial migration
│   ├── 20240116_add_qr/            # QR codes table
│   └── 20240117_add_batches/       # Batches table
└── seed.ts                          # Seed data script
\`\`\`

---

## `/contracts` Directory (To Be Created)

\`\`\`
contracts/
├── BlockmecQR.sol                   # Main smart contract
├── interfaces/                      # Contract interfaces
├── libraries/                       # Shared libraries
└── test/                            # Contract tests
    └── BlockmecQR.test.js           # Test file
\`\`\`

---

## `/tests` Directory (To Be Created)

\`\`\`
tests/
├── unit/                            # Unit tests
│   ├── auth.test.ts                 # Auth tests
│   ├── qr-generator.test.ts         # QR generation tests
│   └── utils.test.ts                # Utility tests
│
├── integration/                     # Integration tests
│   ├── api/                         # API tests
│   │   ├── auth.test.ts             # Auth API tests
│   │   ├── qr.test.ts               # QR API tests
│   │   └── verify.test.ts           # Verify API tests
│   └── database/                    # Database tests
│
├── e2e/                             # End-to-end tests
│   ├── user-flow.spec.ts            # User flow tests
│   ├── qr-generation.spec.ts        # QR generation flow
│   └── verification.spec.ts         # Verification flow
│
└── fixtures/                        # Test fixtures
    ├── users.json                   # User fixtures
    └── qr-codes.json                # QR fixtures
\`\`\`

---

## Configuration Files

### `next.config.mjs`
\`\`\`javascript
// Next.js configuration
// - Environment variables
// - Image domains
// - Webpack config
// - API rewrites
\`\`\`

### `tailwind.config.ts`
\`\`\`typescript
// Tailwind CSS configuration
// - Theme colors
// - Fonts
// - Plugins (shadcn)
// - Custom utilities
\`\`\`

### `tsconfig.json`
\`\`\`json
// TypeScript configuration
// - Path aliases (@/)
// - Compiler options
// - Include/exclude patterns
\`\`\`

### `package.json`
\`\`\`json
// Project dependencies
// Scripts:
// - dev: Development server
// - build: Production build
// - start: Production server
// - lint: ESLint
// - test: Run tests
\`\`\`

### `.env.example`
\`\`\`env
// Environment variables template
// Copy to .env.local for development
\`\`\`

---

## Key File Descriptions

### `app/layout.tsx`
Root layout component that wraps all pages. Includes:
- Global styles
- Theme provider
- Toast notifications
- Font configuration

### `app/dashboard/page.tsx`
Main dashboard page showing:
- Analytics overview
- Recent activity
- Quick actions
- Charts and graphs

### `components/dashboard/ai-data-analyst.tsx`
Advanced SQL query interface with:
- Query editor
- Multiple visualization options
- Export functionality
- AI insights

### `lib/blockchain/contract.ts`
Blockchain interaction utilities:
- Contract initialization
- QR minting functions
- Verification functions
- Transaction handling

### `lib/qr-generator.ts`
QR code generation utilities:
- QR code creation
- Image generation
- Banner integration
- Data encryption

### `app/api/verify-qr/route.ts`
API endpoint for QR verification:
- Validates QR data
- Checks blockchain
- Updates scan count
- Returns verification result

---

## Important Patterns

### 1. File Naming
- Pages: `page.tsx`
- Layouts: `layout.tsx`
- Loading: `loading.tsx`
- Components: `kebab-case.tsx`
- API routes: `route.ts`

### 2. Import Paths
\`\`\`typescript
// Use @ alias for imports
import { Button } from "@/components/ui/button"
import { generateQR } from "@/lib/qr-generator"
import { prisma } from "@/lib/prisma"
\`\`\`

### 3. Component Structure
\`\`\`typescript
// Typical component structure
'use client' // If client component

import { useState } from 'react'
import { Component } from '@/components/ui/component'

interface Props {
  // Props definition
}

export default function MyComponent({ ...props }: Props) {
  // Component logic
  return (
    // JSX
  )
}
\`\`\`

### 4. API Route Structure
\`\`\`typescript
// app/api/*/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Logic
    return NextResponse.json({ success: true, data })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
\`\`\`

---

## Where to Find Things

### Authentication
- Login UI: `app/page.tsx`
- Login logic: `components/login-form.tsx`
- Auth API: `app/api/auth/*/route.ts`
- Auth utilities: `lib/auth.ts`

### QR Generation
- UI: `app/dashboard/create-file/page.tsx`
- Component: `components/qr-code-generator.tsx`
- Logic: `lib/qr-generator.ts`
- API: `app/api/qr/generate/route.ts`

### Verification
- UI: `app/qr-verification/page.tsx`
- Scanner: `components/qr-code-scanner.tsx`
- Logic: `lib/qr-verification.ts`
- API: `app/api/verify-qr/route.ts`
- Results: `app/verification-results*/page.tsx`

### Dashboard
- Layout: `app/dashboard/layout.tsx`
- Home: `app/dashboard/page.tsx`
- Header: `components/dashboard/dashboard-header.tsx`
- Sidebar: `components/dashboard/sidebar.tsx`

### Admin
- Panel: `app/admin-panel/page.tsx`
- Login: `app/admin/login/page.tsx`
- Components: `components/admin/*`

### Payments
- Flutterwave: `app/dashboard/developer/flutterwave-payment/`
- BLC: `app/dashboard/developer/blc-payment/`
- Card: `app/dashboard/developer/card-payment/`

---

## Code Organization Guidelines

### Components
- Keep components small and focused
- Use TypeScript interfaces for props
- Extract reusable logic into hooks
- Use shadcn/ui components when possible

### API Routes
- Validate input with Zod
- Handle errors consistently
- Return standardized responses
- Use middleware for auth

### Utilities
- Pure functions in `/lib`
- Document complex logic
- Add TypeScript types
- Write unit tests

### Styles
- Use Tailwind classes
- Avoid custom CSS when possible
- Use CSS variables for theming
- Follow shadcn/ui patterns

---

## Development Workflow

### 1. Starting Development
\`\`\`bash
npm install
npm run dev
# App runs on http://localhost:3000
\`\`\`

### 2. Creating New Features
\`\`\`bash
# 1. Create component in /components
# 2. Create page in /app
# 3. Add API route in /app/api
# 4. Update types in /lib
# 5. Write tests in /tests
\`\`\`

### 3. Testing
\`\`\`bash
npm run test          # Run all tests
npm run test:unit     # Unit tests only
npm run test:e2e      # E2E tests only
\`\`\`

### 4. Building for Production
\`\`\`bash
npm run build
npm run start
\`\`\`

---

## Next Steps for Developer

1. **Familiarize with codebase**
   - Read through main components
   - Understand data flow
   - Review API structure

2. **Set up local environment**
   - Install dependencies
   - Configure environment variables
   - Run development server

3. **Review task list**
   - Prioritize tasks
   - Create timeline
   - Identify blockers

4. **Start development**
   - Begin with Phase 1 tasks
   - Write tests as you go
   - Document changes

---

**Document Version:** 1.0  
**Last Updated:** January 2024  
**Maintained By:** Development Team
