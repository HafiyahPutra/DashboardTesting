# 🖥️ ASCII Wireframe UX — Sisi User
## Sistem Peminjaman & Pengembalian Barang IoT Inventory

> Wireframe ini mengikuti alur FLOW 1–4 dari flowchart web integrasi.
> Resolusi target: layar tablet/kiosk landscape.

---

## Layar 1 — IDLE (Menunggu Fingerprint)

```
╔══════════════════════════════════════════════════╗
║                                                  ║
║               ┌──────────────┐                   ║
║               │              │                   ║
║               │    ( 👆 )    │                   ║
║               │              │                   ║
║               └──────────────┘                   ║
║                                                  ║
║          IoT INVENTORY SYSTEM                    ║
║     ─────────────────────────────                ║
║                                                  ║
║      Tempelkan jari Anda pada sensor             ║
║         untuk memulai sesi                       ║
║                                                  ║
║              ● ● ● (pulse)                       ║
║                                                  ║
║   ┌────────────────────────────────────────┐     ║
║   │  Status: Menunggu autentikasi...       │     ║
║   │  Firebase: /auth_system/status = IDLE  │     ║
║   └────────────────────────────────────────┘     ║
║                                                  ║
╚══════════════════════════════════════════════════╝
```

---

## Layar 2 — Fingerprint TIDAK DIKENALI

```
╔══════════════════════════════════════════════════╗
║                                                  ║
║          ┌─────────────────────────┐             ║
║          │   ⚠️  SIDIK JARI        │             ║
║          │   TIDAK DIKENALI        │             ║
║          └─────────────────────────┘             ║
║                                                  ║
║     Sidik jari Anda belum terdaftar              ║
║     dalam sistem.                                ║
║                                                  ║
║     Apakah Anda ingin mendaftar sebagai          ║
║     pengguna baru?                               ║
║                                                  ║
║   ┌──────────────┐    ┌──────────────────┐       ║
║   │              │    │                  │       ║
║   │    BATAL     │    │  DAFTAR BARU  →  │       ║
║   │              │    │                  │       ║
║   └──────────────┘    └──────────────────┘       ║
║     (kembali idle)      (ke form registrasi)     ║
║                                                  ║
╚══════════════════════════════════════════════════╝
```

---

## Layar 3 — Form REGISTRASI Mahasiswa Baru

```
╔══════════════════════════════════════════════════╗
║                                                  ║
║    📝 REGISTRASI PENGGUNA BARU                   ║
║    ──────────────────────────                    ║
║                                                  ║
║    NIM                                           ║
║    ┌──────────────────────────────────────┐      ║
║    │ Contoh: 1301213000                   │      ║
║    └──────────────────────────────────────┘      ║
║                                                  ║
║    Nama Lengkap                                  ║
║    ┌──────────────────────────────────────┐      ║
║    │ Contoh: Raihan Pratama               │      ║
║    └──────────────────────────────────────┘      ║
║                                                  ║
║    Email Mahasiswa                                ║
║    ┌──────────────────────────────────────┐      ║
║    │ Contoh: raihan@student.ac.id         │      ║
║    └──────────────────────────────────────┘      ║
║                                                  ║
║    No. Telepon                                   ║
║    ┌──────────────────────────────────────┐      ║
║    │ Contoh: 08123456789                  │      ║
║    └──────────────────────────────────────┘      ║
║                                                  ║
║   ┌──────────┐         ┌──────────────────┐     ║
║   │  BATAL   │         │   LANJUT  →      │     ║
║   └──────────┘         └──────────────────┘     ║
║                                                  ║
╚══════════════════════════════════════════════════╝
```

---

## Layar 4 — Instruksi ENROLLMENT Sidik Jari

