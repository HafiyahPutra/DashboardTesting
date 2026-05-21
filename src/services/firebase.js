// src/services/firebase.js
// Konfigurasi Firebase dan fungsi-fungsi RTDB untuk IoT Inventory System
// Terintegrasi dengan Node 0 (Fingerprint), Node 1 (RFID LF), Node 2 (RFID HF), Node 3 (Barcode CAM)

import { initializeApp } from "firebase/app";
import {
  getDatabase,
  ref,
  set,
  get,
  push,
  onValue,
  update,
  query,
  orderByChild,
  equalTo,
} from "firebase/database";

// ============================================================
//  KONFIGURASI FIREBASE
// ============================================================
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL:       import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db  = getDatabase(app);

// ============================================================
//  AUTH SYSTEM — Node 0 Fingerprint
// ============================================================

/** Listen status autentikasi secara realtime */
export function listenAuthStatus(callback) {
  const unsubscribe = onValue(ref(db, "/auth_system"), (snap) => {
    callback(snap.exists() ? snap.val() : null);
  });
  return unsubscribe;
}

/** Set auth status ke IDLE (logout) */
export async function setAuthStatusIdle() {
  await update(ref(db, "/auth_system"), {
    status: "IDLE",
    user: "",
    finger_id: "",
  });
}

// ============================================================
//  ENROLLMENT — Registrasi Sidik Jari Baru
// ============================================================

/** Cari slot finger_id kosong (1-127) */
export async function getNextAvailableSlot() {
  const snapshot = await get(ref(db, "/users"));
  const usedIds  = snapshot.exists()
    ? Object.keys(snapshot.val()).map(Number)
    : [];

  for (let i = 1; i <= 127; i++) {
    if (!usedIds.includes(i)) return i;
  }
  return null; // penuh
}

/** Kirim permintaan enrollment ke ESP32 via Firebase */
export async function submitEnrollmentRequest({ name, nim, phone, email }) {
  const fingerId = await getNextAvailableSlot();
  if (!fingerId) throw new Error("Kapasitas sensor penuh (maks 127 jari)");

  await set(ref(db, "/enrollment_queue/pending"), {
    status:     "WAITING",
    finger_id:  fingerId,
    name,
    nim,
    phone,
    email,
    created_at: new Date().toISOString(),
  });

  return fingerId;
}

/** Listen status enrollment secara realtime */
export function listenEnrollmentStatus(callback) {
  const unsubscribe = onValue(ref(db, "/enrollment_queue/pending"), (snap) => {
    callback(snap.exists() ? snap.val() : null);
  });
  return unsubscribe;
}

/** Reset/bersihkan enrollment queue setelah selesai */
export async function clearEnrollmentQueue() {
  await update(ref(db, "/enrollment_queue/pending"), {
    status: "CLEARED",
  });
}

// ============================================================
//  USERS — Manajemen Pengguna
// ============================================================

/** Ambil semua user terdaftar */
export async function getAllUsers() {
  const snapshot = await get(ref(db, "/users"));
  if (!snapshot.exists()) return [];
  return Object.values(snapshot.val());
}

/** Listen semua user secara realtime */
export function listenAllUsers(callback) {
  const unsubscribe = onValue(ref(db, "/users"), (snap) => {
    callback(snap.exists() ? Object.values(snap.val()) : []);
  });
  return unsubscribe;
}

// ============================================================
//  LOCKER — Kontrol Loker
// ============================================================

/** Listen status loker (hanya string status) */
export function listenLockerStatus(lokerId, callback) {
  const unsubscribe = onValue(ref(db, `/lockers/${lokerId}`), (snap) => {
    callback(snap.exists() ? snap.val().status : "LOCKED");
  });
  return unsubscribe;
}

/** Listen seluruh data loker secara realtime (status, last_uid, last_scan_time, dll) */
export function listenLockerFull(lokerId, callback) {
  const unsubscribe = onValue(ref(db, `/lockers/${lokerId}`), (snap) => {
    callback(snap.exists() ? snap.val() : null);
  });
  return unsubscribe;
}

/** Listen semua loker */
export function listenAllLockers(callback) {
  const unsubscribe = onValue(ref(db, "/lockers"), (snap) => {
    callback(snap.exists() ? snap.val() : {});
  });
  return unsubscribe;
}

/** Buka loker — set command ke OPEN */
export async function openLocker(lokerId) {
  await set(ref(db, `/lockers/${lokerId}/command`), "OPEN");
}

