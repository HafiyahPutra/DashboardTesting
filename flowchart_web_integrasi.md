# 🗺️ Flowchart Lengkap — Web × Hardware × Firebase
## Sistem Peminjaman & Pengembalian Barang IoT Inventory

> **Tujuan dokumen ini**: Menjadi "peta jalan" untuk vibe coding. Setiap flowchart di bawah merepresentasikan satu fitur/halaman yang harus dibangun di web, beserta interaksi ke hardware (Node 0-3) dan Firebase RTDB.

---

## 📦 Struktur Firebase RTDB (Target Akhir)

```
firebase-rtdb/
├── auth_system/
│   ├── status: "IDLE" | "AUTHORIZED"
│   ├── user: "Raihan"
│   ├── finger_id: "3"
│   └── mode: "SCAN" | "ENROLL"
│
├── enrollment_queue/pending/
│   ├── status: "WAITING"|"PLACE_FINGER_1"|"SUCCESS"|"FAILED"
│   ├── finger_id: 3
│   ├── name, nim, phone, email
│   └── message: "..."
│
├── users/
│   └── {finger_id}/
│       ├── name, nim, phone, email, finger_id
│       ├── enrolled_at: "2026-05-15 10:00:00"
│       └── active: true
│
├── master_barang/
│   └── {tag_id atau barcode}/
│       ├── nama: "Multimeter Digital"
│       ├── kategori: "Alat Ukur"
│       ├── tipe: "RFID_LF" | "RFID_HF" | "BARCODE"
│       ├── tag_id: "AA:BB:CC:DD"
│       ├── loker_assignment: "loker_02"
│       ├── status: "tersedia" | "dipinjam"
│       ├── current_borrower: null | "Raihan"
│       └── registered_by: "Admin"
│
├── loan_records/
│   └── {push_id}/
│       ├── user_id: "3"
│       ├── user_name: "Raihan"
│       ├── item_id: "AA:BB:CC:DD"
│       ├── item_name: "Multimeter"
│       ├── loker_asal: "loker_02"
│       ├── metode: "RFID_HF"
│       ├── timestamp_pinjam: "2026-05-15 10:30:00"
│       ├── timestamp_kembali: null
│       └── status: "active" | "returned"
│
├── lockers/
│   └── loker_01/ loker_02/ loker_03/
│       ├── status: "LOCKED" | "UNLOCKED"
│       ├── command: "OPEN" | "CLOSE"
│       ├── user: "Raihan"
│       ├── last_uid: "AA:BB:CC:DD"
│       └── updated_at: "..."
│
├── access_log/ (push)
│   └── {id}/ → loker, user, action, uid, item, timestamp
│
└── auth_log/ (push)
    └── {id}/ → user, finger_id, timestamp
```

---

## 🔄 FLOW 1 — Alur Utama Keseluruhan Sistem

```mermaid
flowchart TD
    START([🏁 User Mendekati Alat]) --> FP[👆 Tempelkan Jari di Sensor\nNode 0 - AS608]

    FP --> CHECK_FP{Node 0:\nSidik jari dikenali?}
    CHECK_FP -- "❌ Tidak dikenali" --> NEW{User mau\ndaftar baru?}
    NEW -- "Ya" --> FLOW_REG[→ FLOW 2: Registrasi]
    NEW -- "Tidak" --> START

    CHECK_FP -- "✅ Dikenali" --> AUTH_FB["Node 0 → Firebase:\nauth_system/status = AUTHORIZED\nauth_system/user = nama\nauth_system/finger_id = id"]

    AUTH_FB --> WEB_DETECT["Web mendengar\nonValue(/auth_system)\nstatus berubah → AUTHORIZED"]

    WEB_DETECT --> MENU["🖥️ Web Tampilkan Menu:\n📤 Pinjam Barang\n📥 Kembalikan Barang"]

    MENU --> PINJAM_BTN["Klik PINJAM"] --> FLOW_PINJAM[→ FLOW 3: Peminjaman]
    MENU --> KEMBALI_BTN["Klik KEMBALIKAN"] --> FLOW_KEMBALI[→ FLOW 4: Pengembalian]

    FLOW_PINJAM --> DONE_P["✅ Selesai Pinjam"]
    FLOW_KEMBALI --> DONE_K["✅ Selesai Kembali"]
    FLOW_REG --> AUTH_FB

    DONE_P --> LOGOUT["Web → Firebase:\nauth_system/status = IDLE\nauto-logout 3 detik"]
    DONE_K --> LOGOUT
    LOGOUT --> START

    style START fill:#1a1a2e,stroke:#00e5ff,color:#fff
    style AUTH_FB fill:#1b2d1b,stroke:#76ff03,color:#fff
    style WEB_DETECT fill:#1a1a2e,stroke:#e040fb,color:#fff
    style MENU fill:#0d2137,stroke:#00e5ff,color:#fff
    style LOGOUT fill:#2d1b1b,stroke:#ff5252,color:#fff
```

