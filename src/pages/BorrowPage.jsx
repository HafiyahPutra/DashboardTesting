import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { listenMasterBarang, openLocker } from '../services/firebase';

export default function BorrowPage() {
  const [barang, setBarang] = useState({});
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
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
    setLoading(true);
    await openLocker(selected.loker_assignment);
    navigate('/scan', { state: { mode: 'borrow', item: selected } });
  };

  const lockers = [
    { id: 'loker_01', name: 'LOKER 1', type: 'RFID LF', icon: '📦' },
    { id: 'loker_02', name: 'LOKER 2', type: 'RFID HF', icon: '🧰' },
    { id: 'loker_03', name: 'LOKER 3', type: 'Barcode', icon: '🏷️' }
  ];

  return (
    <div className="min-h-screen p-6 pb-24 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[50%] h-[30%] bg-blue-600/10 rounded-full filter blur-[100px] -z-10"></div>
      
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate('/menu')} className="w-12 h-12 rounded-xl bg-gray-800 text-white flex items-center justify-center hover:bg-gray-700 transition-colors border border-gray-700">
            ←
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <span className="text-blue-400">📤</span> PINJAM BARANG
            </h1>
            <p className="text-gray-400 text-sm">Pilih barang yang tersedia dari loker</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {lockers.map((loker, idx) => (
            <div key={loker.id} className="glass-card flex flex-col h-full animate-fadeInUp" style={{ animationDelay: `${idx * 0.1}s` }}>
              <div className="p-5 border-b border-gray-800/50 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center text-xl shadow-inner">
                  {loker.icon}
                </div>
                <div>
                  <h2 className="text-white font-bold">{loker.name}</h2>
                  <p className="text-xs text-blue-400 font-mono">{loker.type}</p>
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
                            ${isSelected ? 'bg-blue-900/40 border-blue-500 shadow-[0_0_15px_rgba(0,153,255,0.2)]' : 
                              isAvailable ? 'bg-gray-800/50 border-gray-700 hover:bg-gray-700/50 hover:border-gray-600' : 
                              'bg-gray-900/50 border-gray-800/50 opacity-60 cursor-not-allowed'}
                          `}
                        >
                          <div>
                            <p className={`font-medium text-sm ${isSelected ? 'text-white' : 'text-gray-200'}`}>
                              {item.nama}
                            </p>
                            <p className="text-gray-500 text-xs mt-0.5">{item.kategori || 'Tanpa kategori'}</p>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className={`badge ${isAvailable ? 'badge-success' : 'badge-danger'} text-[10px]`}>
                              {isAvailable ? 'Tersedia' : 'Dipinjam'}
                            </span>
                            {isAvailable && (
                              <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors
                                ${isSelected ? 'border-blue-400 bg-blue-500' : 'border-gray-500 bg-transparent'}
                              `}>
                                {isSelected && <span className="w-2 h-2 rounded-full bg-white"></span>}
                              </div>
                            )}
                          </div>
                        </li>
                      );
                    })}
                    
                    {Object.values(barang).filter(item => item.loker_assignment === loker.id).length === 0 && (
                      <div className="text-center py-8 text-gray-500 text-sm">
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
          <div className="max-w-2xl mx-auto glass-card border-t border-blue-500/30 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center text-2xl">
                📦
              </div>
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold">Barang Terpilih</p>
                <p className="text-white font-bold">{selected?.nama}</p>
                <p className="text-blue-400 text-xs">{selected?.loker_assignment?.replace('_', ' ').toUpperCase()}</p>
              </div>
            </div>
            
            <button
              onClick={handleBorrow}
              disabled={loading}
              className="btn-primary shadow-[0_0_20px_rgba(0,153,255,0.4)]"
            >
              {loading ? 'Membuka...' : 'Buka Loker & Pinjam →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}