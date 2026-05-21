import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { listenAuthStatus } from '../services/firebase';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import BuildIcon from '@mui/icons-material/Build';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';

export default function IdlePage() {
  const [authData, setAuthData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = listenAuthStatus((data) => {
      setAuthData(data);
      if (data?.status === 'AUTHORIZED') {
        navigate('/menu');
      } else if (data?.status === 'UNKNOWN') {
        navigate('/unknown');
      }
    });
    return () => unsub();
  }, [navigate]);

  return (
    <div className="relative flex items-center justify-center min-h-screen p-6 overflow-hidden">
      {/* Background decorations - Updated with new palette */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-600 rounded-full mix-blend-screen filter blur-[100px] opacity-20"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-teal-600 rounded-full mix-blend-screen filter blur-[100px] opacity-20"></div>

      <div className="relative z-10 w-full max-w-md p-10 text-center glass-card animate-fadeInUp">
        <div className="relative w-32 h-32 mx-auto mb-8 animate-float">
          <div className="absolute inset-0 border-4 rounded-full border-emerald-500 opacity-20 animate-pulse-ring"></div>
          <div className="absolute border-4 border-teal-500 rounded-full inset-2 opacity-30 animate-pulse-ring" style={{ animationDelay: '0.5s' }}></div>
          <div className="relative w-full h-full bg-gray-900 rounded-full flex items-center justify-center text-6xl shadow-[0_0_30px_rgba(16,185,129,0.3)] border border-gray-700">
            <FingerprintIcon sx={{ fontSize: 60, color: '#10B981' }} />
          </div>
        </div>

        <h1 className="mb-4 text-3xl font-bold tracking-tight gradient-text">IoT INVENTORY</h1>
        <p className="mb-8 font-medium text-gray-400">Tempelkan jari Anda pada sensor untuk memulai sesi</p>

        <div className="flex justify-center gap-3 mb-8">
          <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" style={{ animationDelay: '0s' }}></div>
          <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
        </div>

        <div className="p-4 border border-gray-800 bg-gray-900/50 rounded-xl">
          <div className="flex items-center justify-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <p className="text-sm font-medium text-gray-300">Menunggu autentikasi...</p>
          </div>
          <p className="font-mono text-xs text-gray-500">Firebase: /auth_system/status = {authData?.status || 'IDLE'}</p>
        </div>
      </div>

      {/* Navigation buttons — fixed bottom */}
      <div className="fixed left-0 z-20 flex justify-center w-full gap-3 bottom-6">
        <Link
          to="/simulator"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-800/80 backdrop-blur-md border border-gray-700 text-gray-400 hover:text-emerald-400 hover:border-emerald-500/50 transition-all text-sm font-medium shadow-lg"
        >
          <BuildIcon sx={{ fontSize: 18 }} /> Simulator
        </Link>
        <Link
          to="/admin"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-800/80 backdrop-blur-md border border-gray-700 text-gray-400 hover:text-amber-400 hover:border-amber-500/50 transition-all text-sm font-medium shadow-lg"
        >
          <AdminPanelSettingsIcon sx={{ fontSize: 18 }} /> Admin
        </Link>
      </div>
    </div>
  );
}