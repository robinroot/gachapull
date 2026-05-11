#!/bin/bash
# =============================================
#   GachaPull — Server Setup (jalankan sekali)
#   Ubuntu 24.04 LTS
#   Usage: bash deploy/setup-server.sh
# =============================================

set -e
CYAN='\033[0;36m'; GREEN='\033[0;32m'; RED='\033[0;31m'; NC='\033[0m'

log()  { echo -e "${CYAN}[SETUP]${NC} $1"; }
ok()   { echo -e "${GREEN}[OK]${NC} $1"; }
fail() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

[ "$(id -u)" -eq 0 ] || fail "Jalankan sebagai root: sudo bash deploy/setup-server.sh"

log "Update sistem..."
apt-get update -y && apt-get upgrade -y

# ---- Node.js 24 ----
log "Install Node.js 24..."
curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
apt-get install -y nodejs
node -v | grep -q "v24" && ok "Node.js $(node -v)" || fail "Gagal install Node.js 24"

# ---- pnpm ----
log "Install pnpm..."
npm install -g pnpm@latest
pnpm -v && ok "pnpm $(pnpm -v)"

# ---- PM2 ----
log "Install PM2..."
npm install -g pm2
pm2 -v && ok "PM2 $(pm2 -v)"
pm2 startup systemd -u root --hp /root
systemctl enable pm2-root

# ---- PostgreSQL 16 ----
log "Install PostgreSQL..."
apt-get install -y postgresql postgresql-contrib
systemctl start postgresql
systemctl enable postgresql
ok "PostgreSQL siap"

# ---- Nginx ----
log "Install Nginx..."
apt-get install -y nginx
systemctl start nginx
systemctl enable nginx
ok "Nginx siap"

# ---- Certbot (SSL) ----
log "Install Certbot..."
apt-get install -y certbot python3-certbot-nginx
ok "Certbot siap"

# ---- Firewall ----
log "Setup UFW firewall..."
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
ok "Firewall aktif"

# ---- PM2 log dir ----
mkdir -p /var/log/pm2

# ---- PostgreSQL: buat DB dan user ----
log "Setup database PostgreSQL..."
read -rp "Masukkan password untuk DB user 'gachapull': " DB_PASS
sudo -u postgres psql <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'gachapull') THEN
    CREATE USER gachapull WITH PASSWORD '${DB_PASS}';
  END IF;
END
\$\$;
CREATE DATABASE gachapull OWNER gachapull;
GRANT ALL PRIVILEGES ON DATABASE gachapull TO gachapull;
SQL
ok "Database 'gachapull' dan user 'gachapull' berhasil dibuat"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Server setup selesai!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "  DATABASE_URL yang perlu kamu simpan:"
echo "  postgresql://gachapull:${DB_PASS}@localhost:5432/gachapull"
echo ""
echo "  Langkah selanjutnya: jalankan deploy/deploy.sh"
