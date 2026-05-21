import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { setAuthStatusIdle } from '../services/firebase';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import TimerIcon from '@mui/icons-material/Timer';

export default function UnknownFingerprintPage() {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(30);

  // Auto-timeout: kembali ke idle setelah 30 detik tanpa aksi
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const timer = setTimeout(async () => {
      await setAuthStatusIdle();
      navigate('/');
    }, 30000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [navigate]);

  // Handler: Kembali ke beranda — HARUS reset auth status dulu
  const handleGoHome = async () => {
    await setAuthStatusIdle();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-lg max-h-lg bg-red-600 rounded-full mix-blend-screen filter blur-[150px] opacity-10"></div>

      <div className="glass-card max-w-md w-full p-10 text-center relative z-10 animate-fadeInUp">
        <div className="w-24 h-24 mx-auto mb-6 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/30">
          <WarningAmberIcon sx={{ fontSize: 48, color: '#EF4444' }} />
        </div>
        
        <h1 className="text-2xl font-bold text-white mb-4 tracking-tight">SIDIK JARI TIDAK DIKENALI</h1>
        
        <div className="space-y-4 mb-8 text-gray-400">
          <p>Sidik jari Anda belum terdaftar dalam sistem.</p>
          <p>Apakah Anda ingin mendaftar sebagai pengguna baru?</p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => navigate('/register')}
            className="w-full btn-primary"
          >
            DAFTAR PENGGUNA BARU →
          </button>
          <button
            onClick={handleGoHome}
            className="w-full btn-ghost"
          >
            Kembali ke Beranda
          </button>
        </div>

        {/* Auto-timeout indicator */}
        <div className="mt-6 flex items-center justify-center gap-2 text-gray-600 text-xs">
          <TimerIcon sx={{ fontSize: 14 }} />
          <span>Kembali otomatis dalam {countdown} detik</span>
        </div>
      </div>
    </div>
  );
}