import { useState, useEffect } from 'react';
import { getDatabase, ref, set, update, onValue, get } from 'firebase/database';
import { initializeApp } from 'firebase/app';

// Gunakan config yang sama dari env
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Pastikan inisialisasi app khusus untuk simulator agar aman
let app;
try {
  app = initializeApp(firebaseConfig, 'simulatorApp');
} catch (e) {
  // Jika sudah terinisialisasi
  app = initializeApp(firebaseConfig);
}

const db = getDatabase(app);

export default function SimulatorPage() {
  const [enrollQueue, setEnrollQueue] = useState(null);
  const [authStatus, setAuthStatus] = useState(null);
  const [simulatedUid, setSimulatedUid] = useState('TAG_12345');

  // Listen to Auth System
  useEffect(() => {
    const unsub = onValue(ref(db, '/auth_system'), (snap) => {
      setAuthStatus(snap.val());
    });
    return () => unsub();
  }, []);

  // Listen to Enrollment Queue
  useEffect(() => {
    const unsub = onValue(ref(db, '/enrollment_queue/pending'), (snap) => {
      setEnrollQueue(snap.val());
    });
    return () => unsub();
  }, []);

  // --- NODE 0: FINGERPRINT SIMULATOR ---
  const simulateAuthSuccess = async () => {
    await update(ref(db, '/auth_system'), {
      status: 'AUTHORIZED',
      user: 'Budi (Simulator)',
      finger_id: 1,
      mode: 'SCAN'
    });
  };

  const simulateAuthUnknown = async () => {
    await update(ref(db, '/auth_system'), {
      status: 'UNKNOWN',
      user: '',
      finger_id: '',
      mode: 'SCAN'
    });
  };

  const simulateAuthIdle = async () => {
    await update(ref(db, '/auth_system'), {
      status: 'IDLE',
      user: '',
      finger_id: '',
      mode: 'SCAN'
    });
  };

  const simulateEnrollmentSequence = async () => {
    if (!enrollQueue || enrollQueue.status !== 'WAITING') {
      alert("Tidak ada antrean pendaftaran (queue tidak WAITING)!");
      return;
    }

    const delay = (ms) => new Promise(res => setTimeout(res, ms));

    await update(ref(db, '/enrollment_queue/pending'), { status: 'PLACE_FINGER_1', message: 'Tempelkan jari pertama' });
    await delay(1500);
    await update(ref(db, '/enrollment_queue/pending'), { status: 'LIFT_FINGER', message: 'Angkat jari' });
    await delay(1500);
    await update(ref(db, '/enrollment_queue/pending'), { status: 'PLACE_FINGER_2', message: 'Tempelkan jari kedua' });
    await delay(1500);
    await update(ref(db, '/enrollment_queue/pending'), { status: 'PROCESSING', message: 'Memproses data...' });
    await delay(1500);
    await update(ref(db, '/enrollment_queue/pending'), { status: 'SUCCESS', message: 'Berhasil didaftarkan!' });

    // Simulate Node 0 saving the user
    await set(ref(db, `/users/${enrollQueue.finger_id}`), {
      name: enrollQueue.name,
      nim: enrollQueue.nim,
      phone: enrollQueue.phone,
      email: enrollQueue.email,
      finger_id: enrollQueue.finger_id,
      active: true,
      enrolled_at: new Date().toISOString()
    });
  };

  const simulateEnrollmentFail = async () => {
    if (!enrollQueue || enrollQueue.status !== 'WAITING') return;
    await update(ref(db, '/enrollment_queue/pending'), { status: 'FAILED', message: 'Gagal membaca sensor' });
  };

  // --- NODE 1/2/3: LOKER & RFID/BARCODE SIMULATOR ---
  const simulateScanTag = async (lokerId) => {
    if (!simulatedUid.trim()) return;

    await update(ref(db, `/lockers/${lokerId}`), {
      last_uid: simulatedUid,
      last_scan_time: new Date().toISOString()
    });

    // Cek apakah master_barang sudah ada
    const snap = await get(ref(db, `/master_barang/${simulatedUid}`));
    if (!snap.exists()) {
      // Daftarkan sebagai barang baru (seperti firmware asli)
      await set(ref(db, `/master_barang/${simulatedUid}`), {
        tag_id: simulatedUid,
        barcode: simulatedUid,
        tipe: lokerId === 'loker_03' ? 'BARCODE' : 'RFID',
        loker: lokerId,
        loker_assignment: lokerId,
        nama: `Barang Sim_${simulatedUid}`,
        status: 'tersedia',
        current_borrower: '',
        kategori: 'Simulator',
        timestamp: new Date().toISOString()
      });
    }

    alert(`Simulasi Scan Tag [${simulatedUid}] di ${lokerId} berhasil dikirim!`);
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6 text-white font-sans">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-blue-400">🛠️ Hardware Simulator</h1>
          <p className="text-gray-400 mt-2">
            Gunakan panel ini untuk mensimulasikan aksi perangkat keras (fingerprint & RFID/Barcode) 
            tanpa menggunakan mikrokontroler fisik.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* FINGERPRINT SIMULATOR */}
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
              <span className="text-2xl">👆</span> Node 0 (Fingerprint)
            </h2>
            
            <div className="bg-gray-900 p-3 rounded-lg mb-4 text-xs font-mono text-gray-400">
              [Status DB] /auth_system: <span className="text-green-400">{authStatus?.status || 'null'}</span>
              <br />
              [Status DB] /enrollment: <span className="text-blue-400">{enrollQueue?.status || 'null'}</span>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-400 uppercase mb-2">Simulasi Scan Jari</h3>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={simulateAuthSuccess} className="bg-green-600 hover:bg-green-500 py-2 rounded-lg font-medium">Scan Dikenali (AUTHORIZED)</button>
                  <button onClick={simulateAuthUnknown} className="bg-red-600 hover:bg-red-500 py-2 rounded-lg font-medium">Scan Gagal (UNKNOWN)</button>
                  <button onClick={simulateAuthIdle} className="bg-gray-700 hover:bg-gray-600 py-2 rounded-lg font-medium col-span-2">Reset ke IDLE</button>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-700">
                <h3 className="text-sm font-semibold text-gray-400 uppercase mb-2">Simulasi Pendaftaran (Enrollment)</h3>
                <p className="text-xs text-gray-500 mb-3">Untuk menguji pendaftaran, buka <strong>/register</strong> di tab lain, isi form, lalu klik tombol di bawah ini.</p>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={simulateEnrollmentSequence} 
                    disabled={!enrollQueue || enrollQueue.status !== 'WAITING'}
                    className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed py-2 rounded-lg font-medium"
                  >
                    Simulasi Berhasil
                  </button>
                  <button 
                    onClick={simulateEnrollmentFail}
                    disabled={!enrollQueue || enrollQueue.status !== 'WAITING'}
                    className="bg-orange-600 hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed py-2 rounded-lg font-medium"
                  >
                    Simulasi Gagal
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* LOKER & RFID SIMULATOR */}
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
              <span className="text-2xl">📦</span> Node 1, 2, 3 (Loker & Tag)
            </h2>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-400 uppercase mb-1">UID Tag / Barcode yang disimulasikan</label>
              <input 
                type="text" 
                value={simulatedUid}
                onChange={(e) => setSimulatedUid(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2 text-white font-mono focus:border-blue-500 focus:outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">Ubah nilai ini untuk mensimulasikan scan barang yang salah/benar pada halaman Peminjaman atau Pengembalian.</p>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-400 uppercase mb-1">Simulasi Scan di Reader</h3>
              <button 
                onClick={() => simulateScanTag('loker_01')} 
                className="w-full bg-gray-700 hover:bg-gray-600 border border-gray-600 py-3 rounded-lg font-medium flex justify-between px-4"
              >
                <span>Tembak Tag ke Loker 1</span>
                <span className="text-xs bg-gray-800 px-2 py-1 rounded text-gray-400">RFID LF</span>
              </button>
              
              <button 
                onClick={() => simulateScanTag('loker_02')} 
                className="w-full bg-gray-700 hover:bg-gray-600 border border-gray-600 py-3 rounded-lg font-medium flex justify-between px-4"
              >
                <span>Tembak Tag ke Loker 2</span>
                <span className="text-xs bg-gray-800 px-2 py-1 rounded text-gray-400">RFID HF</span>
              </button>
              
              <button 
                onClick={() => simulateScanTag('loker_03')} 
                className="w-full bg-gray-700 hover:bg-gray-600 border border-gray-600 py-3 rounded-lg font-medium flex justify-between px-4"
              >
                <span>Tembak Barcode ke Loker 3</span>
                <span className="text-xs bg-gray-800 px-2 py-1 rounded text-gray-400">Barcode</span>
              </button>
            </div>
          </div>

        </div>

        <div className="mt-8 text-center">
          <a href="/" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">
            Buka Web App di Tab Baru ↗
          </a>
        </div>
      </div>
    </div>
  );
}
