import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { setAuthStatusIdle, closeAllLockers } from '../services/firebase';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AutorenewIcon from '@mui/icons-material/Autorenew';

export default function SuccessPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { item, mode } = location.state || {};
  const [countdown, setCountdown] = useState(4);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const timer = setTimeout(async () => {
      // Safety net: tutup SEMUA loker sebelum logout
      await closeAllLockers();
      await setAuthStatusIdle();
      navigate('/');
    }, 4000);
    
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-emerald-500 rounded-full mix-blend-screen filter blur-[150px] opacity-15"></div>

      <div className="glass-card max-w-md w-full p-8 text-center relative z-10 border-emerald-500/30 animate-fadeInUp">
        <div className="w-24 h-24 mx-auto bg-emerald-500/20 rounded-full flex items-center justify-center border-2 border-emerald-400 mb-6 shadow-[0_0_30px_rgba(16,185,129,0.3)] animate-pulse-ring">
          <CheckCircleIcon sx={{ fontSize: 60, color: '#10B981' }} />
        </div>

        <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">
          {mode === 'borrow' ? 'PEMINJAMAN BERHASIL' : 'PENGEMBALIAN BERHASIL'}
        </h1>
        <p className="text-emerald-400 text-sm mb-8 font-medium">Transaksi telah tersimpan dalam sistem</p>

        <div className="bg-gray-900/80 rounded-xl p-5 mb-8 border border-gray-800 text-left space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <span className="text-gray-500 text-sm">Barang</span>
            <span className="text-white font-medium col-span-2">{item?.nama || item?.item_name || '-'}</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <span className="text-gray-500 text-sm">Loker</span>
            <span className="text-gray-300 col-span-2">{(item?.loker_assignment || item?.loker_asal)?.replace('_', ' ').toUpperCase()}</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <span className="text-gray-500 text-sm">Waktu</span>
            <span className="text-gray-300 font-mono text-sm col-span-2">{new Date().toLocaleString('id-ID')}</span>
          </div>
        </div>

        <div className="flex flex-col items-center">
          <p className="text-gray-500 text-sm mb-2">Logout otomatis dalam</p>
          <div className="w-14 h-14 rounded-full border-2 border-emerald-500/40 flex items-center justify-center bg-gray-800/80 relative">
            <span className="text-emerald-400 font-bold text-xl font-mono">{countdown}</span>
            <div className="absolute inset-0 rounded-full border-2 border-emerald-500/20 animate-ping"></div>
          </div>
          <div className="mt-2 text-gray-600">
            <AutorenewIcon sx={{ fontSize: 18, animation: 'spin 1s linear infinite', '@keyframes spin': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } } }} />
          </div>
        </div>
      </div>
    </div>
  );
}