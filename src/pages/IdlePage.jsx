import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { listenAuthStatus } from '../services/firebase';

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
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600 rounded-full mix-blend-screen filter blur-[100px] opacity-20"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600 rounded-full mix-blend-screen filter blur-[100px] opacity-20"></div>

      <div className="glass-card max-w-md w-full p-10 text-center relative z-10 animate-fadeInUp">
        <div className="relative w-32 h-32 mx-auto mb-8 animate-float">
          <div className="absolute inset-0 border-4 border-blue-500 rounded-full opacity-20 animate-pulse-ring"></div>
          <div className="absolute inset-2 border-4 border-purple-500 rounded-full opacity-30 animate-pulse-ring" style={{ animationDelay: '0.5s' }}></div>
          <div className="relative w-full h-full bg-gray-900 rounded-full flex items-center justify-center text-6xl shadow-[0_0_30px_rgba(0,229,255,0.3)] border border-gray-700">
            👆
          </div>
        </div>

        <h1 className="text-3xl font-bold mb-4 gradient-text tracking-tight">IoT INVENTORY</h1>
        <p className="text-gray-400 mb-8 font-medium">Tempelkan jari Anda pada sensor untuk memulai sesi</p>

        <div className="flex justify-center gap-3 mb-8">
          <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0s' }}></div>
          <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
        </div>

        <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800">
          <div className="flex items-center justify-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></div>
            <p className="text-gray-300 text-sm font-medium">Menunggu autentikasi...</p>
          </div>
          <p className="text-gray-500 text-xs font-mono">Firebase: /auth_system/status = {authData?.status || 'IDLE'}</p>
        </div>
      </div>
    </div>
  );
}