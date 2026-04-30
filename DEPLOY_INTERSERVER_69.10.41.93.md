# InterServer Deployment Guide (69.10.41.93)

This guide deploys this Next.js + Prisma app on your InterServer VPS at 69.10.41.93 using Node.js, PM2, Nginx, and cron.

## 1) Server prerequisites

Run on your VPS as root (or with sudo):

```bash
apt update && apt upgrade -y
apt install -y nginx curl git build-essential
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
npm install -g pm2
```

Confirm versions:

```bash
node -v
npm -v
pm2 -v
```

## 2) Clone app and install dependencies

```bash
mkdir -p /var/www
cd /var/www
git clone <YOUR_REPOSITORY_URL> blockmec-qr-code
cd blockmec-qr-code
npm ci
```

## 3) Configure environment variables

```bash
cp .env.example .env.local
nano .env.local
```

At minimum for production, set these correctly:

- NODE_ENV=production
- NEXT_PUBLIC_APP_URL=http://69.10.41.93
- DATABASE_URL=...
- DIRECT_URL=...
- JWT_SECRET=...
- SESSION_SECRET=...
- ENCRYPTION_KEY=...
- WEBHOOK_DISPATCH_SECRET=<strong-random-secret>

Prisma + Supabase note:

- Keep DATABASE_URL on your Supabase pooler host for runtime.
- Set DIRECT_URL to the direct (non-pooler) Postgres host for Prisma migrations.

## 4) Build and migrate

```bash
cd /var/www/blockmec-qr-code
npm run build
npx prisma migrate deploy
```

If you need seed data:

```bash
npm run db:seed
```

## 5) Start app with PM2

The repository includes a PM2 config file at ecosystem.config.cjs.

```bash
mkdir -p /var/log/blockmec-qr
cd /var/www/blockmec-qr-code
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

Check app status:

```bash
pm2 status
pm2 logs blockmec-qr --lines 100
```

## 6) Configure Nginx reverse proxy

Copy the provided Nginx server block:

```bash
cp /var/www/blockmec-qr-code/deploy/interserver/nginx.blockmec.conf /etc/nginx/sites-available/blockmec-qr
ln -sf /etc/nginx/sites-available/blockmec-qr /etc/nginx/sites-enabled/blockmec-qr
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
```

Verify:

```bash
curl -I http://69.10.41.93
```

## 7) Replace Vercel cron with Linux cron

This project has a dispatch endpoint at /api/internal/webhooks/dispatch. On VPS, schedule it with cron.

Create a root cron entry:

```bash
crontab -e
```

Add:

```cron
* * * * * WEBHOOK_DISPATCH_SECRET=<same-secret-in-.env.local> /var/www/blockmec-qr-code/deploy/interserver/cron-dispatch-webhooks.sh http://127.0.0.1 >> /var/log/blockmec-qr/webhook-dispatch.log 2>&1
```

Make script executable:

```bash
chmod +x /var/www/blockmec-qr-code/deploy/interserver/cron-dispatch-webhooks.sh
```

## 8) Open firewall (if enabled)

```bash
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
ufw status
```

## 9) Update deployment flow

For every new release:

```bash
cd /var/www/blockmec-qr-code
git pull
npm ci
npm run build
npx prisma migrate deploy
pm2 restart blockmec-qr
```

## 10) Troubleshooting

- App not starting: check PM2 logs and ensure .env.local exists on server.
- 502 Bad Gateway: verify app is listening on port 3000 and PM2 process is online.
- Prisma migration errors with Supabase: verify DIRECT_URL uses direct DB host (not pooler).
- Webhook dispatch unauthorized: verify WEBHOOK_DISPATCH_SECRET in cron matches .env.local.
