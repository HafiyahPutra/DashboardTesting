import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { listenLoanRecords, openLocker, listenAuthStatus } from '../services/firebase';

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
    <div className="min-h-screen p-6 pb-24 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-[50%] h-[30%] bg-green-600/10 rounded-full filter blur-[100px] -z-10"></div>

      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate('/menu')} className="w-12 h-12 rounded-xl bg-gray-800 text-white flex items-center justify-center hover:bg-gray-700 transition-colors border border-gray-700">
            ←
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <span className="text-green-400">📥</span> KEMBALIKAN BARANG
            </h1>
            <p className="text-gray-400 text-sm">Pilih barang yang ingin Anda kembalikan</p>
          </div>
        </div>

        <div className="glass-card animate-fadeInUp">
          <div className="p-6 border-b border-gray-800">
            <h2 className="text-lg font-semibold text-white">Daftar Peminjaman Aktif</h2>
            <p className="text-sm text-gray-400">Atas nama: {user || '...'}</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-900/50 text-gray-400 text-xs uppercase tracking-wider">
                  <th className="p-4 font-medium w-12 text-center">#</th>
                  <th className="p-4 font-medium">Nama Barang</th>
                  <th className="p-4 font-medium">Loker Asal</th>
                  <th className="p-4 font-medium">Waktu Pinjam</th>
                  <th className="p-4 font-medium text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {loans.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-gray-500">
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
                        className={`transition-colors cursor-pointer ${isSelected ? 'bg-green-900/20' : 'hover:bg-gray-800/30'}`}
                      >
                        <td className="p-4 text-center text-gray-500 font-mono text-sm">{index + 1}</td>
                        <td className="p-4">
                          <p className={`font-medium ${isSelected ? 'text-green-400' : 'text-white'}`}>{loan.item_name}</p>
                          <p className="text-xs text-gray-500 font-mono">ID: {loan.item_id}</p>
                        </td>
                        <td className="p-4">
                          <span className="badge badge-info">{loan.loker_asal.replace('_', ' ').toUpperCase()}</span>
                        </td>
                        <td className="p-4 text-sm text-gray-400">
                          {date.toLocaleDateString('id-ID')} <span className="text-gray-500">{date.toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}</span>
                        </td>
                        <td className="p-4 text-center">
                          <div className={`w-5 h-5 rounded-full border inline-flex items-center justify-center transition-colors
                            ${isSelected ? 'border-green-400 bg-green-500' : 'border-gray-500 bg-transparent'}
                          `}>
                            {isSelected && <span className="w-2 h-2 rounded-full bg-white"></span>}
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
          <div className="max-w-2xl mx-auto glass-card border-t border-green-500/30 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] p-4">
            
            <div className="bg-gray-900 rounded-lg p-3 mb-4 flex items-start gap-3 border border-gray-800">
              <div className="text-blue-400 mt-0.5">ℹ️</div>
              <div>
                <p className="text-gray-300 text-sm">
                  Barang <strong className="text-white">{selected?.item_name}</strong> harus dikembalikan ke:
                </p>
                <p className="text-green-400 font-bold mt-1 text-lg">
                  {selected?.loker_asal?.replace('loker_', 'LOKER ')}
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleReturn}
                disabled={loading}
                className="btn-success shadow-[0_0_20px_rgba(0,200,83,0.3)] w-full sm:w-auto"
              >
                {loading ? 'Membuka...' : 'Buka Loker & Kembalikan →'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}