```
╔══════════════════════════════════════════════════╗
║                                                  ║
║    👆 ENROLLMENT SIDIK JARI                      ║
║    ──────────────────────                        ║
║                                                  ║
║    Untuk: Raihan Pratama (NIM: 1301213000)       ║
║    Finger ID: #3                                 ║
║                                                  ║
║         ┌─────────────────────┐                  ║
║         │                     │                  ║
║         │   ╭─────────────╮   │                  ║
║         │   │  (  👆  )   │   │                  ║
║         │   │   pulse..   │   │                  ║
║         │   ╰─────────────╯   │                  ║
║         │                     │                  ║
║         └─────────────────────┘                  ║
║                                                  ║
║    ┌────────────────────────────────────────┐    ║
║    │  Step 1/2: Tempelkan jari ke sensor    │    ║
║    │                                        │    ║
║    │  ████████████░░░░░░░░  50%             │    ║
║    └────────────────────────────────────────┘    ║
║                                                  ║
║    Status: PLACE_FINGER_1                        ║
║                                                  ║
║    ┌──────────────────┐                          ║
║    │   COBA LAGI      │  (muncul jika FAILED)   ║
║    └──────────────────┘                          ║
║                                                  ║
╚══════════════════════════════════════════════════╝
```

### Layar 4b — Enrollment BERHASIL

```
╔══════════════════════════════════════════════════╗
║                                                  ║
║              🎉 REGISTRASI BERHASIL!             ║
║              ────────────────────                ║
║                                                  ║
║         Selamat, Raihan Pratama!                  ║
║         Sidik jari Anda telah terdaftar.          ║
║                                                  ║
║         Finger ID : #3                           ║
║         NIM       : 1301213000                   ║
║                                                  ║
║              ┌────────────────────┐              ║
║              │  MASUK KE MENU  →  │              ║
║              └────────────────────┘              ║
║                                                  ║
╚══════════════════════════════════════════════════╝
```

---

## Layar 5 — MENU UTAMA (Setelah Autentikasi)

```
╔══════════════════════════════════════════════════╗
║                                                  ║
║    Selamat datang, Raihan Pratama 👋             ║
║    NIM: 1301213000 | Finger ID: #3               ║
║    ──────────────────────────────────             ║
║                                                  ║
║    Pilih aksi yang ingin dilakukan:              ║
║                                                  ║
║    ┌─────────────────────────────────────────┐   ║
║    │                                         │   ║
║    │   📤  PINJAM BARANG                     │   ║
║    │                                         │   ║
║    │   Ambil barang dari loker inventaris     │   ║
║    │                                         │   ║
║    └─────────────────────────────────────────┘   ║
║                                                  ║
║    ┌─────────────────────────────────────────┐   ║
║    │                                         │   ║
║    │   📥  KEMBALIKAN BARANG                 │   ║
║    │                                         │   ║
║    │   Kembalikan barang yang sedang dipinjam │   ║
║    │                                         │   ║
║    └─────────────────────────────────────────┘   ║
║                                                  ║
║    ┌──────────┐                                  ║
║    │  LOGOUT  │                                  ║
║    └──────────┘                                  ║
║                                                  ║
╚══════════════════════════════════════════════════╝
```

---

## Layar 6 — PILIH LOKER & BARANG (Alur Pinjam)

```
╔══════════════════════════════════════════════════╗
║  ← Kembali         📤 PINJAM BARANG             ║
║  ──────────────────────────────────────────      ║
║                                                  ║
║  Pilih barang yang ingin dipinjam:               ║
║                                                  ║
║  ┌──── LOKER 1 (RFID LF) ─────────────────┐    ║
║  │ #  Nama Barang        Kategori   Status │    ║
║  │ ── ─────────────────  ────────   ────── │    ║
║  │ 1  Multimeter Digital Alat Ukur  ✅ Ada │    ║
║  │ 2  Osiloskop Analog   Alat Ukur  ❌ Out │    ║
║  │ 3  Solder Station     Perkakas   ✅ Ada │    ║
║  │                                         │    ║
║  │    [○ Pilih] [○ Pilih]  [disabled]      │    ║
║  └─────────────────────────────────────────┘    ║
║                                                  ║
║  ┌──── LOKER 2 (RFID HF) ─────────────────┐    ║
║  │ #  Nama Barang        Kategori   Status │    ║
║  │ ── ─────────────────  ────────   ────── │    ║
║  │ 1  ESP32 DevKit       MCU Board  ✅ Ada │    ║
║  │ 2  Sensor DHT22       Sensor     ✅ Ada │    ║
║  │                                         │    ║
║  │    [○ Pilih] [○ Pilih]                  │    ║
║  └─────────────────────────────────────────┘    ║
║                                                  ║
║  ┌──── LOKER 3 (Barcode) ─────────────────┐    ║
║  │ #  Nama Barang        Kategori   Status │    ║
║  │ ── ─────────────────  ────────   ────── │    ║
║  │ 1  Kabel Jumper Set   Komponen   ✅ Ada │    ║
║  │                                         │    ║
║  │    [○ Pilih]                            │    ║
║  └─────────────────────────────────────────┘    ║
║                                                  ║
║  Barang terpilih: ESP32 DevKit (Loker 2)         ║
║                                                  ║
║  ┌─────────────────────────┐                     ║
║  │   BUKA LOKER & PINJAM → │                     ║
║  └─────────────────────────┘                     ║
║                                                  ║
╚══════════════════════════════════════════════════╝
```

