#!/usr/bin/env bash
set -euo pipefail

# Zero-touch deploy for Blockmec QR on Ubuntu VPS.
# Supports first-time deployment and repeat releases.

APP_NAME="blockmec-qr"
APP_DIR="/var/www/blockmec-qr-code"
APP_PORT="3000"
APP_IP="153.75.249.15"
BRANCH="main"
REPO_URL="${REPO_URL:-}"
ECOSYSTEM_FILE="ecosystem.config.cjs"
LOG_DIR="/var/log/blockmec-qr"
NGINX_SITE="/etc/nginx/sites-available/blockmec-qr"
CRON_SCRIPT="$APP_DIR/deploy/interserver/cron-dispatch-webhooks.sh"
ENV_FILE="$APP_DIR/.env.local"
ENV_TEMPLATE="$APP_DIR/deploy/interserver/.env.local.production.template"

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run this script as root."
  exit 1
fi

echo "[1/11] Installing OS dependencies"
apt update
apt install -y nginx curl git build-essential ca-certificates gnupg ufw

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js not found. Installing Node.js 20.x"
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt install -y nodejs
fi

if ! command -v pm2 >/dev/null 2>&1; then
  echo "PM2 not found. Installing PM2 globally"
  npm install -g pm2
fi

echo "[2/11] Preparing application directory"
mkdir -p /var/www
mkdir -p "$LOG_DIR"

if [[ ! -d "$APP_DIR/.git" ]]; then
  if [[ -z "$REPO_URL" ]]; then
    echo "App repo missing and REPO_URL is empty."
    echo "Set REPO_URL and re-run, for example:"
    echo "REPO_URL=https://github.com/ORG/REPO.git bash deploy/interserver/deploy.sh"
    exit 1
  fi
  git clone "$REPO_URL" "$APP_DIR"
fi

echo "[3/11] Pulling latest code"
cd "$APP_DIR"
git fetch --all --prune
git checkout "$BRANCH"
git pull --ff-only origin "$BRANCH"

echo "[4/11] Ensuring environment file exists"
if [[ ! -f "$ENV_FILE" ]]; then
  if [[ -f "$ENV_TEMPLATE" ]]; then
    cp "$ENV_TEMPLATE" "$ENV_FILE"
    chmod 600 "$ENV_FILE"
    echo "Created $ENV_FILE from template."
    echo "Fill real secrets and URLs, then re-run this script."
    exit 1
  fi
  echo "Missing $ENV_FILE and template not found."
  exit 1
fi

if grep -q "REPLACE_ME\|YOUR_\|0x0000000000000000000000000000000000000000" "$ENV_FILE"; then
  echo "Refusing to deploy: $ENV_FILE still contains placeholder values."
  exit 1
fi

echo "[5/11] Installing Node dependencies"
npm ci

echo "[6/11] Building application"
npm run build

echo "[7/11] Running Prisma migrations"
npx prisma migrate deploy

echo "[8/11] Starting or restarting PM2"
if pm2 describe "$APP_NAME" >/dev/null 2>&1; then
  pm2 restart "$APP_NAME"
else
  pm2 start "$ECOSYSTEM_FILE"
fi
pm2 save
pm2 startup systemd -u root --hp /root >/dev/null

echo "[9/11] Configuring Nginx reverse proxy"
cat > "$NGINX_SITE" <<EOF
server {
    listen 80;
    server_name ${APP_IP};

    client_max_body_size 25m;

    location / {
        proxy_pass http://127.0.0.1:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

ln -sf "$NGINX_SITE" /etc/nginx/sites-enabled/blockmec-qr
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl enable nginx
systemctl reload nginx

echo "[10/11] Configuring cron webhook dispatcher"
chmod +x "$CRON_SCRIPT"
existing_crontab="$(crontab -l 2>/dev/null || true)"
filtered_crontab="$(printf '%s\n' "$existing_crontab" | grep -v '# blockmec-webhook-dispatch' || true)"
new_cron="* * * * * WEBHOOK_DISPATCH_SECRET=\$(grep '^WEBHOOK_DISPATCH_SECRET=' $ENV_FILE | cut -d '=' -f2-) $CRON_SCRIPT http://127.0.0.1 >> $LOG_DIR/webhook-dispatch.log 2>&1 # blockmec-webhook-dispatch"
{
  printf '%s\n' "$filtered_crontab"
  printf '%s\n' "$new_cron"
} | awk 'NF' | crontab -

echo "[11/11] Applying firewall rules and health checks"
ufw allow OpenSSH >/dev/null 2>&1 || true
ufw allow 'Nginx Full' >/dev/null 2>&1 || true
ufw --force enable

pm2 status
curl -fsS "http://127.0.0.1:${APP_PORT}" >/dev/null
curl -fsSI "http://${APP_IP}" | head -n 1

echo "Deployment finished successfully."
