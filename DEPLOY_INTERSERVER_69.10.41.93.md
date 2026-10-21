# InterServer Deployment Guide (153.75.249.15)

This guide deploys this Next.js + Prisma app on your InterServer VPS at 153.75.249.15 using Node.js, PM2, Nginx, and cron.
It is configured to run the app with a dedicated Linux user `blockmec` and project directory `/home/blockmec/Blockmec` (not under `/root`).

## 1) Server prerequisites

Run on your VPS as root (or with sudo):

```bash
apt update && apt upgrade -y
apt install -y nginx curl git build-essential
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
npm install -g pm2
```

Create a dedicated app user and folders:

```bash
id -u blockmec >/dev/null 2>&1 || useradd -m -s /bin/bash blockmec
mkdir -p /home/blockmec/logs/blockmec-qr
chown -R blockmec:blockmec /home/blockmec
```

Confirm versions:

```bash
node -v
npm -v
pm2 -v
```

## 2) Clone app and install dependencies

```bash
runuser -u blockmec -- git clone <YOUR_REPOSITORY_URL> /home/blockmec/Blockmec
cd /home/blockmec/Blockmec
runuser -u blockmec -- npm ci
```

## 3) Configure environment variables

```bash
cp .env.example .env.local
nano .env.local
```

At minimum for production, set these correctly:

- NODE_ENV=production
- NEXT_PUBLIC_APP_URL=http://153.75.249.15
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
cd /home/blockmec/Blockmec
runuser -u blockmec -- npm run build
runuser -u blockmec -- npx prisma migrate deploy
```

If you need seed data:

```bash
runuser -u blockmec -- npm run db:seed
```

## 5) Start app with PM2

The repository includes a PM2 config file at ecosystem.config.cjs.

```bash
mkdir -p /home/blockmec/logs/blockmec-qr
chown -R blockmec:blockmec /home/blockmec/logs
cd /home/blockmec/Blockmec
runuser -u blockmec -- env BLOCKMEC_APP_DIR=/home/blockmec/Blockmec BLOCKMEC_LOG_DIR=/home/blockmec/logs/blockmec-qr pm2 start ecosystem.config.cjs
runuser -u blockmec -- pm2 save
pm2 startup systemd -u blockmec --hp /home/blockmec
```

Check app status:

```bash
runuser -u blockmec -- pm2 status
runuser -u blockmec -- pm2 logs blockmec-qr --lines 100
```

## 6) Configure Nginx reverse proxy

Copy the provided Nginx server block:

```bash
cp /home/blockmec/Blockmec/deploy/interserver/nginx.blockmec.conf /etc/nginx/sites-available/blockmec-qr
ln -sf /etc/nginx/sites-available/blockmec-qr /etc/nginx/sites-enabled/blockmec-qr
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
```

Verify:

```bash
curl -I http://153.75.249.15
```

## 7) Replace Vercel cron with Linux cron

This project has a dispatch endpoint at /api/internal/webhooks/dispatch. On VPS, schedule it with cron.

Create a cron entry for the `blockmec` user:

```bash
crontab -u blockmec -e
```

Add:

```cron
* * * * * WEBHOOK_DISPATCH_SECRET=<same-secret-in-.env.local> /home/blockmec/Blockmec/deploy/interserver/cron-dispatch-webhooks.sh http://127.0.0.1 >> /home/blockmec/logs/blockmec-qr/webhook-dispatch.log 2>&1
```

Make script executable:

```bash
chmod +x /home/blockmec/Blockmec/deploy/interserver/cron-dispatch-webhooks.sh
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
cd /home/blockmec/Blockmec
runuser -u blockmec -- git pull
runuser -u blockmec -- npm ci
runuser -u blockmec -- npm run build
runuser -u blockmec -- npx prisma migrate deploy
runuser -u blockmec -- pm2 restart blockmec-qr --update-env
```

## 10) Troubleshooting

- App not starting: check PM2 logs and ensure .env.local exists on server.
- 502 Bad Gateway: verify app is listening on port 3000 and PM2 process is online.
- Prisma migration errors with Supabase: verify DIRECT_URL uses direct DB host (not pooler).
- Webhook dispatch unauthorized: verify WEBHOOK_DISPATCH_SECRET in cron matches .env.local.
