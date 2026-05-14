import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { listenLockerFull, recordLoan, updateBarangBorrower, listenAuthStatus, updateLoanReturn, closeLocker } from '../services/firebase';

export default function ScanPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { mode, item, loker } = location.state || {};
  
  const [lockerData, setLockerData] = useState(null);
  const [detectedItem, setDetectedItem] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState(null);
  
  const initialScanTime = useRef(null);

  useEffect(() => {
    const unsubAuth = listenAuthStatus((data) => {
      setUser(data?.user);
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    const targetLoker = loker || item?.loker_assignment;
    if (!targetLoker) return;

    const unsubLocker = listenLockerFull(targetLoker, (data) => {
      if (!data) return;
      setLockerData(data);

      // Simpan waktu awal saat halaman dibuka untuk komparasi
      if (!initialScanTime.current) {
        initialScanTime.current = data.last_scan_time;
      }

      // Deteksi scan baru dengan membandingkan last_scan_time
      if (data.last_scan_time !== initialScanTime.current && data.last_uid) {
        handleNewScan(data.last_uid);
      }
    });

    return () => unsubLocker();
  }, [item, loker]);

  const handleNewScan = (scannedUid) => {
    if (mode === 'borrow') {
      // Pinjam: Tag yang di-scan adalah barang yang diambil
      if (scannedUid === item.tag_id) {
        setDetectedItem(item);
      } else {
        setValidationError(`Barang yang diambil salah. Seharusnya: ${item.nama}`);
      }
    } else if (mode === 'return') {
      // Kembali: Validasi tag yang di-scan harus sama dengan loan record
      if (scannedUid === item.item_id) {
        setDetectedItem(item);
        setValidationError(null);
      } else {
        setValidationError(`Tag tidak cocok! Anda meminjam: ${item.item_name}`);
        setDetectedItem(null);
      }
    }
  };

  const handleFinish = async () => {
    setLoading(true);
    const targetLoker = loker || item.loker_assignment;

    try {
      if (mode === 'borrow' && detectedItem && user) {
        await recordLoan({
          user_name: user,
          item_id: detectedItem.tag_id,
          item_name: detectedItem.nama,
          loker_asal: detectedItem.loker_assignment,
          metode: detectedItem.tipe,
          timestamp_pinjam: new Date().toISOString(),
          status: 'active'
        });
        await updateBarangBorrower(detectedItem.tag_id, user, 'dipinjam');
      } else if (mode === 'return' && detectedItem) {
        await updateLoanReturn(item.id, {
          timestamp_kembali: new Date().toISOString(),
          status: 'returned'
        });
        await updateBarangBorrower(item.item_id, "", 'tersedia');
      }

      // Kunci loker
      await closeLocker(targetLoker);
      
      navigate('/success', { state: { item: detectedItem, mode } });
    } catch (err) {
      alert("Error: " + err.message);
      setLoading(false);
    }
  };

  const lokerName = (loker || item?.loker_assignment)?.replace('_', ' ').toUpperCase();
  const isLockerOpen = lockerData?.status === 'UNLOCKED';

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background glow based on status */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] rounded-full mix-blend-screen filter blur-[150px] opacity-10 transition-colors duration-1000
        ${detectedItem ? 'bg-green-500' : validationError ? 'bg-red-500' : 'bg-blue-500'}
      `}></div>

      <div className="w-full max-w-md relative z-10 animate-fadeInUp">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center justify-center gap-2 mb-1">
            <span className={mode === 'borrow' ? 'text-blue-400' : 'text-green-400'}>
              {mode === 'borrow' ? '📤' : '📥'}
            </span> 
            {mode === 'borrow' ? 'PEMINJAMAN' : 'PENGEMBALIAN'}
          </h1>
          <div className="badge badge-info">{lokerName}</div>
        </div>

        {/* Locker Status Card */}
        <div className={`glass-card p-6 mb-6 text-center border-2 transition-all duration-500
          ${isLockerOpen ? 'border-blue-500/50 shadow-[0_0_30px_rgba(0,153,255,0.2)]' : 'border-gray-800'}
        `}>
          <div className="relative w-24 h-24 mx-auto mb-4">
            {isLockerOpen && (
              <>
                <div className="absolute inset-0 rounded-full border-2 border-blue-400/30 animate-ping"></div>
                <div className="absolute inset-2 rounded-full border-2 border-blue-400/20 animate-ping" style={{ animationDelay: '0.5s' }}></div>
              </>
            )}
            <div className={`relative w-full h-full rounded-full flex items-center justify-center text-4xl shadow-inner transition-colors
              ${isLockerOpen ? 'bg-blue-900/50 text-white' : 'bg-gray-800 text-gray-500'}
            `}>
              {isLockerOpen ? '🔓' : '🔒'}
            </div>
          </div>
          
          <h2 className={`text-xl font-bold mb-1 ${isLockerOpen ? 'text-blue-400' : 'text-gray-400'}`}>
            {isLockerOpen ? 'LOKER TERBUKA' : 'MEMBUKA LOKER...'}
          </h2>
          <p className="text-sm text-gray-400">
            {mode === 'borrow' 
              ? 'Ambil barang & scan tag ke reader' 
              : 'Masukkan barang & scan tag ke reader'}
          </p>
        </div>

        {/* Scanner Area */}
        <div className="relative">
          {/* Waiting State */}
          {!detectedItem && !validationError && (
            <div className="glass-card p-6 text-center border border-gray-800 relative overflow-hidden">
              <div className="absolute left-0 w-full h-0.5 bg-blue-500/50 animate-scanLine shadow-[0_0_10px_rgba(0,153,255,0.8)]"></div>
              <p className="text-gray-400 font-mono text-sm mb-3">MENUNGGU SENSOR...</p>
              <div className="flex justify-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          )}

          {/* Error State */}
          {validationError && !detectedItem && (
            <div className="glass-card p-6 text-center border-2 border-red-500/50 bg-red-900/20 animate-shake">
              <div className="text-4xl mb-2">⚠️</div>
              <h3 className="text-red-400 font-bold mb-1">GAGAL VALIDASI</h3>
              <p className="text-sm text-gray-300">{validationError}</p>
              <p className="text-xs text-red-400/80 mt-3 border-t border-red-500/30 pt-3">Silakan scan ulang barang yang benar</p>
            </div>
          )}

          {/* Success State */}
          {detectedItem && (
            <div className="glass-card p-6 border-2 border-green-500/50 bg-green-900/10 animate-fadeInUp">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 text-xl border border-green-500/30 shrink-0">
                  ✓
                </div>
                <div>
                  <h3 className="text-green-400 font-bold mb-1">Tag Cocok!</h3>
                  <p className="text-white font-medium">{detectedItem.nama || detectedItem.item_name}</p>
                  <p className="text-gray-400 text-xs font-mono mt-1">ID: {detectedItem.tag_id || detectedItem.item_id}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className={`mt-6 transition-all duration-300 ${detectedItem ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
          <button
            onClick={handleFinish}
            disabled={loading}
            className="w-full btn-primary py-4 shadow-[0_0_20px_rgba(0,153,255,0.4)]"
          >
            {loading ? 'MEMPROSES...' : 'SELESAI & TUTUP LOKER →'}
          </button>
        </div>
      </div>
    </div>
  );
}