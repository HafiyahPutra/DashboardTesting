import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { listenAuthStatus, listenAllLockers } from '../services/firebase';
import FingerprintRoundedIcon from '@mui/icons-material/FingerprintRounded';
import BuildRoundedIcon from '@mui/icons-material/BuildRounded';
import AdminPanelSettingsRoundedIcon from '@mui/icons-material/AdminPanelSettingsRounded';
import SettingsInputHdmiRoundedIcon from '@mui/icons-material/SettingsInputHdmiRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import MonitorHeartRoundedIcon from '@mui/icons-material/MonitorHeartRounded';
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded';

const NodeBadge = ({ name, type, isOnline }) => (
  <div className="flex items-center justify-between gap-4 px-4 py-3 rounded-xl bg-midnight-void border border-dark-carbon w-full">
    <div className="flex flex-col leading-none">
      <span className="text-sm font-bold text-polar-white mb-1">{name}</span>
      <span className="text-[10px] text-ash-gray">{type}</span>
    </div>
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-bold text-ash-gray uppercase tracking-wider">{isOnline ? 'Terhubung' : 'Terputus'}</span>
      <div className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-neon-green shadow-[0_0_8px_#00AC5C]' : 'bg-red-500 shadow-[0_0_8px_#EF4444]'}`}></div>
    </div>
  </div>
);

export default function IdlePage() {
  const [authData, setAuthData] = useState(null);
  const [lockersData, setLockersData] = useState({});
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubAuth = listenAuthStatus((data) => {
      setAuthData(data);
      if (data?.status === 'AUTHORIZED') {
        navigate('/menu');
      } else if (data?.status === 'UNKNOWN') {
        navigate('/unknown');
      }
    });
    
    const unsubLockers = listenAllLockers((data) => {
      setLockersData(data || {});
    });

    return () => {
      unsubAuth();
      unsubLockers();
    };
  }, [navigate]);

  return (
    <div className="relative flex items-center justify-center min-h-screen p-6 overflow-hidden">
      <div className="relative z-10 w-full max-w-md pt-10 px-10 pb-16 text-center glass-card animate-fadeInUp mb-20">
        <div className="relative w-32 h-32 mx-auto mb-8 animate-float">
          <div className="absolute inset-0 border-4 rounded-full border-dark-carbon opacity-50 animate-pulse-ring"></div>
          <div className="absolute border-4 border-dark-carbon rounded-full inset-2 opacity-30 animate-pulse-ring" style={{ animationDelay: '0.5s' }}></div>
          <div className="relative w-full h-full bg-deep-space rounded-full flex items-center justify-center text-6xl border border-dark-carbon">
            <FingerprintRoundedIcon sx={{ fontSize: 60, color: 'inherit' }} />
          </div>
        </div>

        <h1 className="mb-4 text-3xl font-bold tracking-tight text-polar-white">IoT INVENTORY</h1>
        <p className="mb-8 font-medium text-ash-gray">Tempelkan jari Anda pada sensor untuk memulai sesi</p>

        <div className="flex justify-center gap-3 mb-8">
          <div className="w-2.5 h-2.5 bg-polar-white rounded-full animate-pulse" style={{ animationDelay: '0s' }}></div>
          <div className="w-2.5 h-2.5 bg-polar-white rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2.5 h-2.5 bg-polar-white rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
        </div>

        <div className="p-4 border border-dark-carbon bg-deep-space/50 rounded-xl">
          <div className="flex items-center justify-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-polar-white animate-pulse"></div>
            <p className="text-sm font-medium text-slate-ui">Menunggu autentikasi...</p>
          </div>
          <p className="font-mono text-xs text-ash-gray">Firebase: /auth_system/status = {authData?.status || 'IDLE'}</p>
        </div>
      </div>

      {/* Fixed Top Right Navigation */}
      <div className="fixed top-6 right-8 z-20 flex items-center gap-3">
        <button
          onClick={() => setShowDiagnostics(true)}
          className="w-12 h-12 flex items-center justify-center rounded-full bg-[#F4F5F7] text-[#1E293B] hover:bg-[#E2E8F0] transition-all"
        >
          <MonitorHeartRoundedIcon sx={{ fontSize: 20 }} />
        </button>
        <Link
          to="/admin"
          className="w-12 h-12 flex items-center justify-center rounded-full bg-[#F4F5F7] text-[#1E293B] hover:bg-[#E2E8F0] transition-all"
        >
          <PersonOutlineRoundedIcon sx={{ fontSize: 20 }} />
        </Link>
      </div>

      {/* Modal Diagnostics */}
      {showDiagnostics && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-midnight-void/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm glass-card border border-dark-carbon p-6 shadow-2xl animate-fadeInUp">
            <div className="flex justify-between items-center mb-6 border-b border-dark-carbon pb-4">
              <h2 className="text-lg font-bold text-polar-white flex items-center gap-2">
                <SettingsInputHdmiRoundedIcon sx={{ fontSize: 20 }} /> Node Diagnostics
              </h2>
              <button 
                onClick={() => setShowDiagnostics(false)}
                className="text-ash-gray hover:text-polar-white bg-dark-carbon p-1 rounded-lg transition-colors"
              >
                <CloseRoundedIcon sx={{ fontSize: 20 }} />
              </button>
            </div>
            
            <div className="space-y-3">
              <NodeBadge name="Node 0" type="Fingerprint" isOnline={!!authData} />
              <NodeBadge name="Node 1" type="RFID LF" isOnline={!!lockersData?.loker_01} />
              <NodeBadge name="Node 2" type="RFID HF" isOnline={!!lockersData?.loker_02} />
              <NodeBadge name="Node 3" type="Barcode" isOnline={!!lockersData?.loker_03} />
            </div>

            <div className="mt-6 text-center text-[10px] text-ash-gray/70">
              <p>Membaca data persisten dari Firebase Realtime Database.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}