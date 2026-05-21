import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { listenAuthStatus, setAuthStatusIdle, closeAllLockers } from '../services/firebase';

export default function MenuPage() {
  const [authData, setAuthData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = listenAuthStatus((data) => {
      setAuthData(data);
      if (data?.status !== 'AUTHORIZED') {
        navigate('/');
      }
    });
    return () => unsub();
  }, [navigate]);

  const handleLogout = async () => {
    await closeAllLockers();
    await setAuthStatusIdle();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-600 rounded-full mix-blend-screen filter blur-[150px] opacity-10"></div>
      
      <div className="max-w-md w-full relative z-10">
        <div className="glass-card p-6 mb-6 flex items-center gap-4 animate-fadeInUp">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-xl font-bold shadow-lg">
            {authData?.user?.charAt(0) || 'U'}
          </div>
          <div>
            <p className="text-gray-400 text-sm font-medium mb-0.5">Selamat datang,</p>
            <h1 className="text-xl font-bold text-white">{authData?.user}</h1>
            <div className="flex gap-3 mt-1">
              <span className="badge badge-info">NIM: {authData?.nim || '-'}</span>
              <span className="text-xs font-mono text-gray-500 mt-1">ID: #{authData?.finger_id}</span>
            </div>
          </div>
        </div>

        <div className="space-y-4 animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
          <button
            onClick={() => navigate('/borrow')}
            className="w-full glass-card glass-card-hover p-6 flex items-center text-left group"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center text-2xl mr-4 group-hover:bg-blue-500 group-hover:text-white transition-colors">
              📤
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">PINJAM BARANG</h3>
              <p className="text-gray-400 text-sm">Ambil barang dari loker inventaris</p>
            </div>
            <div className="text-gray-600 group-hover:text-blue-400 transition-colors">
              →
            </div>
          </button>

          <button
            onClick={() => navigate('/return')}
            className="w-full glass-card glass-card-hover p-6 flex items-center text-left group"
          >
            <div className="w-12 h-12 rounded-xl bg-green-500/20 text-green-400 flex items-center justify-center text-2xl mr-4 group-hover:bg-green-500 group-hover:text-white transition-colors">
              📥
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white mb-1 group-hover:text-green-400 transition-colors">KEMBALIKAN BARANG</h3>
              <p className="text-gray-400 text-sm">Kembalikan barang yang sedang dipinjam</p>
            </div>
            <div className="text-gray-600 group-hover:text-green-400 transition-colors">
              →
            </div>
          </button>

          <button
            onClick={handleLogout}
            className="w-full glass-card glass-card-hover p-4 flex items-center justify-center text-gray-400 hover:text-red-400 hover:border-red-500/30 transition-colors"
          >
            <span className="mr-2">🚪</span> LOGOUT
          </button>
        </div>
      </div>
    </div>
  );
}