import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { listenMasterBarang, openLocker } from '../services/firebase';
import OutputIcon from '@mui/icons-material/Output';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import HomeRepairServiceIcon from '@mui/icons-material/HomeRepairService';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

export default function BorrowPage() {
  const [barang, setBarang] = useState({});
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [durationPreset, setDurationPreset] = useState('1');
  const [customDuration, setCustomDuration] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = listenMasterBarang((data) => {
      setBarang(data || {});
    });
    return () => unsub();
  }, []);

  const handleSelect = (item) => {
    setSelected(item);
  };

  const handleBorrow = async () => {
    if (!selected) return;
    
    let finalDuration = parseInt(durationPreset);
    if (durationPreset === 'custom') {
      finalDuration = parseInt(customDuration);
      if (isNaN(finalDuration) || finalDuration <= 0) {
        alert("Masukkan durasi yang valid dalam menit!");
        return;
      }
    }
    
    setLoading(true);
    await openLocker(selected.loker_assignment);
    navigate('/scan', { state: { mode: 'borrow', item: selected, duration: finalDuration } });
  };

  const lockers = [
    { id: 'loker_01', name: 'LOKER 1', type: 'RFID LF', icon: <Inventory2Icon /> },
    { id: 'loker_02', name: 'LOKER 2', type: 'RFID HF', icon: <HomeRepairServiceIcon /> },
    { id: 'loker_03', name: 'LOKER 3', type: 'Barcode', icon: <LocalOfferIcon /> }
  ];

  return (
    <div className="min-h-screen p-6 pb-24 relative overflow-hidden">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate('/menu')} className="w-12 h-12 rounded-xl bg-dark-carbon text-polar-white flex items-center justify-center hover:bg-dark-carbon/80 transition-colors border border-dark-carbon">
            ←
          </button>
          <div>
            <h1 className="text-2xl font-bold text-polar-white tracking-tight flex items-center gap-2">
              <span className="text-polar-white flex items-center"><OutputIcon fontSize="large" /></span> PINJAM BARANG
            </h1>
            <p className="text-ash-gray text-sm">Pilih barang yang tersedia dari loker</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {lockers.map((loker, idx) => (
            <div key={loker.id} className="glass-card flex flex-col h-full animate-fadeInUp" style={{ animationDelay: `${idx * 0.1}s` }}>
              <div className="p-5 border-b border-dark-carbon/50 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-dark-carbon flex items-center justify-center text-xl shadow-inner">
                  {loker.icon}
                </div>
                <div>
                  <h2 className="text-polar-white font-bold">{loker.name}</h2>
                  <p className="text-xs text-polar-white font-mono">{loker.type}</p>
                </div>
              </div>
              
              <div className="p-2 flex-1 overflow-y-auto max-h-[400px]">
                <ul className="space-y-2">
                  {Object.values(barang)
                    .filter(item => item.loker_assignment === loker.id)
                    .map((item) => {
                      const isAvailable = item.status === 'tersedia';
                      const isSelected = selected?.tag_id === item.tag_id;
                      
                      return (
                        <li 
                          key={item.tag_id} 
                          onClick={() => isAvailable && handleSelect(item)}
                          className={`
                            p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between
                            ${isSelected ? 'bg-amber-glow/10 border-amber-glow' : 
                              isAvailable ? 'bg-dark-carbon/50 border-dark-carbon hover:bg-dark-carbon/80 hover:border-dark-carbon' : 
                              'bg-deep-space/50 border-dark-carbon/50 opacity-60 cursor-not-allowed'}
                          `}
                        >
                          <div>
                            <p className={`font-medium text-sm ${isSelected ? 'text-polar-white' : 'text-polar-white'}`}>
                              {item.nama}
                            </p>
                            <p className="text-ash-gray text-xs mt-0.5">{item.kategori || 'Tanpa kategori'}</p>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className={`badge ${isAvailable ? 'badge-success' : 'badge-danger'} text-[10px]`}>
                              {isAvailable ? 'Tersedia' : 'Dipinjam'}
                            </span>
                            {isAvailable && (
                              <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors
                                ${isSelected ? 'border-amber-glow bg-amber-glow' : 'border-ash-gray bg-transparent'}
                              `}>
                                {isSelected && <span className="w-2 h-2 rounded-full bg-midnight-void"></span>}
                              </div>
                            )}
                          </div>
                        </li>
                      );
                    })}
                    
                    {Object.values(barang).filter(item => item.loker_assignment === loker.id).length === 0 && (
                      <div className="text-center py-8 text-ash-gray text-sm">
                        Belum ada barang
                      </div>
                    )}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Floating Action Bar */}
        <div className={`fixed bottom-0 left-0 w-full p-4 transition-transform duration-300 z-50 ${selected ? 'translate-y-0' : 'translate-y-full'}`}>
          <div className="max-w-4xl mx-auto glass-card border-t border-amber-glow/30 shadow-[0_-4px_20px_rgba(0,0,0,0.5)] p-4 flex flex-col md:flex-row items-center justify-between gap-4">
            
            {/* Item Info */}
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="w-12 h-12 bg-amber-glow/15 rounded-xl flex items-center justify-center text-polar-white shrink-0">
                <Inventory2Icon />
              </div>
              <div className="flex-1">
                <p className="text-ash-gray text-xs uppercase tracking-wider font-semibold">Barang Terpilih</p>
                <p className="text-polar-white font-bold truncate max-w-[200px]">{selected?.nama}</p>
                <p className="text-polar-white text-xs">{selected?.loker_assignment?.replace('_', ' ').toUpperCase()}</p>
              </div>
            </div>
            
            {/* Duration Selector */}
            <div className="flex items-center gap-3 w-full md:w-auto bg-deep-space/50 p-2 rounded-xl border border-dark-carbon">
              <AccessTimeIcon sx={{ fontSize: 20, color: '#949494' }} />
              <div className="flex flex-col">
                <label className="text-[10px] text-ash-gray uppercase font-semibold">Batas Waktu</label>
                <div className="flex gap-2">
                  <select 
                    value={durationPreset} 
                    onChange={e => setDurationPreset(e.target.value)}
                    className="bg-dark-carbon text-polar-white border border-dark-carbon rounded-lg px-2 py-1 text-sm outline-none cursor-pointer"
                  >
                    <option value="1">1 Menit</option>
                    <option value="2">2 Menit</option>
                    <option value="5">5 Menit</option>
                    <option value="30">30 Menit</option>
                    <option value="60">1 Jam (60 Menit)</option>
                    <option value="custom">Kustom...</option>
                  </select>
                  
                  {durationPreset === 'custom' && (
                    <div className="flex items-center gap-1">
                      <input 
                        type="number" 
                        min="1"
                        value={customDuration}
                        onChange={e => setCustomDuration(e.target.value)}
                        placeholder="Mnt"
                        className="w-16 bg-dark-carbon text-polar-white border border-dark-carbon rounded-lg px-2 py-1 text-sm outline-none text-center"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Action Button */}
            <button
              onClick={handleBorrow}
              disabled={loading}
              className="btn-primary whitespace-nowrap w-full md:w-auto"
            >
              {loading ? 'Membuka...' : 'Buka Loker & Pinjam →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}