---

## Layar 7 — SCAN AKTIF (Loker Terbuka — Pinjam)

```
╔══════════════════════════════════════════════════╗
║           📤 PEMINJAMAN — LOKER 2                ║
║  ──────────────────────────────────────────      ║
║                                                  ║
║         ┌────────────────────────┐               ║
║         │   🔓 LOKER 2 TERBUKA   │               ║
║         │      (RFID HF)        │               ║
║         └────────────────────────┘               ║
║                                                  ║
║    1. Ambil barang dari loker                    ║
║    2. Scan tag RFID pada reader di loker         ║
║                                                  ║
║    ┌────────────────────────────────────────┐    ║
║    │  ⏳ Menunggu scan...                    │    ║
║    │                                        │    ║
║    │  ░░░░░░░░░░░░░░░░░░░░  scanning...    │    ║
║    └────────────────────────────────────────┘    ║
║                                                  ║
║    ── Setelah tag terdeteksi ──                  ║
║                                                  ║
║    ┌────────────────────────────────────────┐    ║
║    │  ✅ Barang Terdeteksi!                  │    ║
║    │                                        │    ║
║    │  Nama : ESP32 DevKit                   │    ║
║    │  Tag  : AA:BB:CC:DD                    │    ║
║    │  Loker: Loker 2 (RFID HF)             │    ║
║    └────────────────────────────────────────┘    ║
║                                                  ║
║              ┌──────────────────────┐            ║
║              │  SELESAI & TUTUP  →  │            ║
║              └──────────────────────┘            ║
║                                                  ║
╚══════════════════════════════════════════════════╝
```

---

## Layar 8 — PILIH BARANG yang Dikembalikan

```
╔══════════════════════════════════════════════════╗
║  ← Kembali       📥 KEMBALIKAN BARANG           ║
║  ──────────────────────────────────────────      ║
║                                                  ║
║  Barang yang sedang Anda pinjam:                 ║
║                                                  ║
║  ┌─────────────────────────────────────────┐    ║
║  │ #  Nama Barang     Loker Asal   Metode  │    ║
║  │ ── ──────────────  ──────────   ──────  │    ║
║  │ 1  ESP32 DevKit    Loker 2      RFID HF │    ║
║  │ 2  Multimeter      Loker 1      RFID LF │    ║
║  └─────────────────────────────────────────┘    ║
║                                                  ║
║  Terpilih: ESP32 DevKit                          ║
║                                                  ║
║  ┌────────────────────────────────────────┐     ║
║  │  ℹ️  Kembalikan ke: LOKER 2 (RFID HF)  │     ║
║  │  Hanya loker ini yang akan dibuka.     │     ║
║  └────────────────────────────────────────┘     ║
║                                                  ║
║         ┌───────────────────────────┐            ║
║         │  BUKA LOKER & KEMBALIKAN → │            ║
║         └───────────────────────────┘            ║
║                                                  ║
╚══════════════════════════════════════════════════╝
```

---

## Layar 9 — SCAN AKTIF (Loker Terbuka — Kembalikan)

