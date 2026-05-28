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
      <div className="glass-card max-w-md w-full p-8 text-center relative z-10 border-amber-glow/30 animate-fadeInUp">
        <div className="w-24 h-24 mx-auto bg-amber-glow/15 rounded-full flex items-center justify-center border-2 border-amber-glow mb-6 animate-pulse-ring">
          <CheckCircleIcon sx={{ fontSize: 60, color: '#00AC5C' }} />
        </div>

        <h1 className="text-2xl font-bold text-polar-white mb-2 tracking-tight">
          {mode === 'borrow' ? 'PEMINJAMAN BERHASIL' : 'PENGEMBALIAN BERHASIL'}
        </h1>
        <p className="text-polar-white text-sm mb-8 font-medium">Transaksi telah tersimpan dalam sistem</p>

        <div className="bg-deep-space/80 rounded-xl p-5 mb-8 border border-dark-carbon text-left space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <span className="text-ash-gray text-sm">Barang</span>
            <span className="text-polar-white font-medium col-span-2">{item?.nama || item?.item_name || '-'}</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <span className="text-ash-gray text-sm">Loker</span>
            <span className="text-slate-ui col-span-2">{(item?.loker_assignment || item?.loker_asal)?.replace('_', ' ').toUpperCase()}</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <span className="text-ash-gray text-sm">Waktu</span>
            <span className="text-slate-ui font-mono text-sm col-span-2">{new Date().toLocaleString('id-ID')}</span>
          </div>
        </div>

        <div className="flex flex-col items-center">
          <p className="text-ash-gray text-sm mb-2">Logout otomatis dalam</p>
          <div className="w-14 h-14 rounded-full border-2 border-amber-glow/40 flex items-center justify-center bg-dark-carbon/80 relative">
            <span className="text-polar-white font-bold text-xl font-mono">{countdown}</span>
            <div className="absolute inset-0 rounded-full border-2 border-amber-glow/20 animate-ping"></div>
          </div>
          <div className="mt-2 text-ash-gray/70">
            <AutorenewIcon sx={{ fontSize: 18, animation: 'spin 1s linear infinite', '@keyframes spin': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } } }} />
          </div>
        </div>
      </div>
    </div>
  );
}