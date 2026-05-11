# Panduan Setup Duitku Payment Gateway

## Apa itu Duitku?

Duitku adalah payment gateway Indonesia yang mendukung:
- **QRIS** — semua e-wallet & mobile banking
- **GoPay** — bayar via GoPay
- **OVO** — bayar via OVO
- **DANA** — bayar via DANA
- **ShopeePay** — bayar via ShopeePay
- **Virtual Account BCA, BNI, BRI, Mandiri, BSI**

---

## Cara Daftar Duitku

### 1. Daftar Akun Sandbox (untuk testing)

1. Kunjungi: https://sandbox.duitku.com/
2. Klik **Register** dan isi data merchant
3. Setelah login, masuk ke menu **Project**
4. Buat project baru atau pilih project yang ada
5. Catat **Merchant Code** dan **API Key** dari halaman project

### 2. Daftar Akun Produksi

1. Kunjungi: https://merchant.duitku.com/
2. Daftar dan lengkapi dokumen bisnis
3. Setelah disetujui, dapatkan **Merchant Code** dan **API Key** production

---

## Konfigurasi di GachaPull

### Langkah 1 — Login sebagai Admin

Buka `https://domain-kamu.com/admin` dan login dengan akun admin.

### Langkah 2 — Isi Settings Duitku

Masuk ke menu **Settings** di admin panel, lalu isi:

| Field           | Nilai                                               |
|-----------------|-----------------------------------------------------|
| Merchant Code   | Contoh: `DS12345` (dari dashboard Duitku)           |
| API Key         | API Key dari halaman Project di dashboard Duitku    |
| Mode Produksi   | OFF untuk sandbox, ON untuk live                    |
| Aktif           | ON untuk mengaktifkan Duitku                        |

Klik **Simpan Settings Duitku**.

### Langkah 3 — Atur Callback URL di Duitku

Di dashboard Duitku, masuk ke **Project → Edit**:

- **Callback URL**: `https://domain-kamu.com/api/wallet/duitku/callback`
- **Return URL**: `https://domain-kamu.com/wallet` (opsional, sudah di-set dari kode)

> Penting: Callback URL harus bisa diakses dari internet (bukan localhost).

---

## Alur Pembayaran

```
User pilih nominal & metode
        ↓
POST /api/wallet/topup
        ↓
Duitku buat invoice → dapat paymentUrl
        ↓
User diarahkan ke halaman Duitku
        ↓
User bayar (scan QRIS, buka GoPay, dll)
        ↓
Duitku kirim callback ke /api/wallet/duitku/callback
        ↓
Server verifikasi tanda tangan → update saldo
        ↓
User kembali ke wallet → saldo sudah bertambah
```

---

## Testing di Sandbox

### Cara Test QRIS/GoPay/OVO (Sandbox Duitku)

1. Setelah klik **Buka Halaman Duitku**, scan QR atau pilih metode
2. Di sandbox, gunakan **simulasi pembayaran** yang disediakan Duitku:
   - Untuk QRIS: gunakan nomor kartu test yang tertera di halaman sandbox
   - Untuk GoPay: gunakan GoPay test account
3. Setelah "bayar", kembali ke halaman wallet dan klik **Saya Sudah Bayar — Cek Status**

### Cara Test dengan ngrok (agar callback bisa diterima lokal)

```bash
# Install ngrok: https://ngrok.com/download
ngrok http 80

# Salin URL ngrok (contoh: https://abc123.ngrok-free.app)
# Set Callback URL di Duitku: https://abc123.ngrok-free.app/api/wallet/duitku/callback
```

---

## Demo Mode (tanpa Duitku)

Jika Merchant Code / API Key **belum diisi** atau Duitku **dinonaktifkan**:

- Tombol top-up akan menampilkan halaman demo
- Klik **Simulasi Bayar** untuk langsung tambah saldo (tanpa pembayaran nyata)
- Cocok untuk development & testing lokal

---

## Metode Pembayaran & Kode Duitku

| Tampilan di App | Kode Duitku | Catatan                    |
|-----------------|-------------|----------------------------|
| QRIS            | NQ          | Universal QR               |
| GoPay           | GZ          | Redirect ke GoPay          |
| OVO             | OV          | Redirect ke OVO            |
| DANA            | DA          | Redirect ke DANA           |
| ShopeePay       | SP          | Redirect ke ShopeePay      |
| Transfer BCA    | BC          | Virtual Account BCA        |
| Transfer BNI    | I1          | Virtual Account BNI        |
| Transfer BRI    | BR          | Virtual Account BRI        |
| Transfer Mandiri| M2          | Virtual Account Mandiri    |

---

## Keamanan

- **Signature Callback**: Setiap callback dari Duitku diverifikasi menggunakan HMAC MD5
  - Formula: `MD5(merchantCode + amount + merchantOrderId + apiKey)`
  - Jika signature tidak cocok, request ditolak
- **API Key** disimpan di database dan tidak pernah dikirim ke frontend
- Duplikasi callback ditangani (idempotent — order yang sudah `completed` diabaikan)

---

## Troubleshooting

| Masalah | Solusi |
|---------|--------|
| "Duitku error: ..." | Cek Merchant Code dan API Key di admin settings |
| Saldo tidak bertambah setelah bayar | Pastikan Callback URL bisa diakses dari internet |
| "Invalid signature" di callback | Pastikan API Key yang disimpan sesuai dengan di dashboard Duitku |
| Muncul Demo Mode padahal sudah isi credentials | Pastikan toggle **Aktif** di-ON kan dan klik **Simpan** |

---

## Environment Variables (Opsional)

Credentials juga bisa diset via environment variable sebagai alternatif (perlu modifikasi kode):

```env
DUITKU_MERCHANT_CODE=DS12345
DUITKU_API_KEY=your-api-key-here
DUITKU_IS_PRODUCTION=false
```

Saat ini credentials dikelola via admin panel (disimpan di tabel `payment_settings`).
