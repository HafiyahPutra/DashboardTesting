import { useNavigate } from 'react-router-dom';

export default function UnknownFingerprintPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-lg max-h-lg bg-red-600 rounded-full mix-blend-screen filter blur-[150px] opacity-10"></div>

      <div className="glass-card max-w-md w-full p-10 text-center relative z-10 animate-fadeInUp">
        <div className="w-24 h-24 mx-auto mb-6 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/30">
          <div className="text-5xl">⚠️</div>
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
            onClick={() => navigate('/')}
            className="w-full btn-ghost"
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    </div>
  );
}