---

## 🔄 FLOW 2 — Registrasi Mahasiswa Baru

```mermaid
flowchart TD
    A([User Baru Tempelkan Jari]) --> B["Node 0: fingerSearch() gagal\n→ Jari tidak dikenali"]
    B --> C["🖥️ Web: Tampilkan Layar\n'Sidik Jari Tidak Dikenali'\n[BATAL] [DAFTAR BARU]"]

    C --> D["User klik DAFTAR BARU"]
    D --> E["🖥️ Web: Form Registrasi\n- NIM\n- Nama Lengkap\n- Email Mahasiswa\n- No. Telepon"]

    E --> F["User isi form → klik LANJUT"]
    F --> G["Web cari slot kosong:\nget(/users) → cari ID 1-127 yg belum ada"]
    G --> H["Web → Firebase:\nset(/enrollment_queue/pending) = {\n  status: WAITING,\n  finger_id: slot,\n  name, nim, phone, email\n}"]

    H --> I["Node 0 Stream Callback:\nmendeteksi status = WAITING\nenrollRequested = true"]

    I --> J["Node 0 → Firebase:\nstatus = PLACE_FINGER_1\n'Tempelkan jari ke sensor 1/2'"]
    J --> K["Web: onValue() mendengar\n→ tampilkan instruksi + animasi pulse"]

    K --> L["👆 User tempel jari ke-1"]
    L --> M["Node 0 → Firebase:\nstatus = LIFT_FINGER\n'Angkat jari dari sensor'"]

    M --> N["👆 User tempel jari ke-2"]
    N --> O["Node 0: createModel() + storeModel()"]

    O --> P{Berhasil?}
    P -- "❌ Gagal" --> Q["Node 0 → Firebase:\nstatus = FAILED\nmessage = 'Gagal...'"]
    Q --> R["Web: Tampilkan error\n+ tombol COBA LAGI"]
    R --> E

    P -- "✅ Berhasil" --> S["Node 0 → Firebase:\nset(/users/{id}) = {\n  name, nim, phone, email,\n  finger_id, enrolled_at\n}"]
    S --> T["Node 0 → Firebase:\nstatus = SUCCESS"]
    T --> U["Web: Tampilkan\n'Registrasi Berhasil! 🎉'\n[MASUK KE MENU]"]
    U --> V([→ Lanjut ke Menu Utama FLOW 1])

    style A fill:#1b2a3d,stroke:#ff9800,color:#fff
    style H fill:#1b2d1b,stroke:#76ff03,color:#fff
    style S fill:#1b2d1b,stroke:#76ff03,color:#fff
    style U fill:#0d2137,stroke:#00e5ff,color:#fff
```

---

## 🔄 FLOW 3 — Peminjaman Barang

