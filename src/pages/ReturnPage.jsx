import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { listenLoanRecords, openLocker, listenAuthStatus } from '../services/firebase';
import InputRoundedIcon from '@mui/icons-material/InputRounded';
import InfoRoundedIcon from '@mui/icons-material/InfoRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';

export default function ReturnPage() {
  const [loans, setLoans] = useState([]);
  const [selected, setSelected] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubAuth = listenAuthStatus((data) => {
      setUser(data?.user);
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (user) {
      const unsubLoans = listenLoanRecords((data) => {
        setLoans(data.filter(loan => loan.status === 'active' && loan.user_name === user));
      });
      return () => unsubLoans();
    }
  }, [user]);

  const handleSelect = (loan) => {
    setSelected(loan);
  };

  const handleReturn = async () => {
    if (!selected) return;
    setLoading(true);
    await openLocker(selected.loker_asal);
    navigate('/scan', { state: { mode: 'return', item: selected, loker: selected.loker_asal } });
  };

  return (
    <div className="min-h-screen p-6 pb-48 md:pb-24 relative overflow-hidden">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate('/menu')} className="w-12 h-12 rounded-xl bg-dark-carbon text-polar-white flex items-center justify-center hover:bg-dark-carbon/80 transition-colors border border-dark-carbon">
            <ArrowBackRoundedIcon sx={{ fontSize: 24 }} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-polar-white tracking-tight flex items-center gap-2">
              <span className="text-polar-white flex items-center"><InputRoundedIcon fontSize="large" /></span> KEMBALIKAN BARANG
            </h1>
            <p className="text-ash-gray text-sm">Pilih barang yang ingin Anda kembalikan</p>
          </div>
        </div>

        <div className="glass-card animate-fadeInUp">
          <div className="p-6 border-b border-dark-carbon">
            <h2 className="text-lg font-semibold text-polar-white">Daftar Peminjaman Aktif</h2>
            <p className="text-sm text-ash-gray">Atas nama: {user || '...'}</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-deep-space/50 text-ash-gray text-xs uppercase tracking-wider">
                  <th className="p-4 font-medium w-12 text-center">#</th>
                  <th className="p-4 font-medium">Nama Barang</th>
                  <th className="p-4 font-medium">Loker Asal</th>
                  <th className="p-4 font-medium">Waktu Pinjam</th>
                  <th className="p-4 font-medium text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-carbon">
                {loans.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-ash-gray">
                      Anda tidak memiliki peminjaman aktif.
                    </td>
                  </tr>
                ) : (
                  loans.map((loan, index) => {
                    const isSelected = selected?.id === loan.id;
                    const date = new Date(loan.timestamp_pinjam);
                    
                    return (
                      <tr 
                        key={loan.id} 
                        onClick={() => handleSelect(loan)}
                        className={`transition-colors cursor-pointer ${isSelected ? 'bg-amber-glow/10' : 'hover:bg-dark-carbon/30'}`}
                      >
                        <td className="p-4 text-center text-ash-gray font-mono text-sm">{index + 1}</td>
                        <td className="p-4">
                          <p className={`font-medium ${isSelected ? 'text-polar-white' : 'text-polar-white'}`}>{loan.item_name}</p>
                          <p className="text-xs text-ash-gray font-mono">ID: {loan.item_id}</p>
                        </td>
                        <td className="p-4">
                          <span className="badge badge-info">{loan.loker_asal.replace('_', ' ').toUpperCase()}</span>
                        </td>
                        <td className="p-4 text-sm text-ash-gray">
                          {date.toLocaleDateString('id-ID')} <span className="text-ash-gray">{date.toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}</span>
                        </td>
                        <td className="p-4 text-center">
                          <div className={`w-5 h-5 rounded-full border inline-flex items-center justify-center transition-colors
                            ${isSelected ? 'border-amber-glow bg-amber-glow' : 'border-ash-gray bg-transparent'}
                          `}>
                            {isSelected && <span className="w-2 h-2 rounded-full bg-midnight-void"></span>}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Floating Action Bar */}
        <div className={`fixed bottom-0 left-0 w-full p-4 transition-transform duration-300 z-50 ${selected ? 'translate-y-0' : 'translate-y-full'}`}>
          <div className="max-w-2xl mx-auto glass-card border-t border-amber-glow/30 shadow-[0_-4px_20px_rgba(0,0,0,0.5)] p-4">
            
            <div className="bg-deep-space rounded-lg p-3 mb-4 flex items-start gap-3 border border-dark-carbon">
              <div className="text-polar-white mt-0.5"><InfoRoundedIcon /></div>
              <div>
                <p className="text-slate-ui text-sm">
                  Barang <strong className="text-polar-white">{selected?.item_name}</strong> harus dikembalikan ke:
                </p>
                <p className="text-polar-white font-bold mt-1 text-lg">
                  {selected?.loker_asal?.replace('loker_', 'LOKER ')}
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleReturn}
                disabled={loading}
                className="btn-success w-full sm:w-auto"
              >
                {loading ? 'Membuka...' : <span className="flex items-center gap-2">Buka Loker & Kembalikan <ArrowForwardRoundedIcon sx={{ fontSize: 18 }} /></span>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}