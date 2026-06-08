import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { setAuthStatusIdle } from '../services/firebase';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import TimerRoundedIcon from '@mui/icons-material/TimerRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';

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

  const handleRegister = () => {
    navigate('/register');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      <div className="glass-card max-w-md w-full p-10 text-center relative z-10 animate-fadeInUp">
        <div className="w-24 h-24 mx-auto mb-6 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/30">
          <WarningAmberRoundedIcon sx={{ fontSize: 48, color: '#EF4444' }} />
        </div>
        
        <h1 className="text-2xl font-bold text-polar-white mb-4 tracking-tight">SIDIK JARI TIDAK DIKENALI</h1>
        
        <div className="space-y-4 mb-8 text-ash-gray">
          <p>Sidik jari Anda belum terdaftar dalam sistem.</p>
          <p>Apakah Anda ingin mendaftar sebagai pengguna baru?</p>
        </div>

        <div className="space-y-3">
          <button onClick={handleRegister} className="w-full btn-primary">
            <span className="flex items-center justify-center gap-2">DAFTAR PENGGUNA BARU <ArrowForwardRoundedIcon sx={{ fontSize: 18 }} /></span>
          </button>
          <button
            onClick={handleGoHome}
            className="w-full btn-ghost"
          >
            Kembali ke Beranda
          </button>
        </div>

        {/* Auto-timeout indicator */}
        <div className="mt-6 flex items-center justify-center gap-2 text-ash-gray/70 text-xs">
          <TimerRoundedIcon sx={{ fontSize: 14 }} />
          <span>Kembali otomatis dalam {countdown} detik</span>
        </div>
      </div>
    </div>
  );
}