```mermaid
flowchart TD
    A([Menu: Klik PINJAM]) --> B["🖥️ Web: Baca /lockers/* dan /master_barang/*\nTampilkan daftar 3 loker + isi barangnya"]

    B --> C["User lihat isi loker\n(nama barang, kategori, status)"]
    C --> D["User pilih barang\nyang ingin dipinjam"]

    D --> E["🖥️ Web → Firebase:\n/lockers/loker_XX/command = OPEN"]

    E --> F["Node Loker (1/2/3)\nStream callback: command = OPEN\n→ digitalWrite(RELAY, HIGH)\n→ Solenoid terbuka"]

    F --> G["Node → Firebase:\n/lockers/loker_XX/status = UNLOCKED"]
    G --> H["🖥️ Web mendeteksi UNLOCKED\nTampilkan: 'Loker Terbuka 🔓\nSilakan ambil barang dan scan tag'"]

    H --> I["👆 User ambil barang\ndan scan tag RFID/Barcode\ndi reader pada loker"]

    I --> J["Node Loker mendeteksi tag/barcode\nBaca UID / barcode string"]
    J --> K["Node → Firebase:\nSimpan ke /master_barang/{id}\natau update data barang"]

    K --> L["🖥️ Web: onValue() mendeteksi\nbarang terdeteksi\n→ Tampilkan: '✅ ESP32 DevKit (AA:BB:CC:DD)'"]

    L --> M["User klik SELESAI & TUTUP"]
    M --> N["🖥️ Web → Firebase:\n/lockers/loker_XX/command = CLOSE"]

    N --> O["Node Loker:\ncommand = CLOSE\n→ Solenoid terkunci"]
    O --> P["Node → Firebase:\nstatus = LOCKED"]

    P --> Q["🖥️ Web: Catat Peminjaman\npush(/loan_records) = {\n  user_name, item_id, item_name,\n  loker_asal, metode, timestamp_pinjam,\n  status: active\n}"]

    Q --> R["Web: Update /master_barang/{id}\nstatus = dipinjam\ncurrent_borrower = nama user"]

    R --> S["🖥️ Tampilkan:\n'✅ Peminjaman Berhasil'\nAuto-logout 3 detik"]
    S --> T([→ Kembali ke Layar Awal])

    style A fill:#0d2137,stroke:#00e5ff,color:#fff
    style E fill:#1a1a2e,stroke:#e040fb,color:#fff
    style F fill:#1b2d1b,stroke:#76ff03,color:#fff
    style Q fill:#1b2a3d,stroke:#ff9800,color:#fff
    style S fill:#2d1b1b,stroke:#ff5252,color:#fff
```

---

## 🔄 FLOW 4 — Pengembalian Barang (Guided Return)

```mermaid
flowchart TD
    A([Menu: Klik KEMBALIKAN]) --> B["🖥️ Web: Query /loan_records\nfilter: user_name = user aktif\nAND status = active"]

    B --> C["Tampilkan daftar barang\nyang sedang dipinjam user ini\n+ info loker asal + metode scan"]

    C --> D["User pilih barang\nyang akan dikembalikan"]

    D --> E["🖥️ Web: Baca loker_asal dari loan_record\nTampilkan: 'Kembalikan ke LOKER 2 RFID HF'\n→ Hanya boleh buka loker ini"]

    E --> F["🖥️ Web → Firebase:\n/lockers/{loker_asal}/command = OPEN"]

    F --> G["Node Loker yg sesuai:\nStream → OPEN → Solenoid terbuka\n→ Sensor RFID/Barcode aktif"]

    G --> H["🖥️ Web: Tampilkan\n'Loker Terbuka — Masukkan barang\ndan scan tag ke reader'"]

    H --> I["👆 User masukkan barang\ndan scan tag/barcode"]

    I --> J["Node mendeteksi tag/barcode\n→ Kirim ke Firebase"]

    J --> K{"🖥️ Web: VALIDASI\ntag_scanned == item_tag\ndi loan_record?"}

    K -- "❌ Tidak cocok" --> L["⚠️ PERINGATAN!\n'Barang yang di-scan berbeda\ndengan yang dipinjam'\nMinta scan ulang"]
    L --> I

    K -- "✅ Cocok" --> M["User klik SELESAI & TUTUP"]
    M --> N["🖥️ Web → Firebase:\n/lockers/{loker}/command = CLOSE"]

    N --> O["Node: Solenoid terkunci\n→ status = LOCKED"]

    O --> P["🖥️ Web: Update loan_record:\ntimestamp_kembali = now\nstatus = returned"]

    P --> Q["Web: Update /master_barang/{id}:\nstatus = tersedia\ncurrent_borrower = null"]

    Q --> R["🖥️ Tampilkan:\n'✅ Pengembalian Berhasil'\nAuto-logout 3 detik"]
    R --> S([→ Kembali ke Layar Awal])

    style A fill:#0d2137,stroke:#00e5ff,color:#fff
    style E fill:#1a1a2e,stroke:#e040fb,color:#fff
    style K fill:#1b2a3d,stroke:#ff9800,color:#fff
    style L fill:#2d1b1b,stroke:#ff5252,color:#fff
    style R fill:#1b2d1b,stroke:#76ff03,color:#fff
```