/** Tutup loker — set command ke CLOSE */
export async function closeLocker(lokerId) {
  await set(ref(db, `/lockers/${lokerId}/command`), "CLOSE");
}

/** Tutup SEMUA loker — safety net saat logout/idle */
export async function closeAllLockers() {
  await Promise.all([
    set(ref(db, `/lockers/loker_01/command`), "CLOSE"),
    set(ref(db, `/lockers/loker_02/command`), "CLOSE"),
    set(ref(db, `/lockers/loker_03/command`), "CLOSE"),
  ]);
}

// ============================================================
//  MASTER BARANG — Inventaris
// ============================================================

/** Ambil semua master barang (one-shot) */
export async function getMasterBarang() {
  const snapshot = await get(ref(db, "/master_barang"));
  if (!snapshot.exists()) return {};
  return snapshot.val();
}

/** Listen master barang secara realtime */
export function listenMasterBarang(callback) {
  const unsubscribe = onValue(ref(db, "/master_barang"), (snap) => {
    callback(snap.exists() ? snap.val() : {});
  });
  return unsubscribe;
}

/** Update status barang (tersedia / dipinjam) */
export async function updateBarangStatus(tagId, status) {
  await update(ref(db, `/master_barang/${tagId}`), { status });
}

/** Update borrower + status barang sekaligus */
export async function updateBarangBorrower(tagId, borrowerName, status) {
  await update(ref(db, `/master_barang/${tagId}`), {
    status,
    current_borrower: borrowerName,
  });
}

/** Update multiple field barang (untuk admin) */
export async function updateBarang(tagId, data) {
  await update(ref(db, `/master_barang/${tagId}`), data);
}

/** Daftarkan barang baru ke sistem (untuk admin) */
export async function registerBarang(tagId, data) {
  await set(ref(db, `/master_barang/${tagId}`), data);
}

// ============================================================
//  LOAN RECORDS — Peminjaman
// ============================================================

/** Catat peminjaman baru — fix: gunakan push() dari firebase SDK */
export async function recordLoan(loanData) {
  const newRef = push(ref(db, "/loan_records"));
  await set(newRef, loanData);
  return newRef.key;
}

/** Ambil loan records untuk user tertentu (one-shot) */
export async function getLoanRecords(userName) {
  const snapshot = await get(ref(db, "/loan_records"));
  if (!snapshot.exists()) return [];
  const records = Object.entries(snapshot.val()).map(([id, data]) => ({ id, ...data }));
  return records.filter(record => record.user_name === userName);
}

/** Ambil semua loan records (one-shot) */
export async function getAllLoanRecords() {
  const snapshot = await get(ref(db, "/loan_records"));
  if (!snapshot.exists()) return [];
  return Object.entries(snapshot.val()).map(([id, data]) => ({ id, ...data }));
}

/** Listen loan records secara realtime */
export function listenLoanRecords(callback) {
  const unsubscribe = onValue(ref(db, "/loan_records"), (snap) => {
    if (!snap.exists()) {
      callback([]);
      return;
    }
    const records = Object.entries(snap.val()).map(([id, data]) => ({ id, ...data }));
    callback(records);
  });
  return unsubscribe;
}

/** Update loan saat pengembalian */
export async function updateLoanReturn(loanId, returnData) {
  await update(ref(db, `/loan_records/${loanId}`), returnData);
}

// ============================================================
//  LOGS — Access Log & Auth Log
// ============================================================

/** Ambil access log */
export async function getAccessLog() {
  const snapshot = await get(ref(db, "/access_log"));
  if (!snapshot.exists()) return [];
  return Object.entries(snapshot.val()).map(([id, data]) => ({ id, ...data }));
}

/** Listen access log secara realtime */
export function listenAccessLog(callback) {
  const unsubscribe = onValue(ref(db, "/access_log"), (snap) => {
    if (!snap.exists()) { callback([]); return; }
    callback(Object.entries(snap.val()).map(([id, data]) => ({ id, ...data })));
  });
  return unsubscribe;
}

/** Ambil auth log */
export async function getAuthLog() {
  const snapshot = await get(ref(db, "/auth_log"));
  if (!snapshot.exists()) return [];
  return Object.entries(snapshot.val()).map(([id, data]) => ({ id, ...data }));
}

/** Listen auth log secara realtime */
export function listenAuthLog(callback) {
  const unsubscribe = onValue(ref(db, "/auth_log"), (snap) => {
    if (!snap.exists()) { callback([]); return; }
    callback(Object.entries(snap.val()).map(([id, data]) => ({ id, ...data })));
  });
  return unsubscribe;
}
