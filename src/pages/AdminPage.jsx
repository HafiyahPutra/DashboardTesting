import { useState, useEffect } from 'react';
import { listenMasterBarang, listenAccessLog, listenAuthLog, listenAllUsers, openLocker, registerBarang, listenLockerFull } from '../services/firebase';
import { useNavigate } from 'react-router-dom';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('inventory');
  const [inventory, setInventory] = useState({});
  const [accessLogs, setAccessLogs] = useState([]);
  const [authLogs, setAuthLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();

  // Simple auth for demo
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState('');

  // Add Item state
  const [newItem, setNewItem] = useState({
    nama: '',
    kategori: '',
    loker_assignment: 'loker_01',
    tag_id: '',
    tipe: 'RFID_LF'
  });
  const [isListeningLoker, setIsListeningLoker] = useState(false);

  useEffect(() => {
    let unsub = null;
    if (isListeningLoker) {
      unsub = listenLockerFull(newItem.loker_assignment, (data) => {
        if (data && data.last_uid && data.last_uid !== newItem.tag_id) {
          setNewItem(prev => ({ ...prev, tag_id: data.last_uid }));
          setIsListeningLoker(false);
          alert(`Berhasil! Tag/Barcode terdeteksi: ${data.last_uid}`);
        }
      });
    }
    return () => {
      if (unsub) unsub();
    };
  }, [isListeningLoker, newItem.loker_assignment, newItem.tag_id]);

  const handleAddBarang = async (e) => {
    e.preventDefault();
    try {
      const data = {
        tag_id: newItem.tag_id,
        tipe: newItem.tipe,
        loker: newItem.loker_assignment,
        loker_assignment: newItem.loker_assignment,
        nama: newItem.nama,
        status: 'tersedia',
        current_borrower: '',
        kategori: newItem.kategori,
        timestamp: new Date().toISOString()
      };
      
      if (newItem.tipe === 'BARCODE') {
        data.barcode = newItem.tag_id;
      }

      await registerBarang(newItem.tag_id, data);
      alert('Barang berhasil ditambahkan!');
      setNewItem({ nama: '', kategori: '', loker_assignment: 'loker_01', tag_id: '', tipe: 'RFID_LF' });
      setActiveTab('inventory');
    } catch (err) {
      alert('Gagal menyimpan: ' + err.message);
    }
  };

  useEffect(() => {
    if (!isLoggedIn) return;

    const unsubBarang = listenMasterBarang(data => setInventory(data || {}));
    const unsubAccess = listenAccessLog(data => setAccessLogs(data.reverse()));
    const unsubAuth = listenAuthLog(data => setAuthLogs(data.reverse()));
    const unsubUsers = listenAllUsers(data => setUsers(data));

    return () => {
      unsubBarang();
      unsubAccess();
      unsubAuth();
      unsubUsers();
    };
  }, [isLoggedIn]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === 'admin123') {
      setIsLoggedIn(true);
    } else {
      alert('Password salah!');
    }
  };

  const handleOpenLockerTest = async (lokerId) => {
    if (window.confirm(`Buka ${lokerId} sekarang?`)) {
      await openLocker(lokerId);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6 relative">
        <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-blue-900/20 rounded-full filter blur-[120px]"></div>
        <div className="glass-card max-w-sm w-full p-8 relative z-10 animate-fadeInUp">
          <div className="text-center mb-6">
            <span className="text-4xl mb-2 block">👨‍💻</span>
            <h1 className="text-2xl font-bold text-white">Admin Login</h1>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                placeholder="Password (admin123)"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="input-field"
              />
            </div>
            <button type="submit" className="w-full btn-primary">Login</button>
            <button type="button" onClick={() => navigate('/')} className="w-full btn-ghost text-sm mt-2">Kembali ke App</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 p-6 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full filter blur-[100px] -z-10"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-600/10 rounded-full filter blur-[100px] -z-10"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <span className="text-blue-400">⚡</span> Admin Dashboard
            </h1>
            <p className="text-gray-400 text-sm mt-1">Sistem Inventaris IoT & Autentikasi Biometrik</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => navigate('/')} className="btn-ghost">Ke Aplikasi User</button>
            <button onClick={() => setIsLoggedIn(false)} className="btn-danger">Logout</button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto gap-2 mb-6 pb-2 scrollbar-hide">
          <button 
            onClick={() => setActiveTab('inventory')}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${activeTab === 'inventory' ? 'bg-blue-600 text-white' : 'glass-card text-gray-400 hover:text-white'}`}
          >
            📦 Master Barang
          </button>
          <button 
            onClick={() => setActiveTab('add_item')}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${activeTab === 'add_item' ? 'bg-cyan-600 text-white' : 'glass-card text-gray-400 hover:text-white'}`}
          >
            ➕ Tambah Barang
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${activeTab === 'users' ? 'bg-purple-600 text-white' : 'glass-card text-gray-400 hover:text-white'}`}
          >
            👥 Data Pengguna
          </button>
          <button 
            onClick={() => setActiveTab('logs_access')}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${activeTab === 'logs_access' ? 'bg-green-600 text-white' : 'glass-card text-gray-400 hover:text-white'}`}
          >
            📋 Log Akses Loker
          </button>
          <button 
            onClick={() => setActiveTab('logs_auth')}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${activeTab === 'logs_auth' ? 'bg-yellow-600 text-white' : 'glass-card text-gray-400 hover:text-white'}`}
          >
            🔐 Log Autentikasi
          </button>
          <button 
            onClick={() => setActiveTab('tools')}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${activeTab === 'tools' ? 'bg-red-600 text-white' : 'glass-card text-gray-400 hover:text-white'}`}
          >
            🛠️ Hardware Tools
          </button>
        </div>

        {/* Tab Content: Inventory */}
        {activeTab === 'inventory' && (
          <div className="glass-card p-6 animate-fadeIn">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Master Data Barang</h2>
              <div className="badge badge-info">{Object.keys(inventory).length} Item Terdaftar</div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-900/50 text-gray-400 text-xs uppercase tracking-wider">
                    <th className="p-4 font-medium rounded-tl-lg">Nama Barang</th>
                    <th className="p-4 font-medium">Tag ID / Barcode</th>
                    <th className="p-4 font-medium">Tipe Sensor</th>
                    <th className="p-4 font-medium">Loker</th>
                    <th className="p-4 font-medium">Status</th>
                    <th className="p-4 font-medium rounded-tr-lg">Peminjam Saat Ini</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {Object.values(inventory).map((item, i) => (
                    <tr key={i} className="hover:bg-gray-800/30 transition-colors">
                      <td className="p-4 text-white font-medium">{item.nama}</td>
                      <td className="p-4 text-gray-400 font-mono text-sm">{item.tag_id || item.barcode}</td>
                      <td className="p-4 text-gray-400 text-sm">{item.tipe}</td>
                      <td className="p-4"><span className="badge badge-info">{item.loker_assignment}</span></td>
                      <td className="p-4">
                        <span className={`badge ${item.status === 'tersedia' ? 'badge-success' : 'badge-danger'}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="p-4 text-gray-300">{item.current_borrower || '-'}</td>
                    </tr>
                  ))}
                  {Object.keys(inventory).length === 0 && (
                    <tr><td colSpan="6" className="p-8 text-center text-gray-500">Belum ada barang terdaftar</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab Content: Add Item */}
        {activeTab === 'add_item' && (
          <div className="glass-card p-6 animate-fadeIn max-w-2xl mx-auto">
            <h2 className="text-xl font-bold text-white mb-6">Tambah Barang Baru</h2>
            
            <form onSubmit={handleAddBarang} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 uppercase font-semibold mb-1">Nama Barang</label>
                  <input required type="text" value={newItem.nama} onChange={e => setNewItem({...newItem, nama: e.target.value})} className="input-field" placeholder="Contoh: Tang Potong" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 uppercase font-semibold mb-1">Kategori</label>
                  <input required type="text" value={newItem.kategori} onChange={e => setNewItem({...newItem, kategori: e.target.value})} className="input-field" placeholder="Contoh: Perkakas" />
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-400 uppercase font-semibold mb-1">Pilih Loker Penyimpanan</label>
                <select value={newItem.loker_assignment} onChange={e => {
                  const val = e.target.value;
                  setNewItem({...newItem, loker_assignment: val, tipe: val === 'loker_01' ? 'RFID_LF' : val === 'loker_02' ? 'RFID_HF' : 'BARCODE'});
                }} className="input-field cursor-pointer bg-gray-900 border-gray-700">
                  <option value="loker_01">LOKER 1 (RFID LF / 125kHz)</option>
                  <option value="loker_02">LOKER 2 (RFID HF / 13.56MHz)</option>
                  <option value="loker_03">LOKER 3 (Barcode / Kamera)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-400 uppercase font-semibold mb-1">Tag ID / Barcode</label>
                <div className="flex gap-2">
                  <input required type="text" value={newItem.tag_id} onChange={e => setNewItem({...newItem, tag_id: e.target.value})} className="input-field flex-1" placeholder="UID Tag atau Barcode" />
                  <button type="button" onClick={() => setIsListeningLoker(true)} className={`px-4 rounded-lg font-bold transition-colors ${isListeningLoker ? 'bg-yellow-500 text-gray-900 animate-pulse' : 'btn-ghost'}`}>
                    {isListeningLoker ? 'Mendengarkan...' : 'Scan via Alat'}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Ketik manual atau klik "Scan via Alat" lalu tempelkan tag ke alat fisik / simulator.</p>
              </div>

              <div className="pt-4 border-t border-gray-800">
                <button type="submit" className="w-full btn-primary py-3">Simpan Barang Baru</button>
              </div>
            </form>
          </div>
        )}

        {/* Tab Content: Users */}
        {activeTab === 'users' && (
          <div className="glass-card p-6 animate-fadeIn">
            <h2 className="text-xl font-bold text-white mb-6">Pengguna Terdaftar (Fingerprint)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {users.map((user, i) => (
                <div key={i} className="bg-gray-900/50 rounded-xl p-4 border border-gray-800 flex gap-4 items-center">
                  <div className="w-12 h-12 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xl border border-purple-500/30 shrink-0">
                    {user.name.charAt(0)}
                  </div>
                  <div className="overflow-hidden">
                    <h3 className="text-white font-bold truncate">{user.name}</h3>
                    <p className="text-xs text-gray-400 mb-1">NIM: {user.nim}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-blue-900/50 text-blue-400 px-2 py-0.5 rounded font-mono">ID #{user.finger_id}</span>
                      {user.active && <span className="w-2 h-2 rounded-full bg-green-500"></span>}
                    </div>
                  </div>
                </div>
              ))}
              {users.length === 0 && (
                <div className="col-span-full py-8 text-center text-gray-500">Belum ada pengguna</div>
              )}
            </div>
          </div>
        )}

        {/* Tab Content: Access Logs */}
        {activeTab === 'logs_access' && (
          <div className="glass-card p-6 animate-fadeIn">
            <h2 className="text-xl font-bold text-white mb-6">Log Akses Loker (Hardware)</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-900/50 text-gray-400 text-xs uppercase tracking-wider">
                    <th className="p-4 font-medium">Waktu</th>
                    <th className="p-4 font-medium">User</th>
                    <th className="p-4 font-medium">Aksi</th>
                    <th className="p-4 font-medium">Loker</th>
                    <th className="p-4 font-medium">Barang/Tag</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {accessLogs.slice(0, 50).map((log, i) => (
                    <tr key={i} className="hover:bg-gray-800/30 transition-colors">
                      <td className="p-4 text-gray-400 text-sm font-mono whitespace-nowrap">{log.timestamp}</td>
                      <td className="p-4 text-white">{log.user || 'Sistem'}</td>
                      <td className="p-4">
                        <span className={`text-xs font-bold px-2 py-1 rounded ${log.action === 'OPEN' ? 'bg-blue-900/50 text-blue-400' : 'bg-gray-800 text-gray-300'}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="p-4 text-gray-300">{log.loker}</td>
                      <td className="p-4 text-gray-400 text-sm truncate max-w-[200px]">{log.item || log.uid || log.reason || '-'}</td>
                    </tr>
                  ))}
                  {accessLogs.length === 0 && (
                    <tr><td colSpan="5" className="p-8 text-center text-gray-500">Belum ada log akses</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-500 mt-4 text-center">Menampilkan 50 log terakhir</p>
          </div>
        )}

        {/* Tab Content: Auth Logs */}
        {activeTab === 'logs_auth' && (
          <div className="glass-card p-6 animate-fadeIn">
            <h2 className="text-xl font-bold text-white mb-6">Log Autentikasi Sidik Jari</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-900/50 text-gray-400 text-xs uppercase tracking-wider">
                    <th className="p-4 font-medium">Waktu</th>
                    <th className="p-4 font-medium">Pengguna</th>
                    <th className="p-4 font-medium">Finger ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {authLogs.slice(0, 50).map((log, i) => (
                    <tr key={i} className="hover:bg-gray-800/30 transition-colors">
                      <td className="p-4 text-gray-400 text-sm font-mono">{log.timestamp}</td>
                      <td className="p-4 text-green-400 font-medium">✓ {log.user}</td>
                      <td className="p-4 text-gray-300 font-mono">#{log.finger_id}</td>
                    </tr>
                  ))}
                  {authLogs.length === 0 && (
                    <tr><td colSpan="3" className="p-8 text-center text-gray-500">Belum ada log autentikasi</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-500 mt-4 text-center">Menampilkan 50 log terakhir</p>
          </div>
        )}

        {/* Tab Content: Tools */}
        {activeTab === 'tools' && (
          <div className="glass-card p-6 animate-fadeIn">
            <h2 className="text-xl font-bold text-white mb-6">Hardware Diagnostic Tools</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-900/50 rounded-xl p-5 border border-gray-800 text-center">
                <div className="text-4xl mb-3">📦</div>
                <h3 className="text-white font-bold mb-1">Loker 1</h3>
                <p className="text-xs text-blue-400 font-mono mb-4">Node 1 (RFID LF)</p>
                <button onClick={() => handleOpenLockerTest('loker_01')} className="btn-primary w-full text-sm">Force Open</button>
              </div>
              
              <div className="bg-gray-900/50 rounded-xl p-5 border border-gray-800 text-center">
                <div className="text-4xl mb-3">🧰</div>
                <h3 className="text-white font-bold mb-1">Loker 2</h3>
                <p className="text-xs text-blue-400 font-mono mb-4">Node 2 (RFID HF)</p>
                <button onClick={() => handleOpenLockerTest('loker_02')} className="btn-primary w-full text-sm">Force Open</button>
              </div>

              <div className="bg-gray-900/50 rounded-xl p-5 border border-gray-800 text-center">
                <div className="text-4xl mb-3">🏷️</div>
                <h3 className="text-white font-bold mb-1">Loker 3</h3>
                <p className="text-xs text-blue-400 font-mono mb-4">Node 3 (Barcode)</p>
                <button onClick={() => handleOpenLockerTest('loker_03')} className="btn-primary w-full text-sm">Force Open</button>
              </div>
            </div>
            
            <div className="mt-8 bg-blue-900/20 border border-blue-500/30 rounded-xl p-4 text-sm text-blue-200">
              <p><strong>Info:</strong> Fitur Force Open digunakan untuk troubleshooting jika solenoid loker bermasalah atau barang tersangkut. Loker akan terbuka selama durasi default firmware lalu terkunci kembali otomatis.</p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