---

## 🔄 FLOW 5 — Admin: Monitoring & Tambah Barang

```mermaid
flowchart TD
    A([Admin Login]) --> B["🖥️ Admin Dashboard"]

    B --> C["📊 Monitoring Barang\nonValue(/master_barang)"]
    B --> D["📋 Log Aktivitas\nonValue(/access_log)\nonValue(/auth_log)"]
    B --> E["➕ Tambah Barang Baru"]

    C --> C1["Filter: Jenis, Kategori,\nMetode LF/HF/Barcode\nStatus tersedia/dipinjam"]
    C1 --> C2["Tabel real-time:\nNama, ID Tag, Loker, Status,\nPeminjam, Terakhir Update"]

    D --> D1["Tabel Log:\nSiapa meminjam apa\nKapan pinjam & kembali\nDari loker mana\nFingerprint ID user"]

    E --> E1["Form: Nama Barang,\nJenis, Kategori"]
    E1 --> E2{"Pilih Metode\nPenempatan"}
    E2 -- "RFID LF" --> E3["Assign → Loker 1\nBuka loker 1 → scan tag LF"]
    E2 -- "RFID HF" --> E4["Assign → Loker 2\nBuka loker 2 → scan tag HF"]
    E2 -- "Barcode" --> E5["Assign → Loker 3\nBuka loker 3 → scan barcode"]

    E3 --> E6["Node mendeteksi tag/barcode\n→ Data masuk /master_barang"]
    E4 --> E6
    E5 --> E6

    E6 --> E7["Admin update di Firebase:\nnama, kategori, loker_assignment\nstatus = tersedia"]
    E7 --> E8([✅ Barang Terdaftar])

    style B fill:#0d2137,stroke:#00e5ff,color:#fff
    style E2 fill:#1b2a3d,stroke:#ff9800,color:#fff
    style E8 fill:#1b2d1b,stroke:#76ff03,color:#fff
```

---

## 🔄 FLOW 6 — Komunikasi Realtime Web ↔ Firebase ↔ Hardware

