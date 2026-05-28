import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { listenAuthStatus, setAuthStatusIdle, closeAllLockers } from '../services/firebase';
import OutputIcon from '@mui/icons-material/Output';
import InputIcon from '@mui/icons-material/Input';
import LogoutIcon from '@mui/icons-material/Logout';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

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
      <div className="max-w-md w-full relative z-10">
        <div className="glass-card p-6 mb-6 flex items-center gap-4 animate-fadeInUp">
          <div className="w-14 h-14 bg-dark-carbon rounded-full flex items-center justify-center text-xl font-bold text-polar-white shadow-lg">
            {authData?.user?.charAt(0) || 'U'}
          </div>
          <div>
            <p className="text-ash-gray text-sm font-medium mb-0.5">Selamat datang,</p>
            <h1 className="text-xl font-bold text-polar-white">{authData?.user}</h1>
            <div className="flex gap-3 mt-1">
              <span className="badge badge-info">NIM: {authData?.nim || '-'}</span>
              <span className="text-xs font-mono text-ash-gray mt-1">ID: #{authData?.finger_id}</span>
            </div>
          </div>
        </div>

        <div className="space-y-4 animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
          <button
            onClick={() => navigate('/borrow')}
            className="w-full glass-card glass-card-hover p-6 flex items-center text-left group"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-glow/15 text-polar-white flex items-center justify-center mr-4 group-hover:bg-amber-glow group-hover:text-midnight-void transition-colors">
              <OutputIcon />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-polar-white mb-1 group-hover:text-polar-white transition-colors">PINJAM BARANG</h3>
              <p className="text-ash-gray text-sm">Ambil barang dari loker inventaris</p>
            </div>
            <div className="text-ash-gray/70 group-hover:text-polar-white transition-colors">
              <ArrowForwardIcon fontSize="small" />
            </div>
          </button>

          <button
            onClick={() => navigate('/return')}
            className="w-full glass-card glass-card-hover p-6 flex items-center text-left group"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-glow/15 text-polar-white flex items-center justify-center mr-4 group-hover:bg-amber-glow group-hover:text-midnight-void transition-colors">
              <InputIcon />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-polar-white mb-1 group-hover:text-polar-white transition-colors">KEMBALIKAN BARANG</h3>
              <p className="text-ash-gray text-sm">Kembalikan barang yang sedang dipinjam</p>
            </div>
            <div className="text-ash-gray/70 group-hover:text-polar-white transition-colors">
              <ArrowForwardIcon fontSize="small" />
            </div>
          </button>

          <button
            onClick={handleLogout}
            className="w-full glass-card glass-card-hover p-4 flex items-center justify-center text-ash-gray hover:text-red-400 hover:border-red-500/30 transition-colors"
          >
            <span className="mr-2 flex items-center"><LogoutIcon fontSize="small" /></span> LOGOUT
          </button>
        </div>
      </div>
    </div>
  );
}