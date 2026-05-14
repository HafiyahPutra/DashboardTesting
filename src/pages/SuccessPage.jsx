import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { setAuthStatusIdle } from '../services/firebase';

export default function SuccessPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { item, mode } = location.state || {};

  useEffect(() => {
    // Jalankan efek confetti kustom jika mau
    
    const timer = setTimeout(async () => {
      await setAuthStatusIdle();
      navigate('/');
    }, 4000); // 4 detik countdown
    
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-green-500 rounded-full mix-blend-screen filter blur-[150px] opacity-15"></div>

      <div className="glass-card max-w-md w-full p-8 text-center relative z-10 border-green-500/30">
        <div className="w-24 h-24 mx-auto bg-green-500/20 rounded-full flex items-center justify-center border-2 border-green-400 mb-6 shadow-[0_0_30px_rgba(0,200,83,0.3)] animate-pulse-ring">
          <span className="text-5xl text-green-400">✓</span>
        </div>

        <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">
          {mode === 'borrow' ? 'PEMINJAMAN BERHASIL' : 'PENGEMBALIAN BERHASIL'}
        </h1>
        <p className="text-green-400 text-sm mb-8 font-medium">Transaksi telah tersimpan dalam sistem</p>

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
          <div className="w-12 h-12 rounded-full border border-gray-700 flex items-center justify-center text-xl font-bold text-white bg-gray-800 animate-countDown relative">
            {/* Pseudo-countdown, animasi css handle sisanya */}
            <span className="absolute animate-pulse">🕒</span>
          </div>
        </div>
      </div>
    </div>
  );
}