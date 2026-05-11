#!/bin/bash
# =============================================
#   GachaPull — Deploy / Update Script
#   Ubuntu 24.04 LTS
#   Usage (pertama kali): bash deploy/deploy.sh --fresh
#   Usage (update):       bash deploy/deploy.sh
# =============================================

set -e
CYAN='\033[0;36m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'

log()  { echo -e "${CYAN}[DEPLOY]${NC} $1"; }
ok()   { echo -e "${GREEN}[OK]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
fail() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

FRESH=false
[[ "$1" == "--fresh" ]] && FRESH=true

APP_DIR="/var/www/gachapull"
REPO_URL="https://github.com/robinroot/gachapull.git"
BRANCH="main"

# =============================================
# 1. Clone atau update repo
# =============================================
if [ "$FRESH" = true ] || [ ! -d "$APP_DIR/.git" ]; then
  log "Clone repository..."
  rm -rf "$APP_DIR"
  git clone --depth=1 --branch "$BRANCH" "$REPO_URL" "$APP_DIR"
  ok "Repository di-clone ke $APP_DIR"
else
  log "Update repository..."
  cd "$APP_DIR"
  git fetch origin "$BRANCH"
  git reset --hard "origin/$BRANCH"
  ok "Repository diperbarui"
fi

cd "$APP_DIR"

# =============================================
# 2. Setup .env (hanya saat --fresh)
# =============================================
if [ "$FRESH" = true ] || [ ! -f ".env" ]; then
  if [ ! -f ".env" ]; then
    log "Setup environment variables..."
    cp .env.example .env

    read -rp "DATABASE_URL (contoh: postgresql://gachapull:PASS@localhost:5432/gachapull): " DB_URL
    read -rp "JWT_SECRET (buat random string panjang): " JWT_SECRET

    sed -i "s|DATABASE_URL=.*|DATABASE_URL=${DB_URL}|" .env
    sed -i "s|JWT_SECRET=.*|JWT_SECRET=${JWT_SECRET}|" .env

    ok ".env berhasil dikonfigurasi"
  else
    warn ".env sudah ada, tidak ditimpa. Edit manual jika perlu."
  fi
fi

# Load env untuk build
set -a; source .env; set +a

# =============================================
# 3. Install dependencies
# =============================================
log "Install dependencies..."
pnpm install --frozen-lockfile
ok "Dependencies terinstall"

# =============================================
# 4. Build shared libraries
# =============================================
log "Build shared libraries..."
pnpm run typecheck:libs
ok "Libraries di-build"

# =============================================
# 5. Build API server
# =============================================
log "Build API server..."
pnpm --filter @workspace/api-server run build
ok "API server di-build → artifacts/api-server/dist/"

# =============================================
# 6. Build frontend (React + Vite)
# =============================================
log "Build frontend..."
PORT=3000 BASE_PATH=/ NODE_ENV=production \
  pnpm --filter @workspace/gacha-web run build
ok "Frontend di-build → artifacts/gacha-web/dist/public/"

# =============================================
# 7. Migrasi database
# =============================================
log "Jalankan migrasi database..."
pnpm --filter @workspace/db run push
ok "Schema database diperbarui"

# =============================================
# 8. Seed data awal (hanya --fresh)
# =============================================
if [ "$FRESH" = true ]; then
  log "Seed data awal (cards, packs, admin, dll)..."
  pnpm --filter @workspace/scripts run seed 2>/dev/null && ok "Seed berhasil" || warn "Seed script tidak ditemukan, skip"
  pnpm --filter @workspace/scripts run reset-admin 2>/dev/null && ok "Admin user siap" || warn "reset-admin tidak ditemukan, skip"
fi

# =============================================
# 9. Setup Nginx (hanya --fresh)
# =============================================
if [ "$FRESH" = true ]; then
  log "Setup Nginx..."
  if [ -f "deploy/nginx.conf" ]; then
    cp deploy/nginx.conf /etc/nginx/sites-available/gachapull
    ln -sf /etc/nginx/sites-available/gachapull /etc/nginx/sites-enabled/gachapull
    rm -f /etc/nginx/sites-enabled/default

    # Ganti root path di nginx config
    sed -i "s|/var/www/gachapull|${APP_DIR}|g" /etc/nginx/sites-available/gachapull

    nginx -t && systemctl reload nginx
    ok "Nginx dikonfigurasi dan di-reload"
  else
    warn "deploy/nginx.conf tidak ditemukan, skip Nginx setup"
  fi
fi

# =============================================
# 10. Start / Restart PM2
# =============================================
log "Restart aplikasi via PM2..."
mkdir -p /var/log/pm2

if pm2 describe gachapull-api &>/dev/null; then
  pm2 reload gachapull-api --update-env
  ok "PM2 process di-reload"
else
  pm2 start ecosystem.config.cjs
  pm2 save
  ok "PM2 process distart"
fi

# =============================================
# Done!
# =============================================
echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  Deploy selesai!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo "  API  : http://localhost:8080/api/health"
echo "  Web  : http://$(curl -s ifconfig.me 2>/dev/null || echo 'IP_VPS')/"
echo "  PM2  : pm2 status"
echo "  Logs : pm2 logs gachapull-api"
echo ""
if [ "$FRESH" = true ]; then
  echo -e "${YELLOW}  SSL (HTTPS): jalankan perintah berikut setelah DNS aktif:${NC}"
  echo "  sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com"
  echo ""
fi
