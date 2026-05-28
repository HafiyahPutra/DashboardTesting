import { useState, useEffect } from 'react';
import { getDatabase, ref, set, update, onValue, get } from 'firebase/database';
import { initializeApp } from 'firebase/app';
import BuildIcon from '@mui/icons-material/Build';
import PanToolIcon from '@mui/icons-material/PanTool';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';

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

// Loker IDs
const LOKER_IDS = ['loker_01', 'loker_02', 'loker_03'];

export default function SimulatorPage() {
  const [enrollQueue, setEnrollQueue] = useState(null);
  const [authStatus, setAuthStatus] = useState(null);
  const [simulatedUid, setSimulatedUid] = useState('TAG_12345');
  const [lockerStatuses, setLockerStatuses] = useState({});
  const [autoRespondEnabled, setAutoRespondEnabled] = useState(true);
  const [logs, setLogs] = useState([]);

  const addLog = (message) => {
    const time = new Date().toLocaleTimeString('id-ID');
    setLogs((prev) => [`[${time}] ${message}`, ...prev.slice(0, 19)]);
  };

  // Listen to Auth System
  useEffect(() => {
    const unsub = onValue(ref(db, '/auth_system'), (snap) => {
      const data = snap.val();
      setAuthStatus(data);
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

  // Listen to ALL Lockers — auto-respond to commands (simulasi perilaku Node 1/2/3)
  useEffect(() => {
    const unsubs = LOKER_IDS.map((lokerId) => {
      return onValue(ref(db, `/lockers/${lokerId}`), async (snap) => {
        const data = snap.val();
        if (!data) return;

        // Update UI state
        setLockerStatuses((prev) => ({ ...prev, [lokerId]: data }));

        // Auto-respond: simulasi perilaku firmware ESP32
        // Saat command = OPEN dan status belum UNLOCKED → set UNLOCKED
        // Saat command = CLOSE dan status belum LOCKED → set LOCKED
        if (autoRespondEnabled) {
          if (data.command === 'OPEN' && data.status !== 'UNLOCKED') {
            addLog(`⚡ ${lokerId}: command=OPEN → Solenoid UNLOCK`);
            await update(ref(db, `/lockers/${lokerId}`), {
              status: 'UNLOCKED',
              updated_at: new Date().toISOString(),
            });
          } else if (data.command === 'CLOSE' && data.status !== 'LOCKED') {
            addLog(`🔒 ${lokerId}: command=CLOSE → Solenoid LOCK`);
            await update(ref(db, `/lockers/${lokerId}`), {
              status: 'LOCKED',
              updated_at: new Date().toISOString(),
            });
          }
        }
      });
    });

    return () => unsubs.forEach((unsub) => unsub());
  }, [autoRespondEnabled]);

  // Auto-lock semua loker saat auth_system kembali ke IDLE
  useEffect(() => {
    if (authStatus?.status === 'IDLE' && autoRespondEnabled) {
      // Cek apakah ada loker yang masih terbuka
      const openLockers = LOKER_IDS.filter(
        (id) => lockerStatuses[id]?.status === 'UNLOCKED'
      );
      if (openLockers.length > 0) {
        addLog(`🔄 Auth IDLE — Auto-lock ${openLockers.length} loker terbuka`);
        openLockers.forEach(async (lokerId) => {
          await update(ref(db, `/lockers/${lokerId}`), {
            command: 'CLOSE',
            status: 'LOCKED',
            updated_at: new Date().toISOString(),
          });
        });
      }
    }
  }, [authStatus?.status, autoRespondEnabled]);

  // --- NODE 0: FINGERPRINT SIMULATOR ---
  const simulateAuthSuccess = async () => {
    addLog('👆 Fingerprint: User dikenali → AUTHORIZED');
    await update(ref(db, '/auth_system'), {
      status: 'AUTHORIZED',
      user: 'Budi (Simulator)',
      finger_id: 1,
      mode: 'SCAN'
    });
  };

  const simulateAuthUnknown = async () => {
    addLog('❌ Fingerprint: User tidak dikenali → UNKNOWN');
    await update(ref(db, '/auth_system'), {
      status: 'UNKNOWN',
      user: '',
      finger_id: '',
      mode: 'SCAN'
    });
  };

  const simulateAuthIdle = async () => {
    addLog('🔄 Reset ke IDLE — lock semua loker');
    // Reset auth
    await update(ref(db, '/auth_system'), {
      status: 'IDLE',
      user: '',
      finger_id: '',
      mode: 'SCAN'
    });
    // Force-close semua loker saat idle
    for (const lokerId of LOKER_IDS) {
      await update(ref(db, `/lockers/${lokerId}`), {
        command: 'CLOSE',
        status: 'LOCKED',
        updated_at: new Date().toISOString(),
      });
    }
  };

  const simulateEnrollmentSequence = async () => {
    if (!enrollQueue || enrollQueue.status !== 'WAITING') {
      alert("Tidak ada antrean pendaftaran (queue tidak WAITING)!");
      return;
    }

    const delay = (ms) => new Promise(res => setTimeout(res, ms));

    addLog('📝 Enrollment: Mulai proses pendaftaran sidik jari');
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

    addLog('✅ Enrollment: Berhasil — user tersimpan');
  };

  const simulateEnrollmentFail = async () => {
    if (!enrollQueue || enrollQueue.status !== 'WAITING') return;
    addLog('❌ Enrollment: Gagal membaca sensor');
    await update(ref(db, '/enrollment_queue/pending'), { status: 'FAILED', message: 'Gagal membaca sensor' });
  };

  // --- NODE 1/2/3: LOKER & RFID/BARCODE SIMULATOR ---
  const simulateScanTag = async (lokerId) => {
    if (!simulatedUid.trim()) return;

    addLog(`📡 ${lokerId}: Scan tag [${simulatedUid}]`);

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
        tipe: lokerId === 'loker_03' ? 'BARCODE' : (lokerId === 'loker_01' ? 'RFID_LF' : 'RFID_HF'),
        loker: lokerId,
        loker_assignment: lokerId,
        nama: `Barang Sim_${simulatedUid}`,
        status: 'tersedia',
        current_borrower: '',
        kategori: 'Simulator',
        timestamp: new Date().toISOString()
      });
      addLog(`📦 Barang baru terdaftar: ${simulatedUid}`);
    }
  };

  // Force lock/unlock loker manual
  const forceLockerState = async (lokerId, command) => {
    const status = command === 'OPEN' ? 'UNLOCKED' : 'LOCKED';
    addLog(`🔧 Force ${lokerId}: ${command} → ${status}`);
    await update(ref(db, `/lockers/${lokerId}`), {
      command,
      status,
      updated_at: new Date().toISOString(),
    });
  };

  return (
    <div className="min-h-screen bg-midnight-void p-6 text-polar-white font-sans">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-polar-white flex items-center gap-2">
            <BuildIcon sx={{ fontSize: 32, color: '#F3F3F3' }} /> Hardware Simulator
          </h1>
          <p className="text-ash-gray mt-2">
            Gunakan panel ini untuk mensimulasikan aksi perangkat keras (fingerprint & RFID/Barcode) 
            tanpa menggunakan mikrokontroler fisik.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* FINGERPRINT SIMULATOR */}
          <div className="bg-deep-space p-6 rounded-xl border border-dark-carbon">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-polar-white">
              <PanToolIcon sx={{ fontSize: 24, color: '#F3F3F3' }} /> Node 0 (Fingerprint)
            </h2>
            
            <div className="bg-midnight-void p-3 rounded-lg mb-4 text-xs font-mono text-ash-gray">
              [Status DB] /auth_system: <span className="text-polar-white">{authStatus?.status || 'null'}</span>
              <br />
              [Status DB] /enrollment: <span className="text-polar-white">{enrollQueue?.status || 'null'}</span>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-ash-gray uppercase mb-2">Simulasi Scan Jari</h3>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={simulateAuthSuccess} className="bg-dark-carbon hover:bg-dark-carbon/50 py-2 rounded-lg font-medium text-sm text-polar-white">Scan Dikenali (AUTHORIZED)</button>
                  <button onClick={simulateAuthUnknown} className="bg-red-600 hover:bg-red-500 py-2 rounded-lg font-medium text-sm">Scan Gagal (UNKNOWN)</button>
                  <button onClick={simulateAuthIdle} className="bg-dark-carbon hover:bg-dark-carbon/50 py-2 rounded-lg font-medium col-span-2 text-sm text-polar-white">Reset ke IDLE (Lock Semua Loker)</button>
                </div>
              </div>

              <div className="pt-4 border-t border-dark-carbon">
                <h3 className="text-sm font-semibold text-ash-gray uppercase mb-2">Simulasi Pendaftaran (Enrollment)</h3>
                <p className="text-xs text-ash-gray mb-3">Untuk menguji pendaftaran, buka <strong>/register</strong> di tab lain, isi form, lalu klik tombol di bawah ini.</p>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={simulateEnrollmentSequence} 
                    disabled={!enrollQueue || enrollQueue.status !== 'WAITING'}
                    className="bg-dark-carbon hover:bg-dark-carbon/50 disabled:opacity-50 disabled:cursor-not-allowed py-2 rounded-lg font-medium text-sm text-polar-white"
                  >
                    Simulasi Berhasil
                  </button>
                  <button 
                    onClick={simulateEnrollmentFail}
                    disabled={!enrollQueue || enrollQueue.status !== 'WAITING'}
                    className="bg-amber-glow hover:bg-amber-glow/80 text-midnight-void disabled:opacity-50 disabled:cursor-not-allowed py-2 rounded-lg font-medium text-sm"
                  >
                    Simulasi Gagal
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* LOKER & RFID SIMULATOR */}
          <div className="bg-deep-space p-6 rounded-xl border border-dark-carbon">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-polar-white">
              <LocalOfferIcon sx={{ fontSize: 24, color: '#F3F3F3' }} /> Node 1, 2, 3 (Loker & Tag)
            </h2>

            {/* Loker Status Panel */}
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-ash-gray uppercase mb-2">Status Loker Realtime</h3>
              <div className="grid grid-cols-3 gap-2">
                {LOKER_IDS.map((lokerId) => {
                  const data = lockerStatuses[lokerId];
                  const isOpen = data?.status === 'UNLOCKED';
                  return (
                    <div key={lokerId} className={`p-3 rounded-lg border text-center transition-all ${
                      isOpen 
                        ? 'bg-amber-glow/10 border-amber-glow/30' 
                        : 'bg-midnight-void border-dark-carbon'
                    }`}>
                      <div className="mb-1">
                        {isOpen 
                          ? <LockOpenIcon sx={{ fontSize: 20, color: '#F3F3F3' }} />
                          : <LockIcon sx={{ fontSize: 20, color: '#949494' }} />
                        }
                      </div>
                      <p className="text-xs font-bold text-polar-white">{lokerId.replace('_', ' ').toUpperCase()}</p>
                      <p className={`text-[10px] font-mono ${isOpen ? 'text-polar-white' : 'text-ash-gray'}`}>
                        {data?.status || 'LOCKED'}
                      </p>
                      <p className="text-[10px] font-mono text-ash-gray/70">
                        cmd: {data?.command || '-'}
                      </p>
                      {/* Force toggle button */}
                      <button
                        onClick={() => forceLockerState(lokerId, isOpen ? 'CLOSE' : 'OPEN')}
                        className={`mt-1 w-full text-[10px] py-1 rounded font-medium ${
                          isOpen 
                            ? 'bg-red-600/80 hover:bg-red-500 text-polar-white' 
                            : 'bg-dark-carbon hover:bg-dark-carbon/50 text-polar-white'
                        }`}
                      >
                        {isOpen ? 'LOCK' : 'UNLOCK'}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Auto-respond toggle */}
              <div className="mt-3 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="autoRespond"
                  checked={autoRespondEnabled}
                  onChange={(e) => setAutoRespondEnabled(e.target.checked)}
                  className="w-4 h-4 accent-amber-glow"
                />
                <label htmlFor="autoRespond" className="text-xs text-ash-gray">
                  Auto-respond: Otomatis set status saat command berubah (simulasi firmware)
                </label>
              </div>
            </div>

            {/* Tag UID Input */}
            <div className="mb-4 pt-4 border-t border-dark-carbon">
              <label className="block text-sm font-semibold text-ash-gray uppercase mb-1">UID Tag / Barcode yang disimulasikan</label>
              <input 
                type="text" 
                value={simulatedUid}
                onChange={(e) => setSimulatedUid(e.target.value)}
                className="w-full bg-midnight-void border border-dark-carbon rounded-lg p-2 text-polar-white font-mono focus:border-amber-glow focus:outline-none"
              />
              <p className="text-xs text-ash-gray mt-1">Ubah nilai ini untuk mensimulasikan scan barang yang salah/benar pada halaman Peminjaman atau Pengembalian.</p>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-ash-gray uppercase mb-1">Simulasi Scan di Reader</h3>
              <button 
                onClick={() => simulateScanTag('loker_01')} 
                className="w-full bg-dark-carbon hover:bg-dark-carbon/50 border border-dark-carbon py-3 rounded-lg font-medium flex justify-between px-4 text-polar-white"
              >
                <span>Tembak Tag ke Loker 1</span>
                <span className="text-xs bg-midnight-void px-2 py-1 rounded text-ash-gray">RFID LF</span>
              </button>
              
              <button 
                onClick={() => simulateScanTag('loker_02')} 
                className="w-full bg-dark-carbon hover:bg-dark-carbon/50 border border-dark-carbon py-3 rounded-lg font-medium flex justify-between px-4 text-polar-white"
              >
                <span>Tembak Tag ke Loker 2</span>
                <span className="text-xs bg-midnight-void px-2 py-1 rounded text-ash-gray">RFID HF</span>
              </button>
              
              <button 
                onClick={() => simulateScanTag('loker_03')} 
                className="w-full bg-dark-carbon hover:bg-dark-carbon/50 border border-dark-carbon py-3 rounded-lg font-medium flex justify-between px-4 text-polar-white"
              >
                <span>Tembak Barcode ke Loker 3</span>
                <span className="text-xs bg-midnight-void px-2 py-1 rounded text-ash-gray">Barcode</span>
              </button>
            </div>
          </div>
        </div>

        {/* Activity Log */}
        <div className="mt-6 bg-deep-space p-6 rounded-xl border border-dark-carbon">
          <h2 className="text-lg font-bold text-polar-white mb-3 flex items-center gap-2">
            📋 Log Aktivitas Simulator
          </h2>
          <div className="bg-midnight-void rounded-lg p-4 max-h-[200px] overflow-y-auto font-mono text-xs">
            {logs.length === 0 ? (
              <p className="text-ash-gray/70">Belum ada aktivitas. Klik tombol di atas untuk memulai simulasi.</p>
            ) : (
              logs.map((log, i) => (
                <p key={i} className={`${i === 0 ? 'text-polar-white' : 'text-ash-gray'} mb-1`}>
                  {log}
                </p>
              ))
            )}
          </div>
        </div>

        <div className="mt-8 text-center">
          <a href="/" target="_blank" rel="noreferrer" className="text-polar-white hover:underline">
            Buka Web App di Tab Baru ↗
          </a>
        </div>
      </div>
    </div>
  );
}
