# GachaPull — Panduan Instalasi & Deployment

> Gacha card website Pokemon & One Piece dengan sistem saldo IDR, top-up via Midtrans, dan buyback kartu.

---

## Daftar Isi

1. [Prasyarat](#1-prasyarat)
2. [Struktur Proyek](#2-struktur-proyek)
3. [Setup Database PostgreSQL](#3-setup-database-postgresql)
4. [Konfigurasi Environment Variables](#4-konfigurasi-environment-variables)
5. [Instalasi Dependencies](#5-instalasi-dependencies)
6. [Menjalankan Secara Lokal (Development)](#6-menjalankan-secara-lokal-development)
7. [Build untuk Production](#7-build-untuk-production)
8. [Deploy ke VPS (Ubuntu/Debian)](#8-deploy-ke-vps-ubuntudebian)
9. [Deploy ke Railway / Render / Fly.io](#9-deploy-ke-railway--render--flyio)
10. [Konfigurasi Midtrans](#10-konfigurasi-midtrans)
11. [Akun Admin Default](#11-akun-admin-default)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. Prasyarat

| Software | Versi Minimum | Keterangan |
|---|---|---|
| Node.js | 20+ (disarankan 24) | [nodejs.org](https://nodejs.org) |
| pnpm | 9+ | `npm install -g pnpm` |
| PostgreSQL | 14+ | Database utama |
| Git | — | Clone repo |

---

## 2. Struktur Proyek

```
gachapull/
├── artifacts/
│   ├── api-server/     # Backend Express + TypeScript (port 8080, prefix /api)
│   └── gacha-web/      # Frontend React + Vite (port 5173, prefix /)
├── lib/
│   ├── db/             # Drizzle ORM schema + DB client (@workspace/db)
│   ├── api-spec/       # OpenAPI spec + codegen
│   └── api-client-react/ # Generated React Query hooks
├── scripts/            # Utility scripts (reset-admin, dll)
├── pnpm-workspace.yaml
└── package.json
```

---

## 3. Setup Database PostgreSQL

### 3a. Buat Database Baru

```bash
# Login ke PostgreSQL
psql -U postgres

# Buat database dan user
CREATE DATABASE gachapull;
CREATE USER gachapull_user WITH PASSWORD 'password_anda_disini';
GRANT ALL PRIVILEGES ON DATABASE gachapull TO gachapull_user;
\q
```

### 3b. Import Schema + Data Awal

File `gachapull_database.sql` sudah disertakan dalam paket ini.

> **Penting:** Import **harus dilakukan sebagai superuser PostgreSQL** (`postgres`), bukan sebagai user biasa.

```bash
# Import sebagai superuser postgres (WAJIB)
psql -U postgres -d gachapull -f gachapull_database.sql
```

File SQL ini sudah otomatis menjalankan:
- `GRANT ALL ON SCHEMA public TO PUBLIC` (untuk PostgreSQL 15+)
- `GRANT ALL PRIVILEGES ON ALL TABLES ...` untuk `gachapull_user`

> Jika nama user PostgreSQL Anda **bukan** `gachapull_user`, edit bagian akhir file `gachapull_database.sql` dan ganti `gachapull_user` dengan nama user Anda, lalu jalankan ulang perintah import.

File ini berisi:
- Semua tabel (users, cards, packs, gacha_pulls, user_collection, dll)
- 30 kartu seed: 15 Pokemon + 15 One Piece
- 4 pack: Pokemon Base Set (Rp 15.000), Pokemon Legendary (Rp 50.000), One Piece Grand Line (Rp 25.000), One Piece Emperor (Rp 50.000)
- Pengaturan payment default

### 3c. Buat File `.env` di Root Proyek

Sebelum menjalankan script apapun, buat file `.env` di root folder proyek:

```env
DATABASE_URL=postgresql://gachapull_user:password_anda@localhost:5432/gachapull
SESSION_SECRET=ganti_dengan_string_acak_panjang
JWT_SECRET=ganti_dengan_jwt_secret_acak
```

> Script `reset-admin` akan otomatis membaca file `.env` ini.

### 3d. Buat Admin User

Setelah `.env` siap dan database sudah diimport:

```bash
pnpm --filter @workspace/scripts run reset-admin
```

Script ini akan membuat/mereset akun:
- **Email**: admin@gachapull.com
- **Password**: Admin@123456
- **Role**: admin

> Ganti password admin segera setelah login pertama!

---

## 4. Konfigurasi Environment Variables

Buat file `.env` di root proyek (atau set di server deployment):

```env
# =============================================
# DATABASE
# =============================================
DATABASE_URL=postgresql://gachapull_user:password_anda@localhost:5432/gachapull

# =============================================
# KEAMANAN
# =============================================
SESSION_SECRET=ganti_dengan_string_acak_panjang_minimal_32_karakter
JWT_SECRET=ganti_dengan_jwt_secret_acak_panjang

# =============================================
# SERVER
# =============================================
PORT=8080
NODE_ENV=production

# =============================================
# MIDTRANS (opsional, bisa diset via admin panel)
# =============================================
# MIDTRANS_SERVER_KEY=SB-Mid-server-xxxx
# MIDTRANS_CLIENT_KEY=SB-Mid-client-xxxx
# MIDTRANS_IS_PRODUCTION=false
```

> **Cara generate secret acak:**
> ```bash
> node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
> ```

---

## 5. Instalasi Dependencies

```bash
# Clone atau ekstrak proyek
cd gachapull

# Install semua dependencies (monorepo)
pnpm install

# Build shared libraries
pnpm run typecheck:libs
```

---

## 6. Menjalankan Secara Lokal (Development)

Jalankan dua terminal secara bersamaan:

**Terminal 1 — API Server:**
```bash
pnpm --filter @workspace/api-server run dev
# Server berjalan di http://localhost:8080
# Prefix: /api
```

**Terminal 2 — Frontend:**
```bash
pnpm --filter @workspace/gacha-web run dev
# Frontend berjalan di http://localhost:5173
```

Buka browser: **http://localhost:5173**

---

## 7. Build untuk Production

```bash
# Build API server
pnpm --filter @workspace/api-server run build
# Output: artifacts/api-server/dist/

# Build frontend
pnpm --filter @workspace/gacha-web run build
# Output: artifacts/gacha-web/dist/
```

---

## 8. Deploy ke VPS (Ubuntu/Debian)

### 8a. Instalasi Node.js & pnpm

```bash
# Install Node.js 20 via NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install pnpm
npm install -g pnpm

# Install PostgreSQL
sudo apt-get install -y postgresql postgresql-contrib

# Install Nginx
sudo apt-get install -y nginx

# Install PM2 (process manager)
npm install -g pm2
```

### 8b. Clone & Setup Proyek

```bash
# Upload proyek ke server (atau clone dari git)
git clone https://github.com/username/gachapull.git /var/www/gachapull
cd /var/www/gachapull

# Install dependencies
pnpm install

# Setup database (lihat bagian 3)
# ...

# Build
pnpm --filter @workspace/api-server run build
pnpm --filter @workspace/gacha-web run build
```

### 8c. Jalankan dengan PM2

```bash
# Buat file ecosystem PM2
cat > ecosystem.config.cjs << 'EOF'
module.exports = {
  apps: [
    {
      name: 'gachapull-api',
      cwd: '/var/www/gachapull/artifacts/api-server',
      script: './dist/index.mjs',
      env: {
        NODE_ENV: 'production',
        PORT: 8080,
        DATABASE_URL: 'postgresql://gachapull_user:password@localhost:5432/gachapull',
        SESSION_SECRET: 'secret_anda_disini',
        JWT_SECRET: 'jwt_secret_anda_disini'
      }
    }
  ]
}
EOF

pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

### 8d. Konfigurasi Nginx

```nginx
# /etc/nginx/sites-available/gachapull
server {
    listen 80;
    server_name domain-anda.com www.domain-anda.com;

    # Frontend (static files)
    root /var/www/gachapull/artifacts/gacha-web/dist;
    index index.html;

    # API proxy ke Express
    location /api {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # SPA fallback (React Router)
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

```bash
# Aktifkan site
sudo ln -s /etc/nginx/sites-available/gachapull /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 8e. Setup SSL dengan Let's Encrypt

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d domain-anda.com -d www.domain-anda.com
```

---

## 9. Deploy ke Railway / Render / Fly.io

### Railway

1. Push proyek ke GitHub
2. Buka [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Tambah PostgreSQL service dari Railway dashboard
4. Set environment variables (lihat bagian 4)
5. Set **Start Command**:
   ```
   pnpm --filter @workspace/api-server run start
   ```
6. Untuk frontend, deploy sebagai service terpisah dengan Start Command:
   ```
   pnpm --filter @workspace/gacha-web run preview --host 0.0.0.0 --port $PORT
   ```

### Render

1. Buat **Web Service** untuk API:
   - Build Command: `pnpm install && pnpm --filter @workspace/api-server run build`
   - Start Command: `node artifacts/api-server/dist/index.mjs`
2. Buat **Static Site** untuk Frontend:
   - Build Command: `pnpm install && pnpm --filter @workspace/gacha-web run build`
   - Publish Directory: `artifacts/gacha-web/dist`
   - Redirect/Rewrite: `/* → /index.html` (200)
3. Tambah PostgreSQL dari Render dashboard
4. Set semua environment variables

---

## 10. Konfigurasi Midtrans

Midtrans digunakan untuk top-up saldo IDR via QRIS, GoPay, OVO, DANA.

### Langkah Setup:

1. Daftar di [midtrans.com](https://midtrans.com) → Buat akun merchant
2. Masuk ke **Sandbox** untuk testing → ambil **Server Key** dan **Client Key**
3. Login ke aplikasi sebagai admin → buka **Admin → Pengaturan**
4. Masukkan:
   - **Midtrans Server Key**: `SB-Mid-server-xxxx`
   - **Midtrans Client Key**: `SB-Mid-client-xxxx`
   - Centang **Mode Produksi** saat sudah siap live

### Webhook Midtrans (Production):

Set Notification URL di dashboard Midtrans ke:
```
https://domain-anda.com/api/wallet/topup/webhook
```

---

## 11. Akun Admin Default

Setelah menjalankan script `reset-admin`:

| Field | Value |
|---|---|
| Email | admin@gachapull.com |
| Password | Admin@123456 |
| Role | admin |
| URL Admin | `/admin` |

**Fitur admin:**
- Kelola kartu dan pack
- Lihat semua transaksi
- Kelola pengguna
- Konfigurasi Midtrans
- Lihat top-up orders

> Segera ganti password setelah login pertama via halaman profil atau langsung di database.

---

## 12. Troubleshooting

### API server tidak mau start

```bash
# Cek log
pm2 logs gachapull-api

# Pastikan DATABASE_URL benar
psql $DATABASE_URL -c "SELECT 1"
```

### Frontend tidak bisa konek ke API

Pastikan Nginx config sudah benar untuk proxy `/api` ke port 8080. Cek:
```bash
curl http://localhost:8080/api/healthz
# Harus response: {"status":"ok"}
```

### Error "Invalid token" saat login

Pastikan `JWT_SECRET` di environment variable sudah di-set dan tidak berubah setelah user login.

### Database error: relation does not exist

Schema belum diimport. Jalankan:
```bash
psql -U gachapull_user -d gachapull -f gachapull_database.sql
```

### Port sudah dipakai

```bash
# Cek proses di port 8080
lsof -i :8080
# Kill jika perlu
kill -9 <PID>
```

---

## Perintah Berguna

```bash
# Cek status semua services
pm2 status

# Restart API server
pm2 restart gachapull-api

# Lihat log real-time
pm2 logs gachapull-api --lines 100

# Push perubahan schema DB (development)
pnpm --filter @workspace/db run push

# Reset admin user
pnpm --filter @workspace/scripts run reset-admin

# Typecheck seluruh proyek
pnpm run typecheck

# Regenerate API hooks dari OpenAPI spec
pnpm --filter @workspace/api-spec run codegen
```

---

*GachaPull — dibuat dengan ❤️ menggunakan Express, React, PostgreSQL, dan Drizzle ORM*
