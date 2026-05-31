import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { listenLockerFull, recordLoan, updateBarangBorrower, listenAuthStatus, updateLoanReturn, closeLocker } from '../services/firebase';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import LockIcon from '@mui/icons-material/Lock';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SensorsIcon from '@mui/icons-material/Sensors';
import TimerIcon from '@mui/icons-material/Timer';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';

// Timeout loker terbuka tanpa scan (dalam detik)
const LOCKER_TIMEOUT_SECONDS = 300; // 5 menit — sinkron dengan LOCKER_OPEN_MS di hardware
// Auto-finish setelah scan berhasil di mode return (dalam detik)
const AUTO_FINISH_SECONDS = 8;

export default function ScanPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { mode, item, loker, duration } = location.state || {};
  
  const [lockerData, setLockerData] = useState(null);
  const [detectedItem, setDetectedItem] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState(null);
  const [timeoutCountdown, setTimeoutCountdown] = useState(LOCKER_TIMEOUT_SECONDS);
  const [autoFinishCountdown, setAutoFinishCountdown] = useState(null);
  
  // Track scan yang sudah diproses — bandingkan dengan last_scan_time terbaru
  const lastProcessedScanTime = useRef(null);
  const isFirstCallback = useRef(true);
  const timeoutRef = useRef(null);
  const countdownRef = useRef(null);
  const autoFinishRef = useRef(null);
  const autoFinishCountdownRef = useRef(null);

  // Get target loker
  const targetLoker = loker || item?.loker_assignment;

  // Auth listener
  useEffect(() => {
    const unsubAuth = listenAuthStatus((data) => {
      setUser(data?.user);
    });
    return () => unsubAuth();
  }, []);

  // Handle new scan — wrapped in useCallback for stable reference
  const handleNewScan = useCallback((scannedUid) => {
    if (mode === 'borrow') {
      // Pinjam: Tag yang di-scan harus sesuai barang yang dipilih
      if (scannedUid === item.tag_id) {
        setDetectedItem(item);
        setValidationError(null);
      } else {
        setValidationError(`Barang yang diambil salah. Seharusnya: ${item.nama}`);
        setDetectedItem(null);
      }
    } else if (mode === 'return') {
      // Kembali: Tag harus cocok dengan item_id di loan record
      if (scannedUid === item.item_id) {
        setDetectedItem(item);
        setValidationError(null);
      } else {
        setValidationError(`Tag tidak cocok! Anda meminjam: ${item.item_name}`);
        setDetectedItem(null);
      }
    }
  }, [mode, item]);

  // Locker data listener — deteksi scan baru
  useEffect(() => {
    if (!targetLoker) return;

    const unsubLocker = listenLockerFull(targetLoker, (data) => {
      if (!data) return;
      setLockerData(data);

      if (isFirstCallback.current) {
        // Callback pertama: simpan last_scan_time saat ini sebagai baseline
        // JANGAN proses scan dari data lama
        lastProcessedScanTime.current = data.last_scan_time || null;
        isFirstCallback.current = false;
        return;
      }

      // Deteksi scan baru: last_scan_time berubah DAN berbeda dari yang terakhir diproses
      if (
        data.last_scan_time &&
        data.last_scan_time !== lastProcessedScanTime.current &&
        data.last_uid
      ) {
        // Update ref sebelum proses agar tidak double-trigger
        lastProcessedScanTime.current = data.last_scan_time;
        handleNewScan(data.last_uid);
      }
    });

    return () => unsubLocker();
  }, [targetLoker, handleNewScan]);

  // Timeout: auto-tutup loker jika tidak ada scan dalam LOCKER_TIMEOUT_SECONDS
  useEffect(() => {
    // Mulai countdown
    countdownRef.current = setInterval(() => {
      setTimeoutCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Timer untuk auto-close
    timeoutRef.current = setTimeout(async () => {
      if (targetLoker) {
        await closeLocker(targetLoker);
      }
      navigate('/menu');
    }, LOCKER_TIMEOUT_SECONDS * 1000);

    return () => {
      clearTimeout(timeoutRef.current);
      clearInterval(countdownRef.current);
    };
  }, [targetLoker, navigate]);

  // Reset timeout saat scan berhasil (barang terdeteksi)
  useEffect(() => {
    if (detectedItem) {
      // Hentikan timeout — user sudah scan
      clearTimeout(timeoutRef.current);
      clearInterval(countdownRef.current);

      // Untuk mode return, auto-finish setelah delay
      if (mode === 'return') {
        setAutoFinishCountdown(AUTO_FINISH_SECONDS);
        autoFinishCountdownRef.current = setInterval(() => {
          setAutoFinishCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(autoFinishCountdownRef.current);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        autoFinishRef.current = setTimeout(() => {
          handleFinish();
        }, AUTO_FINISH_SECONDS * 1000);
      }
    }

    return () => {
      clearTimeout(autoFinishRef.current);
      clearInterval(autoFinishCountdownRef.current);
    };
  }, [detectedItem, mode]);

  // Handle batal / kembali
  const handleCancel = async () => {
    setLoading(true);
    if (targetLoker) {
      await closeLocker(targetLoker);
    }
    navigate('/menu');
  };

  const handleFinish = async () => {
    setLoading(true);
    // Hentikan auto-finish timer jika ada
    clearTimeout(autoFinishRef.current);
    clearInterval(autoFinishCountdownRef.current);

    try {
      if (mode === 'borrow' && detectedItem && user) {
        const pinjamTime = new Date();
        const finalDuration = duration || 1;
        const expectedReturnTime = new Date(pinjamTime.getTime() + finalDuration * 60000);

        await recordLoan({
          user_name: user,
          item_id: detectedItem.tag_id,
          item_name: detectedItem.nama,
          loker_asal: detectedItem.loker_assignment,
          metode: detectedItem.tipe,
          timestamp_pinjam: pinjamTime.toISOString(),
          duration_minutes: finalDuration,
          expected_return_time: expectedReturnTime.toISOString(),
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

  const lokerName = targetLoker?.replace('_', ' ').toUpperCase();
  const isLockerOpen = lockerData?.status === 'UNLOCKED';

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      <div className="w-full max-w-md relative z-10 animate-fadeInUp">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-polar-white tracking-tight flex items-center justify-center gap-2 mb-1">
            <span className="text-polar-white">
              {mode === 'borrow' 
                ? <FileDownloadIcon sx={{ fontSize: 28 }} /> 
                : <FileUploadIcon sx={{ fontSize: 28 }} />}
            </span> 
            {mode === 'borrow' ? 'PEMINJAMAN' : 'PENGEMBALIAN'}
          </h1>
          <div className="badge badge-info">{lokerName}</div>
        </div>

        {/* Locker Status Card */}
        <div className={`glass-card p-6 mb-6 text-center border-2 transition-all duration-500
          ${isLockerOpen ? 'border-amber-glow/50' : 'border-dark-carbon'}
        `}>
          <div className="relative w-24 h-24 mx-auto mb-4">
            {isLockerOpen && (
              <>
                <div className="absolute inset-0 rounded-full border-2 border-amber-glow/30 animate-ping"></div>
                <div className="absolute inset-2 rounded-full border-2 border-amber-glow/20 animate-ping" style={{ animationDelay: '0.5s' }}></div>
              </>
            )}
            <div className={`relative w-full h-full rounded-full flex items-center justify-center shadow-inner transition-colors
              ${isLockerOpen ? 'bg-amber-glow/10 text-polar-white' : 'bg-dark-carbon text-ash-gray'}
            `}>
              {isLockerOpen 
                ? <LockOpenIcon sx={{ fontSize: 40, color: '#F3F3F3' }} /> 
                : <LockIcon sx={{ fontSize: 40, color: '#949494' }} />}
            </div>
          </div>
          
          <h2 className={`text-xl font-bold mb-1 ${isLockerOpen ? 'text-polar-white' : 'text-ash-gray'}`}>
            {isLockerOpen ? 'LOKER TERBUKA' : 'MEMBUKA LOKER...'}
          </h2>
          <p className="text-sm text-ash-gray">
            {mode === 'borrow' 
              ? 'Ambil barang & scan tag ke reader' 
              : 'Masukkan barang & scan tag ke reader'}
          </p>

          {/* Timeout indicator — hanya saat belum ada scan */}
          {!detectedItem && (
            <div className="mt-3 flex items-center justify-center gap-1 text-ash-gray/70 text-xs">
              <TimerIcon sx={{ fontSize: 12 }} />
              <span>Auto-tutup dalam {timeoutCountdown}s</span>
            </div>
          )}
        </div>

        {/* Scanner Area */}
        <div className="relative">
          {/* Waiting State */}
          {!detectedItem && !validationError && (
            <div className="glass-card p-6 text-center border border-dark-carbon relative overflow-hidden">
              <div className="absolute left-0 w-full h-0.5 bg-amber-glow/50 animate-scanLine"></div>
              <div className="mb-3">
                <SensorsIcon sx={{ fontSize: 32, color: '#F3F3F3' }} />
              </div>
              <p className="text-ash-gray font-mono text-sm mb-3">MENUNGGU SENSOR...</p>
              <div className="flex justify-center gap-2">
                <div className="w-1.5 h-1.5 bg-amber-glow rounded-full animate-pulse"></div>
                <div className="w-1.5 h-1.5 bg-amber-glow rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-1.5 h-1.5 bg-amber-glow rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          )}

          {/* Error State */}
          {validationError && !detectedItem && (
            <div className="glass-card p-6 text-center border-2 border-red-500/50 bg-red-900/20 animate-shake">
              <div className="mb-2">
                <WarningAmberIcon sx={{ fontSize: 48, color: '#EF4444' }} />
              </div>
              <h3 className="text-red-400 font-bold mb-1">GAGAL VALIDASI</h3>
              <p className="text-sm text-slate-ui">{validationError}</p>
              <p className="text-xs text-red-400/80 mt-3 border-t border-red-500/30 pt-3">Silakan scan ulang barang yang benar</p>
            </div>
          )}

          {/* Success State */}
          {detectedItem && (
            <div className="glass-card p-6 border-2 border-neon-green/30 bg-neon-green/5 animate-fadeInUp">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-neon-green/15 flex items-center justify-center text-neon-green border border-neon-green/30 shrink-0">
                  <CheckCircleIcon sx={{ fontSize: 28, color: '#00AC5C' }} />
                </div>
                <div>
                  <h3 className="text-neon-green font-bold mb-1">Tag Cocok!</h3>
                  <p className="text-polar-white font-medium">{detectedItem.nama || detectedItem.item_name}</p>
                  <p className="text-ash-gray text-xs font-mono mt-1">ID: {detectedItem.tag_id || detectedItem.item_id}</p>
                </div>
              </div>
              {/* Auto-finish countdown untuk return mode */}
              {autoFinishCountdown !== null && autoFinishCountdown > 0 && (
                <div className="mt-3 pt-3 border-t border-neon-green/20 text-center">
                  <p className="text-neon-green/70 text-xs">Auto-selesai dalam {autoFinishCountdown} detik</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-6 space-y-3">
          {/* Finish button — visible when item detected */}
          <div className={`transition-all duration-300 ${detectedItem ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
            <button
              onClick={handleFinish}
              disabled={loading}
              className="w-full btn-primary py-4"
            >
              {loading ? 'MEMPROSES...' : 'SELESAI & TUTUP LOKER →'}
            </button>
          </div>

          {/* Cancel button — always visible */}
          <button
            onClick={handleCancel}
            disabled={loading}
            className="w-full btn-ghost py-3 flex items-center justify-center gap-2 text-sm"
          >
            <ChevronLeftIcon sx={{ fontSize: 18 }} /> Batal & Kembali ke Menu
          </button>
        </div>
      </div>
    </div>
  );
}