```mermaid
sequenceDiagram
    participant U as 👤 User
    participant W as 🖥️ Web App
    participant FB as 🔥 Firebase RTDB
    participant N0 as 🔐 Node 0 Fingerprint
    participant NL as ⚙️ Node Loker 1/2/3

    Note over U,NL: ═══ AUTENTIKASI ═══
    U->>N0: Tempel jari
    N0->>N0: fingerSearch() lokal
    N0->>FB: auth_system/status = AUTHORIZED
    FB-->>W: onValue() trigger
    W->>W: Tampilkan Menu Pinjam/Kembali

    Note over U,NL: ═══ PEMINJAMAN ═══
    U->>W: Klik "Pinjam" → Pilih Loker
    W->>FB: lockers/loker_02/command = OPEN
    FB-->>NL: Stream callback → OPEN
    NL->>NL: Solenoid terbuka + sensor aktif
    NL->>FB: lockers/loker_02/status = UNLOCKED
    U->>NL: Ambil barang + scan tag RFID
    NL->>FB: master_barang/{uid} = data
    FB-->>W: onValue() → tampilkan barang
    U->>W: Klik "Selesai & Tutup"
    W->>FB: command = CLOSE
    FB-->>NL: Stream → CLOSE → solenoid kunci
    W->>FB: push(/loan_records) = data pinjam
    W->>FB: master_barang/{id}/status = dipinjam

    Note over U,NL: ═══ PENGEMBALIAN ═══
    U->>W: Klik "Kembalikan" → Pilih barang
    W->>W: Cari loker_asal dari loan_record
    W->>FB: lockers/{loker_asal}/command = OPEN
    FB-->>NL: Stream → OPEN
    U->>NL: Masukkan barang + scan tag
    NL->>FB: master_barang/{uid}
    FB-->>W: onValue() → validasi tag == loan
    W->>FB: command = CLOSE
    W->>FB: loan_records/{id}/status = returned
    W->>FB: master_barang/{id}/status = tersedia

    Note over U,NL: ═══ AUTO-LOGOUT ═══
    W->>FB: auth_system/status = IDLE
    FB-->>N0: Stream → status = IDLE
    W->>W: Kembali ke layar awal
```

---

## 🏗️ Mapping: Halaman Web yang Harus Dibuat

| # | Halaman/Komponen | Firebase Path yang Digunakan | Fungsi |
|---|-----------------|------------------------------|--------|
| 1 | **Layar Idle** | `onValue(/auth_system)` | Menunggu fingerprint, deteksi AUTHORIZED |
| 2 | **Form Registrasi** | `set(/enrollment_queue/pending)`, `onValue()` | Input NIM/Nama/Email/Telp → trigger Node 0 |
| 3 | **Menu Utama** | `get(/loan_records)` filter user | Tampilkan Pinjam / Kembalikan |
| 4 | **Halaman Pinjam** | `get(/master_barang)`, `get(/lockers)` | Pilih loker → lihat isi → buka loker |
| 5 | **Halaman Scan Aktif** | `set(/lockers/*/command)`, `onValue(/master_barang)` | Loker terbuka, tunggu scan, tampilkan hasil |
| 6 | **Halaman Kembalikan** | `get(/loan_records)` filter active | Daftar barang dipinjam → guided return |
| 7 | **Layar Sukses** | `set(/auth_system/status, IDLE)` | Konfirmasi + auto-logout 3 detik |
| 8 | **Admin Dashboard** | `onValue(/master_barang)`, `onValue(/access_log)` | Monitoring, log, tambah barang |

---

## 📌 Catatan Penting untuk Coding

### Yang Sudah Ada (Tidak Perlu Diubah)
- ✅ Node 0 firmware: scan jari, enrollment, write `/auth_system`
- ✅ Node 1/2/3 firmware: stream `/lockers/*/command`, buka/kunci solenoid, scan RFID/barcode
- ✅ Firebase config & anonymous auth

### Yang Harus Dibangun di Web
- 🔨 Alur Pinjam/Kembalikan (FLOW 3 & 4)
- 🔨 Validasi barang saat pengembalian (tag matching)
- 🔨 `loan_records` — pencatatan transaksi pinjam/kembali
- 🔨 Update `master_barang/{id}/status` saat pinjam/kembali
- 🔨 Auto-logout setelah transaksi selesai
- 🔨 Admin panel: monitoring + tambah barang + log

### Firebase Listener yang Dibutuhkan Web
```javascript
// 1. Auth status (sudah ada)
onValue(ref(db, "/auth_system"), callback)

// 2. Status loker (sudah ada)
onValue(ref(db, "/lockers/loker_XX"), callback)

// 3. Deteksi barang baru discan (BARU)
onValue(ref(db, "/master_barang"), callback)

// 4. Loan records untuk user aktif (BARU)
onValue(ref(db, "/loan_records"), callback)
```
