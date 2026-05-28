import { useState, useEffect } from 'react';
import { listenMasterBarang, listenAccessLog, listenAuthLog, listenAllUsers, openLocker, registerBarang, listenLockerFull, deleteBarang, updateBarang, listenLoanRecords, updateLoanReturn, updateBarangBorrower, deleteUser } from '../services/firebase';
import { useNavigate } from 'react-router-dom';
import SecurityIcon from '@mui/icons-material/Security';
import StorageIcon from '@mui/icons-material/Storage';
import AddBoxIcon from '@mui/icons-material/AddBox';
import GroupIcon from '@mui/icons-material/Group';
import AssignmentIcon from '@mui/icons-material/Assignment';
import LockIcon from '@mui/icons-material/Lock';
import BuildIcon from '@mui/icons-material/Build';
import ElectricBoltIcon from '@mui/icons-material/ElectricBolt';
import InboxIcon from '@mui/icons-material/Inbox';
import LabelIcon from '@mui/icons-material/Label';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn';
import CloseIcon from '@mui/icons-material/Close';
import DashboardIcon from '@mui/icons-material/Dashboard';
import WarningIcon from '@mui/icons-material/Warning';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import HistoryIcon from '@mui/icons-material/History';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [inventory, setInventory] = useState({});
  const [accessLogs, setAccessLogs] = useState([]);
  const [authLogs, setAuthLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [loans, setLoans] = useState([]);
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
  
  // Edit Item state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  
  // User Modal state
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  
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
    const unsubLoans = listenLoanRecords(data => setLoans(data));

    return () => {
      unsubBarang();
      unsubAccess();
      unsubAuth();
      unsubUsers();
      unsubLoans();
    };
  }, [isLoggedIn]);

  const handleDeleteBarang = async (tagId, nama) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus barang "${nama}"? (Riwayat peminjaman tetap akan tersimpan)`)) {
      try {
        await deleteBarang(tagId);
        alert('Barang berhasil dihapus!');
      } catch (err) {
        alert('Gagal menghapus: ' + err.message);
      }
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const dataToUpdate = { ...editItem };
      if (dataToUpdate.tipe === 'BARCODE') {
        dataToUpdate.barcode = dataToUpdate.tag_id;
      }
      await updateBarang(dataToUpdate.tag_id, dataToUpdate);
      alert('Perubahan berhasil disimpan!');
      setShowEditModal(false);
      setEditItem(null);
    } catch (err) {
      alert('Gagal menyimpan perubahan: ' + err.message);
    }
  };

  const handleForceReturn = async (loan) => {
    if (window.confirm(`Peringatan: Force Return akan menandai barang ini telah dikembalikan oleh ${loan.user_name}. Lanjutkan?`)) {
      try {
        await updateLoanReturn(loan.id, {
          timestamp_kembali: new Date().toISOString(),
          status: 'returned',
          keterangan: 'Force Return by Admin'
        });
        await updateBarangBorrower(loan.item_id, "", "tersedia");
        alert('Barang berhasil dikembalikan secara paksa!');
      } catch (err) {
        alert('Gagal melakukan Force Return: ' + err.message);
      }
    }
  };

  const handleDeleteUser = async (user) => {
    if (window.confirm(`PERINGATAN: Apakah Anda yakin ingin menghapus data pengguna "${user.name}" (ID #${user.finger_id})?\n\nMenekan OK akan menghapus profil ini dari Firebase dan mencabut sidik jarinya dari sensor fisik secara permanen.`)) {
      try {
        await deleteUser(user.finger_id);
        alert(`Pengguna ${user.name} berhasil dihapus dari sistem!`);
        setShowUserModal(false);
        setSelectedUser(null);
      } catch (err) {
        alert('Gagal menghapus pengguna: ' + err.message);
      }
    }
  };

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

  // -----------------------------------------------------
  // Data Processing for Dashboard Analytics
  // -----------------------------------------------------
  
  // 1. Line Chart Data (Last 7 days of borrowing)
  const getChartData = () => {
    const counts = {};
    loans.forEach(l => {
      // Parse ISO string to short date (e.g. 26 Mei)
      const d = new Date(l.timestamp_pinjam);
      if (!isNaN(d.getTime())) {
        const date = d.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' });
        counts[date] = (counts[date] || 0) + 1;
      }
    });
    
    // Fill the last 7 days array
    const result = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' });
      result.push({ date: dateStr, count: counts[dateStr] || 0 });
    }
    return result;
  };
  const chartData = getChartData();

  // 2. Timeline Activity Feed (Combined)
  const getTimelineData = () => {
    const timeline = [];
    
    // Access logs
    accessLogs.forEach((log, idx) => {
      const time = new Date(log.timestamp);
      if (!isNaN(time.getTime())) {
        timeline.push({
          id: `access-${idx}-${time.getTime()}`,
          time,
          type: log.action === 'OPEN' ? 'access_open' : 'access_close',
          user: log.user || 'Sistem',
          detail: `Akses ${log.loker} ${log.item ? `(${log.item})` : ''}`,
        });
      }
    });

    // Loans
    loans.forEach(loan => {
      const timeP = new Date(loan.timestamp_pinjam);
      if (!isNaN(timeP.getTime())) {
        timeline.push({
          id: `pinjam-${loan.id}`,
          time: timeP,
          type: 'borrow',
          user: loan.user_name,
          detail: `Meminjam ${loan.item_name}`,
        });
      }
      
      if (loan.status === 'returned' && loan.timestamp_kembali) {
        const timeK = new Date(loan.timestamp_kembali);
        if (!isNaN(timeK.getTime())) {
          timeline.push({
            id: `kembali-${loan.id}`,
            time: timeK,
            type: 'return',
            user: loan.user_name,
            detail: `Mengembalikan ${loan.item_name}`,
          });
        }
      }
    });

    // Sort descending by time
    timeline.sort((a, b) => b.time - a.time);
    return timeline.slice(0, 15); // Top 15 recent
  };
  const timelineData = getTimelineData();
  // -----------------------------------------------------

  if (!isLoggedIn) {
    return (
      <div className="relative flex items-center justify-center min-h-screen p-6 bg-midnight-void">
        <div className="relative z-10 w-full max-w-sm p-8 glass-card animate-fadeInUp">
          <div className="mb-6 text-center">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-2 rounded-full bg-dark-carbon">
              <SecurityIcon sx={{ fontSize: 32, color: '#F3F3F3' }} />
            </div>
            <h1 className="text-2xl font-bold text-polar-white">Admin Login</h1>
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
            <button type="button" onClick={() => navigate('/')} className="w-full mt-2 text-sm btn-ghost">Kembali ke App</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen p-6 overflow-hidden bg-midnight-void">

      <div className="relative z-10 mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 mb-8 md:flex-row md:items-center">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-polar-white">
              <ElectricBoltIcon sx={{ color: '#F3F3F3', fontSize: 28 }} /> Admin Dashboard
            </h1>
            <p className="mt-1 text-sm text-ash-gray">Sistem Inventaris IoT & Autentikasi Biometrik</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => navigate('/')} className="btn-ghost">Ke Aplikasi User</button>
            <button onClick={() => setIsLoggedIn(false)} className="btn-danger">Logout</button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 pb-2 mb-6 overflow-x-auto scrollbar-hide">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${activeTab === 'dashboard' ? 'bg-amber-glow text-midnight-void' : 'glass-card text-ash-gray hover:text-polar-white'}`}
          >
            <DashboardIcon sx={{ fontSize: 18 }} /> Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('inventory')}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${activeTab === 'inventory' ? 'bg-amber-glow text-midnight-void' : 'glass-card text-ash-gray hover:text-polar-white'}`}
          >
            <StorageIcon sx={{ fontSize: 18 }} /> Master Barang
          </button>
          <button 
            onClick={() => setActiveTab('add_item')}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${activeTab === 'add_item' ? 'bg-amber-glow text-midnight-void' : 'glass-card text-ash-gray hover:text-polar-white'}`}
          >
            <AddBoxIcon sx={{ fontSize: 18 }} /> Tambah Barang
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${activeTab === 'users' ? 'bg-amber-glow text-midnight-void' : 'glass-card text-ash-gray hover:text-polar-white'}`}
          >
            <GroupIcon sx={{ fontSize: 18 }} /> Data Pengguna
          </button>
          <button 
            onClick={() => setActiveTab('active_loans')}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${activeTab === 'active_loans' ? 'bg-amber-glow text-midnight-void' : 'glass-card text-ash-gray hover:text-polar-white'}`}
          >
            <AssignmentReturnIcon sx={{ fontSize: 18 }} /> Peminjaman Aktif
          </button>
          <button 
            onClick={() => setActiveTab('logs_access')}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${activeTab === 'logs_access' ? 'bg-amber-glow text-midnight-void' : 'glass-card text-ash-gray hover:text-polar-white'}`}
          >
            <AssignmentIcon sx={{ fontSize: 18 }} /> Log Akses Loker
          </button>
          <button 
            onClick={() => setActiveTab('logs_auth')}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${activeTab === 'logs_auth' ? 'bg-amber-glow text-midnight-void' : 'glass-card text-ash-gray hover:text-polar-white'}`}
          >
            <LockIcon sx={{ fontSize: 18 }} /> Log Autentikasi
          </button>
          <button 
            onClick={() => setActiveTab('tools')}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${activeTab === 'tools' ? 'bg-amber-glow text-midnight-void' : 'glass-card text-ash-gray hover:text-polar-white'}`}
          >
            <BuildIcon sx={{ fontSize: 18 }} /> Hardware Tools
          </button>
        </div>

        {/* Tab Content: Dashboard */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="glass-card p-6 border-l-4 border-l-polar-white">
                <div className="flex items-center gap-3 mb-2">
                  <StorageIcon sx={{ color: '#F3F3F3' }} />
                  <h3 className="text-ash-gray font-bold uppercase text-xs">Total Barang</h3>
                </div>
                <p className="text-4xl font-bold text-polar-white">{Object.keys(inventory).length}</p>
              </div>
              
              <div className="glass-card p-6 border-l-4 border-l-amber-glow">
                <div className="flex items-center gap-3 mb-2">
                  <AssignmentReturnIcon sx={{ color: '#E7C59A' }} />
                  <h3 className="text-ash-gray font-bold uppercase text-xs">Sedang Dipinjam</h3>
                </div>
                <p className="text-4xl font-bold text-polar-white">
                  {Object.values(inventory).filter(i => i.status !== 'tersedia').length}
                </p>
              </div>

              <div className="glass-card p-6 border-l-4 border-l-neon-green">
                <div className="flex items-center gap-3 mb-2">
                  <GroupIcon sx={{ color: '#00AC5C' }} />
                  <h3 className="text-ash-gray font-bold uppercase text-xs">Pengguna (Fingerprint)</h3>
                </div>
                <p className="text-4xl font-bold text-polar-white">{users.length}</p>
              </div>

              <div className="glass-card p-6 border-l-4 border-l-red-500">
                <div className="flex items-center gap-3 mb-2">
                  <WarningIcon sx={{ color: '#EF4444' }} />
                  <h3 className="text-ash-gray font-bold uppercase text-xs">Kasus Overdue</h3>
                </div>
                <p className="text-4xl font-bold text-red-500">
                  {loans.filter(l => l.status === 'active' && l.expected_return_time && new Date() > new Date(l.expected_return_time)).length}
                </p>
              </div>
            </div>

            {/* Main Dashboard Layout: Chart & Timeline */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column: Line Chart */}
              <div className="lg:col-span-2 glass-card p-6 border border-dark-carbon">
                <h3 className="text-xl font-bold text-polar-white mb-6 flex items-center gap-2">
                  <HistoryIcon sx={{ color: '#E7C59A' }} /> Tren Peminjaman (7 Hari)
                </h3>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#252525" vertical={false} />
                      <XAxis 
                        dataKey="date" 
                        stroke="#8E8E93" 
                        tick={{ fill: '#8E8E93', fontSize: 12 }} 
                        axisLine={false} 
                        tickLine={false} 
                      />
                      <YAxis 
                        allowDecimals={false} 
                        stroke="#8E8E93" 
                        tick={{ fill: '#8E8E93', fontSize: 12 }} 
                        axisLine={false} 
                        tickLine={false} 
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#131313', border: '1px solid #252525', borderRadius: '8px' }}
                        itemStyle={{ color: '#E7C59A' }}
                        labelStyle={{ color: '#F3F3F3', fontWeight: 'bold' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="count" 
                        name="Jumlah Pinjam"
                        stroke="#E7C59A" 
                        strokeWidth={3} 
                        activeDot={{ r: 6, fill: '#E7C59A', stroke: '#131313', strokeWidth: 2 }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Right Column: Live Activity Feed */}
              <div className="glass-card p-6 border border-dark-carbon flex flex-col h-full max-h-[400px]">
                <h3 className="text-xl font-bold text-polar-white mb-4 flex items-center gap-2">
                  <ElectricBoltIcon sx={{ color: '#00AC5C' }} /> Aktivitas Terkini
                </h3>
                <div className="overflow-y-auto flex-1 pr-2 space-y-4 scrollbar-thin scrollbar-thumb-dark-carbon">
                  {timelineData.map((item) => (
                    <div key={item.id} className="relative flex gap-4 p-3 bg-deep-space/50 rounded-xl border border-dark-carbon/50 transition-colors hover:bg-dark-carbon/30">
                      <div className="shrink-0 mt-1">
                        {item.type === 'borrow' && <div className="w-8 h-8 rounded-full bg-amber-glow/20 text-amber-glow flex items-center justify-center"><ShoppingCartIcon sx={{ fontSize: 16 }}/></div>}
                        {item.type === 'return' && <div className="w-8 h-8 rounded-full bg-neon-green/20 text-neon-green flex items-center justify-center"><CheckCircleIcon sx={{ fontSize: 16 }}/></div>}
                        {item.type === 'access_open' && <div className="w-8 h-8 rounded-full bg-polar-white/10 text-polar-white flex items-center justify-center"><LockOpenIcon sx={{ fontSize: 16 }}/></div>}
                        {item.type === 'access_close' && <div className="w-8 h-8 rounded-full bg-dark-carbon text-ash-gray flex items-center justify-center"><LockIcon sx={{ fontSize: 16 }}/></div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-0.5">
                          <p className="font-bold text-sm text-polar-white truncate pr-2">{item.user}</p>
                          <span className="text-[10px] text-ash-gray whitespace-nowrap">{item.time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-xs text-slate-ui line-clamp-2">{item.detail}</p>
                      </div>
                    </div>
                  ))}
                  {timelineData.length === 0 && (
                    <div className="text-center text-ash-gray text-sm py-8">Belum ada aktivitas</div>
                  )}
                </div>
              </div>
              
            </div>
          </div>
        )}

        {/* Tab Content: Inventory */}
        {activeTab === 'inventory' && (
          <div className="p-6 glass-card animate-fadeIn">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-polar-white">Master Data Barang</h2>
              <div className="badge badge-info">{Object.keys(inventory).length} Item Terdaftar</div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-xs tracking-wider text-ash-gray uppercase bg-deep-space/50">
                    <th className="p-4 font-medium rounded-tl-lg">Nama Barang</th>
                    <th className="p-4 font-medium">Tag ID / Barcode</th>
                    <th className="p-4 font-medium">Tipe Sensor</th>
                    <th className="p-4 font-medium">Loker</th>
                    <th className="p-4 font-medium">Status</th>
                    <th className="p-4 font-medium">Peminjam Saat Ini</th>
                    <th className="p-4 font-medium rounded-tr-lg text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-carbon">
                  {Object.values(inventory).map((item, i) => (
                    <tr key={i} className="transition-colors hover:bg-dark-carbon/30">
                      <td className="p-4 font-medium text-polar-white">{item.nama}</td>
                      <td className="p-4 font-mono text-sm text-ash-gray">{item.tag_id || item.barcode}</td>
                      <td className="p-4 text-sm text-ash-gray">{item.tipe}</td>
                      <td className="p-4"><span className="badge badge-info">{item.loker_assignment}</span></td>
                      <td className="p-4">
                        <span className={`badge ${item.status === 'tersedia' ? 'badge-success' : 'badge-danger'}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="p-4 text-slate-ui">{item.current_borrower || '-'}</td>
                      <td className="p-4 flex justify-center gap-2">
                        <button 
                          onClick={() => { setEditItem(item); setShowEditModal(true); }}
                          className="bg-dark-carbon p-2 rounded hover:bg-slate-ui/20 transition-colors text-polar-white"
                          title="Edit Barang"
                        >
                          <EditIcon sx={{ fontSize: 16 }} />
                        </button>
                        <button 
                          onClick={() => handleDeleteBarang(item.tag_id, item.nama)}
                          className="bg-red-500/20 p-2 rounded hover:bg-red-500/40 transition-colors text-red-500"
                          title="Hapus Barang"
                        >
                          <DeleteIcon sx={{ fontSize: 16 }} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {Object.keys(inventory).length === 0 && (
                    <tr><td colSpan="7" className="p-8 text-center text-ash-gray">Belum ada barang terdaftar</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab Content: Add Item */}
        {activeTab === 'add_item' && (
          <div className="max-w-2xl p-6 mx-auto glass-card animate-fadeIn">
            <h2 className="mb-6 text-xl font-bold text-polar-white">Tambah Barang Baru</h2>
            
            <form onSubmit={handleAddBarang} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block mb-1 text-xs font-semibold text-ash-gray uppercase">Nama Barang</label>
                  <input required type="text" value={newItem.nama} onChange={e => setNewItem({...newItem, nama: e.target.value})} className="input-field" placeholder="Contoh: Tang Potong" />
                </div>
                <div>
                  <label className="block mb-1 text-xs font-semibold text-ash-gray uppercase">Kategori</label>
                  <input required type="text" value={newItem.kategori} onChange={e => setNewItem({...newItem, kategori: e.target.value})} className="input-field" placeholder="Contoh: Perkakas" />
                </div>
              </div>

              <div>
                <label className="block mb-1 text-xs font-semibold text-ash-gray uppercase">Pilih Loker Penyimpanan</label>
                <select value={newItem.loker_assignment} onChange={e => {
                  const val = e.target.value;
                  setNewItem({...newItem, loker_assignment: val, tipe: val === 'loker_01' ? 'RFID_LF' : val === 'loker_02' ? 'RFID_HF' : 'BARCODE'});
                }} className="bg-deep-space border-dark-carbon cursor-pointer input-field">
                  <option value="loker_01">LOKER 1 (RFID LF / 125kHz)</option>
                  <option value="loker_02">LOKER 2 (RFID HF / 13.56MHz)</option>
                  <option value="loker_03">LOKER 3 (Barcode / Kamera)</option>
                </select>
              </div>

              <div>
                <label className="block mb-1 text-xs font-semibold text-ash-gray uppercase">Tag ID / Barcode</label>
                <div className="flex gap-2">
                  <input required type="text" value={newItem.tag_id} onChange={e => setNewItem({...newItem, tag_id: e.target.value})} className="flex-1 input-field" placeholder="UID Tag atau Barcode" />
                  <button type="button" onClick={() => setIsListeningLoker(true)} className={`px-4 rounded-lg font-bold transition-colors ${isListeningLoker ? 'bg-amber-glow text-midnight-void animate-pulse' : 'btn-ghost'}`}>
                    {isListeningLoker ? 'Mendengarkan...' : 'Scan via Alat'}
                  </button>
                </div>
                <p className="mt-1 text-xs text-ash-gray">Ketik manual atau klik "Scan via Alat" lalu tempelkan tag ke alat fisik / simulator.</p>
              </div>

              <div className="pt-4 border-t border-dark-carbon">
                <button type="submit" className="w-full py-3 btn-primary">Simpan Barang Baru</button>
              </div>
            </form>
          </div>
        )}

        {/* Tab Content: Users */}
        {activeTab === 'users' && (
          <div className="p-6 glass-card animate-fadeIn">
            <h2 className="mb-6 text-xl font-bold text-polar-white">Pengguna Terdaftar (Fingerprint)</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {users.map((user, i) => (
                <div 
                  key={i} 
                  onClick={() => { setSelectedUser(user); setShowUserModal(true); }}
                  className="flex items-center gap-4 p-4 border border-dark-carbon bg-deep-space/50 rounded-xl cursor-pointer hover:border-amber-glow transition-all hover:bg-amber-glow/5"
                >
                  <div className="flex items-center justify-center w-12 h-12 text-xl font-bold text-polar-white border rounded-full bg-amber-glow/15 border-amber-glow/30 shrink-0">
                    {user.name.charAt(0)}
                  </div>
                  <div className="overflow-hidden">
                    <h3 className="font-bold text-polar-white truncate">{user.name}</h3>
                    <p className="mb-1 text-xs text-ash-gray">NIM: {user.nim}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-dark-carbon text-polar-white px-2 py-0.5 rounded font-mono">ID #{user.finger_id}</span>
                      {user.active && <span className="w-2 h-2 bg-neon-green rounded-full"></span>}
                    </div>
                  </div>
                </div>
              ))}
              {users.length === 0 && (
                <div className="py-8 text-center text-ash-gray col-span-full">Belum ada pengguna</div>
              )}
            </div>
          </div>
        )}

        {/* Tab Content: Active Loans */}
        {activeTab === 'active_loans' && (
          <div className="p-6 glass-card animate-fadeIn">
            <h2 className="mb-6 text-xl font-bold text-polar-white">Daftar Peminjaman Aktif</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-xs tracking-wider text-ash-gray uppercase bg-deep-space/50">
                    <th className="p-4 font-medium rounded-tl-lg">Peminjam</th>
                    <th className="p-4 font-medium">Barang</th>
                    <th className="p-4 font-medium">Waktu Pinjam & Batas</th>
                    <th className="p-4 font-medium text-center rounded-tr-lg">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-carbon">
                  {loans.filter(l => l.status === 'active').map((loan, i) => {
                    const isOverdue = loan.expected_return_time && new Date() > new Date(loan.expected_return_time);
                    return (
                    <tr key={i} className={`transition-colors hover:bg-dark-carbon/30 ${isOverdue ? 'bg-red-500/5' : ''}`}>
                      <td className="p-4 font-medium text-polar-white flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <CheckCircleIcon sx={{ fontSize: 16, color: '#00AC5C' }} /> {loan.user_name}
                        </div>
                        {isOverdue && (
                          <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded font-bold w-fit animate-pulse flex items-center gap-1">
                            <WarningIcon sx={{ fontSize: 12 }} /> OVERDUE
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-slate-ui">
                        <p className="font-bold text-polar-white">{loan.item_name}</p>
                        <p className="text-[10px] font-mono text-ash-gray">{loan.item_id}</p>
                      </td>
                      <td className="p-4">
                        <p className="font-mono text-xs text-ash-gray mb-1">Pinjam: {new Date(loan.timestamp_pinjam).toLocaleTimeString('id-ID')}</p>
                        {loan.expected_return_time && (
                          <p className={`font-mono text-xs ${isOverdue ? 'text-red-500 font-bold' : 'text-polar-white'}`}>
                            Batas: {new Date(loan.expected_return_time).toLocaleTimeString('id-ID')} ({loan.duration_minutes} Mnt)
                          </p>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <button 
                          onClick={() => handleForceReturn(loan)}
                          className="px-3 py-1 bg-red-500/20 text-red-500 rounded text-xs font-bold hover:bg-red-500/40 transition-colors"
                        >
                          FORCE RETURN
                        </button>
                      </td>
                    </tr>
                  )})}
                  {loans.filter(l => l.status === 'active').length === 0 && (
                    <tr><td colSpan="4" className="p-8 text-center text-ash-gray">Tidak ada peminjaman aktif saat ini</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab Content: Access Logs */}
        {activeTab === 'logs_access' && (
          <div className="p-6 glass-card animate-fadeIn">
            <h2 className="mb-6 text-xl font-bold text-polar-white">Log Akses Loker (Hardware)</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-xs tracking-wider text-ash-gray uppercase bg-deep-space/50">
                    <th className="p-4 font-medium">Waktu</th>
                    <th className="p-4 font-medium">User</th>
                    <th className="p-4 font-medium">Aksi</th>
                    <th className="p-4 font-medium">Loker</th>
                    <th className="p-4 font-medium">Barang/Tag</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-carbon">
                  {accessLogs.slice(0, 50).map((log, i) => (
                    <tr key={i} className="transition-colors hover:bg-dark-carbon/30">
                      <td className="p-4 font-mono text-sm text-ash-gray whitespace-nowrap">{log.timestamp}</td>
                      <td className="p-4 text-polar-white">{log.user || 'Sistem'}</td>
                      <td className="p-4">
                        <span className={`text-xs font-bold px-2 py-1 rounded ${log.action === 'OPEN' ? 'bg-dark-carbon text-polar-white' : 'bg-dark-carbon text-slate-ui'}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="p-4 text-slate-ui">{log.loker}</td>
                      <td className="p-4 text-ash-gray text-sm truncate max-w-[200px]">{log.item || log.uid || log.reason || '-'}</td>
                    </tr>
                  ))}
                  {accessLogs.length === 0 && (
                    <tr><td colSpan="5" className="p-8 text-center text-ash-gray">Belum ada log akses</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-xs text-center text-ash-gray">Menampilkan 50 log terakhir</p>
          </div>
        )}

        {/* Tab Content: Auth Logs */}
        {activeTab === 'logs_auth' && (
          <div className="p-6 glass-card animate-fadeIn">
            <h2 className="mb-6 text-xl font-bold text-polar-white">Log Autentikasi Sidik Jari</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-xs tracking-wider text-ash-gray uppercase bg-deep-space/50">
                    <th className="p-4 font-medium">Waktu</th>
                    <th className="p-4 font-medium">Pengguna</th>
                    <th className="p-4 font-medium">Finger ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-carbon">
                  {authLogs.slice(0, 50).map((log, i) => (
                    <tr key={i} className="transition-colors hover:bg-dark-carbon/30">
                      <td className="p-4 font-mono text-sm text-ash-gray">{log.timestamp}</td>
                      <td className="flex items-center gap-1 p-4 font-medium text-neon-green"><CheckCircleIcon sx={{ fontSize: 16, color: '#00AC5C' }} /> {log.user}</td>
                      <td className="p-4 font-mono text-slate-ui">#{log.finger_id}</td>
                    </tr>
                  ))}
                  {authLogs.length === 0 && (
                    <tr><td colSpan="3" className="p-8 text-center text-ash-gray">Belum ada log autentikasi</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-xs text-center text-ash-gray">Menampilkan 50 log terakhir</p>
          </div>
        )}

        {/* Tab Content: Tools */}
        {activeTab === 'tools' && (
          <div className="p-6 glass-card animate-fadeIn">
            <h2 className="mb-6 text-xl font-bold text-polar-white">Hardware Diagnostic Tools</h2>
            
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="p-5 text-center transition-colors border bg-deep-space/50 rounded-xl border-dark-carbon hover:border-amber-glow/40">
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 text-polar-white bg-amber-glow/15 rounded-xl">
                  <InboxIcon sx={{ fontSize: 28 }} />
                </div>
                <h3 className="mb-1 font-bold text-polar-white">Loker 1</h3>
                <p className="mb-4 font-mono text-xs text-polar-white">Node 1 (RFID LF)</p>
                <button onClick={() => handleOpenLockerTest('loker_01')} className="w-full text-sm btn-primary">Force Open</button>
              </div>
              
              <div className="p-5 text-center transition-colors border bg-deep-space/50 rounded-xl border-dark-carbon hover:border-amber-glow/40">
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 text-polar-white bg-amber-glow/15 rounded-xl">
                  <BuildIcon sx={{ fontSize: 28 }} />
                </div>
                <h3 className="mb-1 font-bold text-polar-white">Loker 2</h3>
                <p className="mb-4 font-mono text-xs text-polar-white">Node 2 (RFID HF)</p>
                <button onClick={() => handleOpenLockerTest('loker_02')} className="w-full text-sm btn-primary">Force Open</button>
              </div>

              <div className="p-5 text-center transition-colors border bg-deep-space/50 rounded-xl border-dark-carbon hover:border-amber-glow/40">
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 text-polar-white bg-amber-glow/15 rounded-xl">
                  <LabelIcon sx={{ fontSize: 28 }} />
                </div>
                <h3 className="mb-1 font-bold text-polar-white">Loker 3</h3>
                <p className="mb-4 font-mono text-xs text-polar-white">Node 3 (Barcode)</p>
                <button onClick={() => handleOpenLockerTest('loker_03')} className="w-full text-sm btn-primary">Force Open</button>
              </div>
            </div>
            
            <div className="p-4 mt-8 text-sm text-slate-ui border bg-amber-glow/10 border-amber-glow/30 rounded-xl">
              <p><strong>Info:</strong> Fitur Force Open digunakan untuk troubleshooting jika solenoid loker bermasalah atau barang tersangkut. Loker akan terbuka selama durasi default firmware lalu terkunci kembali otomatis.</p>
            </div>
          </div>
        )}

      </div>

      {/* User Detail Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-midnight-void/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-3xl glass-card border border-amber-glow/30 shadow-[0_0_30px_rgba(231,197,154,0.15)] flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-dark-carbon shrink-0 bg-deep-space/80 rounded-t-2xl">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-amber-glow/20 border border-amber-glow/50 rounded-full flex items-center justify-center text-amber-glow text-2xl font-bold">
                  {selectedUser.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-polar-white">{selectedUser.name}</h2>
                  <div className="flex gap-3 text-sm text-ash-gray mt-1">
                    <span>NIM: <span className="text-polar-white">{selectedUser.nim}</span></span>
                    <span>ID: <span className="text-polar-white font-mono">#{selectedUser.finger_id}</span></span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleDeleteUser(selectedUser)}
                  className="h-10 px-4 flex items-center justify-center rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white font-bold text-sm transition-colors gap-2"
                  title="Hapus Pengguna"
                >
                  <DeleteIcon sx={{ fontSize: 16 }} /> <span className="hidden sm:inline">Hapus</span>
                </button>
                <button 
                  onClick={() => setShowUserModal(false)}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-dark-carbon/50 text-ash-gray hover:bg-red-500/20 hover:text-red-500 transition-colors"
                >
                  <CloseIcon />
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 p-6 bg-deep-space/30 shrink-0">
              <div className="glass-card p-4 text-center border border-dark-carbon">
                <p className="text-xs text-ash-gray uppercase font-bold mb-1">Total Peminjaman</p>
                <p className="text-3xl font-bold text-polar-white">{loans.filter(l => l.user_name === selectedUser.name).length}</p>
              </div>
              <div className="glass-card p-4 text-center border border-dark-carbon">
                <p className="text-xs text-ash-gray uppercase font-bold mb-1">Sedang Dipinjam</p>
                <p className="text-3xl font-bold text-amber-glow">{loans.filter(l => l.user_name === selectedUser.name && l.status === 'active').length}</p>
              </div>
            </div>

            {/* History Table */}
            <div className="p-6 overflow-y-auto flex-1">
              <h3 className="font-bold text-polar-white mb-4 flex items-center gap-2">Riwayat Transaksi</h3>
              <div className="overflow-x-auto border border-dark-carbon rounded-xl">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-deep-space/80 sticky top-0">
                    <tr className="text-xs text-ash-gray uppercase">
                      <th className="p-3 font-medium">Barang</th>
                      <th className="p-3 font-medium">Waktu Pinjam</th>
                      <th className="p-3 font-medium">Waktu Kembali</th>
                      <th className="p-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-carbon">
                    {loans.filter(l => l.user_name === selectedUser.name).reverse().map((loan, idx) => (
                      <tr key={idx} className="hover:bg-dark-carbon/30 transition-colors">
                        <td className="p-3">
                          <p className="font-bold text-polar-white text-sm">{loan.item_name}</p>
                          <p className="text-[10px] font-mono text-ash-gray">{loan.item_id}</p>
                        </td>
                        <td className="p-3 font-mono text-xs text-ash-gray">
                          {new Date(loan.timestamp_pinjam).toLocaleString('id-ID')}
                        </td>
                        <td className="p-3 font-mono text-xs text-ash-gray">
                          {loan.timestamp_kembali ? new Date(loan.timestamp_kembali).toLocaleString('id-ID') : '-'}
                        </td>
                        <td className="p-3">
                          {loan.status === 'active' ? (
                            <span className="text-[10px] bg-amber-glow/20 text-amber-glow border border-amber-glow/30 px-2 py-1 rounded font-bold">DIPINJAM</span>
                          ) : (
                            <span className="text-[10px] bg-neon-green/20 text-neon-green border border-neon-green/30 px-2 py-1 rounded font-bold">KEMBALI</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {loans.filter(l => l.user_name === selectedUser.name).length === 0 && (
                      <tr><td colSpan="4" className="p-6 text-center text-ash-gray text-sm">Belum ada riwayat peminjaman</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-midnight-void/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg glass-card border border-dark-carbon p-6 shadow-2xl animate-fadeInUp">
            <div className="flex justify-between items-center mb-6 border-b border-dark-carbon pb-4">
              <h2 className="text-xl font-bold text-polar-white flex items-center gap-2">
                <EditIcon sx={{ fontSize: 24 }} /> Edit Barang
              </h2>
              <button 
                onClick={() => { setShowEditModal(false); setEditItem(null); }}
                className="text-ash-gray hover:text-polar-white bg-dark-carbon p-1 rounded-lg transition-colors"
              >
                <CloseIcon sx={{ fontSize: 20 }} />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block mb-1 text-xs font-semibold text-ash-gray uppercase">Nama Barang</label>
                  <input required type="text" value={editItem.nama} onChange={e => setEditItem({...editItem, nama: e.target.value})} className="input-field" />
                </div>
                <div>
                  <label className="block mb-1 text-xs font-semibold text-ash-gray uppercase">Kategori</label>
                  <input required type="text" value={editItem.kategori} onChange={e => setEditItem({...editItem, kategori: e.target.value})} className="input-field" />
                </div>
              </div>

              <div>
                <label className="block mb-1 text-xs font-semibold text-ash-gray uppercase">Loker Penyimpanan</label>
                <select value={editItem.loker_assignment} onChange={e => {
                  const val = e.target.value;
                  setEditItem({...editItem, loker_assignment: val, tipe: val === 'loker_01' ? 'RFID_LF' : val === 'loker_02' ? 'RFID_HF' : 'BARCODE'});
                }} className="bg-deep-space border-dark-carbon cursor-pointer input-field">
                  <option value="loker_01">LOKER 1 (RFID LF)</option>
                  <option value="loker_02">LOKER 2 (RFID HF)</option>
                  <option value="loker_03">LOKER 3 (Barcode)</option>
                </select>
              </div>

              <div>
                <label className="block mb-1 text-xs font-semibold text-ash-gray uppercase">Tag ID / Barcode (ReadOnly)</label>
                <input type="text" value={editItem.tag_id} readOnly className="w-full bg-dark-carbon border border-dark-carbon rounded-lg p-2 text-ash-gray font-mono cursor-not-allowed" />
              </div>

              <div className="pt-4 border-t border-dark-carbon flex justify-end gap-3">
                <button type="button" onClick={() => { setShowEditModal(false); setEditItem(null); }} className="btn-ghost py-2 px-4">Batal</button>
                <button type="submit" className="btn-primary py-2 px-6">Simpan Perubahan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