```
╔══════════════════════════════════════════════════╗
║           📥 PENGEMBALIAN — LOKER 2              ║
║  ──────────────────────────────────────────      ║
║                                                  ║
║         ┌────────────────────────┐               ║
║         │   🔓 LOKER 2 TERBUKA   │               ║
║         └────────────────────────┘               ║
║                                                  ║
║    1. Masukkan barang ke dalam loker             ║
║    2. Scan tag RFID pada reader di loker         ║
║                                                  ║
║    ┌────────────────────────────────────────┐    ║
║    │  ⏳ Menunggu scan...                    │    ║
║    └────────────────────────────────────────┘    ║
║                                                  ║
║    ── Jika tag COCOK ──                          ║
║                                                  ║
║    ┌────────────────────────────────────────┐    ║
║    │  ✅ Tag Cocok: ESP32 DevKit (AA:BB)     │    ║
║    └────────────────────────────────────────┘    ║
║                                                  ║
║    ── Jika tag TIDAK COCOK ──                    ║
║                                                  ║
║    ┌────────────────────────────────────────┐    ║
║    │  ⚠️ PERINGATAN!                         │    ║
║    │  Barang yang di-scan BERBEDA dengan    │    ║
║    │  yang dipinjam. Silakan scan ulang     │    ║
║    │  barang yang benar.                    │    ║
║    │                                        │    ║
║    │  Dipinjam : ESP32 DevKit (AA:BB)       │    ║
║    │  Terdeteksi: Sensor DHT22 (CC:DD)      │    ║
║    └────────────────────────────────────────┘    ║
║                                                  ║
║              ┌──────────────────────┐            ║
║              │  SELESAI & TUTUP  →  │            ║
║              └──────────────────────┘            ║
║              (aktif hanya jika tag cocok)        ║
║                                                  ║
╚══════════════════════════════════════════════════╝
```

---

## Layar 10 — SUKSES + Auto-Logout

```
╔══════════════════════════════════════════════════╗
║                                                  ║
║                                                  ║
║             ┌──────────────────┐                 ║
║             │                  │                 ║
║             │     ✅  ✅  ✅    │                 ║
║             │                  │                 ║
║             └──────────────────┘                 ║
║                                                  ║
║         PEMINJAMAN BERHASIL!                     ║
║         ─────────────────────                    ║
║                                                  ║
║    ┌────────────────────────────────────────┐    ║
║    │  Barang : ESP32 DevKit                 │    ║
║    │  Loker  : Loker 2                      │    ║
║    │  Metode : RFID HF                      │    ║
║    │  Waktu  : 2026-05-15 10:30:00          │    ║
║    └────────────────────────────────────────┘    ║
║                                                  ║
║    Anda akan otomatis logout dalam...            ║
║                                                  ║
║               ╔═══════════╗                      ║
║               ║  3 detik  ║                      ║
║               ╚═══════════╝                      ║
║                                                  ║
║    → auth_system/status = IDLE                   ║
║    → Kembali ke Layar 1 (Idle)                   ║
║                                                  ║
╚══════════════════════════════════════════════════╝
```

---

## 🗺️ Peta Navigasi Antar Layar

```
                    ┌─────────┐
                    │ Layar 1 │
                    │  IDLE   │
                    └────┬────┘
                         │
               fingerprint scan
                         │
                ┌────────┴────────┐
                │                 │
           dikenali          tidak dikenali
                │                 │
                │            ┌────┴────┐
                │            │ Layar 2 │
                │            │  Alert  │
                │            └────┬────┘
                │                 │
                │           ┌─────┴─────┐
                │           │  Layar 3  │
                │           │   Form    │
                │           └─────┬─────┘
                │                 │
                │           ┌─────┴─────┐
                │           │  Layar 4  │
                │           │ Enrollment│
                │           └─────┬─────┘
                │                 │
                ├─────────────────┘
                │
          ┌─────┴─────┐
          │  Layar 5  │
          │   Menu    │
          └─────┬─────┘
                │
       ┌────────┴────────┐
       │                 │
  ┌────┴────┐      ┌────┴────┐
  │ Layar 6 │      │ Layar 8 │
  │  Pinjam │      │ Kembali │
  └────┬────┘      └────┬────┘
       │                 │
  ┌────┴────┐      ┌────┴────┐
  │ Layar 7 │      │ Layar 9 │
  │  Scan   │      │  Scan   │
  └────┬────┘      └────┬────┘
       │                 │
       └────────┬────────┘
                │
          ┌─────┴─────┐
          │ Layar 10  │
          │  Sukses   │
          └─────┬─────┘
                │
           auto-logout
                │
          ┌─────┴─────┐
          │  Layar 1  │
          │   IDLE    │
          └───────────┘
```
