# 📋 Database Setup Checklist

## Current Issue
```
Error: P1001: Can't reach database server at db.xzsvbynhviqsxotjirrm.supabase.co:5432
```

**Root Cause**: Supabase database is likely paused (inactive for 1 week)

---

## ✅ Steps to Fix

### 1. Wake Up Supabase Database (5 minutes)
- [ ] Go to https://supabase.com/dashboard
- [ ] Find your project: `blockmec-qr`
- [ ] Database should show as "Paused"
- [ ] Click "Resume" button
- [ ] Wait 30-60 seconds for database to wake up

### 2. Verify Database Connection (1 minute)
```bash
# Test the connection
npx prisma db execute --stdin
# Type: SELECT 1;
# Should return: (1 row)
```

### 3. Push Schema to Database (2 minutes)
```bash
# This creates all tables in the database
npx prisma db push

# Expected output:
# ✔ Database synced, schema is in sync
```

### 4. Regenerate Prisma Client (1 minute)
```bash
# Ensure Prisma client is up to date
npx prisma generate
```

### 5. Restart Dev Server (1 minute)
```bash
# Stop the dev server (Ctrl+C)
# Then start it again
npm run dev
```

### 6. Test Admin Panel
- [ ] Go to http://localhost:3000/admin-panel
- [ ] Try switching to "Users" tab
- [ ] Should see user management interface (no more 500 errors)

---

## 🔧 Alternative: Use SQLite for Local Development

If you want to skip Supabase for now, you can use SQLite locally:

```bash
# 1. Update .env.local
DATABASE_URL="file:./dev.db"
DIRECT_URL="file:./dev.db"

# 2. Push schema to SQLite
npx prisma db push

# 3. Restart dev server
npm run dev
```

**Note**: SQLite is fine for development, but production should use PostgreSQL (Supabase).

---

## 📞 Troubleshooting

### If database still won't connect:
1. Check Supabase dashboard - is it actually running?
2. Verify credentials in `.env.local` match Supabase project
3. Try copying fresh credentials from Supabase dashboard
4. Check your internet connection and firewall

### If `npx prisma db push` fails with schema errors:
1. Run: `npx prisma migrate reset` (warning: deletes all data)
2. Then: `npx prisma db push`

### If you need to create a new database:
1. Go to Supabase Dashboard
2. Create a new PostgreSQL database
3. Copy connection string to `.env.local`
4. Run: `npx prisma db push`

---

## ✨ After Setup

Once database is ready:
1. ✅ Admin panel will work
2. ✅ All 500 errors will be gone
3. ✅ App is production-ready
4. ✅ Ready to deploy

---

## 📌 Key Files

- `.env.local` - Database connection (credentials masked)
- `prisma/schema.prisma` - Database schema definition
- `app/api/admin/users/route.ts` - Admin users endpoint (needs DB)
- `app/api/admin/logs/route.ts` - Admin logs endpoint (needs DB)

---

**Once database is running, all errors should resolve automatically!**
