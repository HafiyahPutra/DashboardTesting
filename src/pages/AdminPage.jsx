import { useState, useEffect } from 'react';
import { listenMasterBarang, listenAccessLog, listenAuthLog, listenAllUsers, openLocker, closeLocker, registerBarang, listenLockerFull, deleteBarang, updateBarang, listenLoanRecords, updateLoanReturn, updateBarangBorrower, deleteUser, updateUser, db } from '../services/firebase';
import { ref, update, onValue } from 'firebase/database';
import { useNavigate } from 'react-router-dom';
import SecurityRoundedIcon from '@mui/icons-material/SecurityRounded';
import StorageRoundedIcon from '@mui/icons-material/StorageRounded';
import AddBoxRoundedIcon from '@mui/icons-material/AddBoxRounded';
import GroupRoundedIcon from '@mui/icons-material/GroupRounded';
import AssignmentRoundedIcon from '@mui/icons-material/AssignmentRounded';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import BuildRoundedIcon from '@mui/icons-material/BuildRounded';
import ElectricBoltRoundedIcon from '@mui/icons-material/ElectricBoltRounded';
import InboxRoundedIcon from '@mui/icons-material/InboxRounded';
import LabelRoundedIcon from '@mui/icons-material/LabelRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import AssignmentReturnRoundedIcon from '@mui/icons-material/AssignmentReturnRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import WarningRoundedIcon from '@mui/icons-material/WarningRounded';
import LockOpenRoundedIcon from '@mui/icons-material/LockOpenRounded';
import ShoppingCartRoundedIcon from '@mui/icons-material/ShoppingCartRounded';
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded';
import LocalOfferRoundedIcon from '@mui/icons-material/LocalOfferRounded';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import HelpOutlineRoundedIcon from '@mui/icons-material/HelpOutlineRounded';
import MonitorHeartRoundedIcon from '@mui/icons-material/MonitorHeartRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import MoreHorizRoundedIcon from '@mui/icons-material/MoreHorizRounded';
import ComputerRoundedIcon from '@mui/icons-material/ComputerRounded';
import RouterRoundedIcon from '@mui/icons-material/RouterRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import QrCodeScannerRoundedIcon from '@mui/icons-material/QrCodeScannerRounded';
import TimerRoundedIcon from '@mui/icons-material/TimerRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import InventoryRoundedIcon from '@mui/icons-material/InventoryRounded';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import TodayRoundedIcon from '@mui/icons-material/TodayRounded';
import SearchOffRoundedIcon from '@mui/icons-material/SearchOffRounded';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts';

const LOKER_IDS = ['loker_01', 'loker_02', 'loker_03'];
export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
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

  // Inventory Filter state
  const [searchItemTerm, setSearchItemTerm] = useState('');
  const [filterItemStatus, setFilterItemStatus] = useState('All Status');
  const [filterItemLoker, setFilterItemLoker] = useState('All Loker');
  
  // User Filter state
  const [searchUserTerm, setSearchUserTerm] = useState('');
  
  // Chart state
  const [chartRange, setChartRange] = useState(7);
  
  // User Modal state
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [editUserItem, setEditUserItem] = useState(null);
  const [showDiagnosticModal, setShowDiagnosticModal] = useState(false);
  
  const [isListeningLoker, setIsListeningLoker] = useState(false);
  const [isLockerOpenForNewItem, setIsLockerOpenForNewItem] = useState(false);
  const [lockerStatuses, setLockerStatuses] = useState({});
  const [autoRespondEnabled, setAutoRespondEnabled] = useState(true);

  // Riwayat Peminjaman Filter state
  const [searchLoanTerm, setSearchLoanTerm] = useState('');
  const [filterLoanStatus, setFilterLoanStatus] = useState('Semua');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  // UX States
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [confirmDialog, setConfirmDialog] = useState({ show: false, title: '', message: '', onConfirm: null });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const showConfirm = (title, message, onConfirm) => {
    setConfirmDialog({ show: true, title, message, onConfirm });
  };

  // Pagination States
  const [inventoryPage, setInventoryPage] = useState(1);
  const [loansPage, setLoansPage] = useState(1);
  const itemsPerPage = 8;

  // CSV Export Helper
  const exportToCSV = (data, headers, filename) => {
    const csvRows = [];
    csvRows.push(headers.join(','));
    data.forEach(row => {
      const values = headers.map(h => {
        const val = row[h] ?? '';
        return `"${String(val).replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(','));
    });
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Listen to ALL Lockers — auto-respond to commands
  useEffect(() => {
    if (!isLoggedIn) return;
    const unsubs = LOKER_IDS.map((lokerId) => {
      return onValue(ref(db, `/lockers/${lokerId}`), async (snap) => {
        const data = snap.val();
        if (!data) return;

        setLockerStatuses((prev) => ({ ...prev, [lokerId]: data }));

        if (autoRespondEnabled) {
          if (data.command === 'OPEN' && data.status !== 'UNLOCKED') {
            await update(ref(db, `/lockers/${lokerId}`), {
              status: 'UNLOCKED',
              updated_at: new Date().toISOString(),
            });
          } else if (data.command === 'CLOSE' && data.status !== 'LOCKED') {
            await update(ref(db, `/lockers/${lokerId}`), {
              status: 'LOCKED',
              updated_at: new Date().toISOString(),
            });
          }
        }
      });
    });

    return () => unsubs.forEach((unsub) => unsub());
  }, [isLoggedIn, autoRespondEnabled]);

  useEffect(() => {
    let unsub = null;
    if (isListeningLoker) {
      unsub = listenLockerFull(newItem.loker_assignment, (data) => {
        if (data && data.last_uid && data.last_uid !== newItem.tag_id) {
          setNewItem(prev => ({ ...prev, tag_id: data.last_uid }));
          setIsListeningLoker(false);
          showToast(`Berhasil! Tag/Barcode terdeteksi: ${data.last_uid}`, 'success');
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
      showToast('Barang berhasil ditambahkan!', 'success');
      setNewItem({ nama: '', kategori: '', loker_assignment: 'loker_01', tag_id: '', tipe: 'RFID_LF' });
      setActiveTab('inventory');
    } catch (err) {
      showToast('Gagal menyimpan: ' + err.message, 'error');
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
    showConfirm('Hapus Barang', `Apakah Anda yakin ingin menghapus barang "${nama}"? (Riwayat peminjaman tetap akan tersimpan)`, async () => {
      try {
        await deleteBarang(tagId);
        showToast('Barang berhasil dihapus!', 'success');
      } catch (err) {
        showToast('Gagal menghapus: ' + err.message, 'error');
      }
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const dataToUpdate = { ...editItem };
      if (dataToUpdate.tipe === 'BARCODE') {
        dataToUpdate.barcode = dataToUpdate.tag_id;
      }
      await updateBarang(dataToUpdate.tag_id, dataToUpdate);
      showToast('Perubahan berhasil disimpan!', 'success');
      setShowEditModal(false);
      setEditItem(null);
    } catch (err) {
      showToast('Gagal menyimpan perubahan: ' + err.message, 'error');
    }
  };

  const handleForceReturn = async (loan) => {
    showConfirm('Force Return', `Peringatan: Force Return akan menandai barang ini telah dikembalikan oleh ${loan.user_name}. Lanjutkan?`, async () => {
      try {
        await updateLoanReturn(loan.id, {
          timestamp_kembali: new Date().toISOString(),
          status: 'returned',
          keterangan: 'Force Return by Admin'
        });
        await updateBarangBorrower(loan.item_id, "", "tersedia");
        showToast('Barang berhasil dikembalikan secara paksa!', 'success');
      } catch (err) {
        showToast('Gagal melakukan Force Return: ' + err.message, 'error');
      }
    });
  };

  const handleDeleteUser = async (user) => {
    showConfirm('Hapus Pengguna', `PERINGATAN: Apakah Anda yakin ingin menghapus data pengguna "${user.name}" (ID #${user.finger_id})?\n\nMenekan OK akan menghapus profil ini dari Firebase dan mencabut sidik jarinya dari sensor fisik secara permanen.`, async () => {
      try {
        await deleteUser(user.finger_id);
        showToast(`Pengguna ${user.name} berhasil dihapus dari sistem!`, 'success');
        setShowUserModal(false);
        setSelectedUser(null);
      } catch (err) {
        showToast('Gagal menghapus pengguna: ' + err.message, 'error');
      }
    });
  };

  const handleEditUserSubmit = async (e) => {
    e.preventDefault();
    try {
      const dataToUpdate = { ...editUserItem };
      await updateUser(dataToUpdate.finger_id, dataToUpdate);
      showToast('Profil pengguna berhasil diperbarui!', 'success');
      setShowEditUserModal(false);
      setEditUserItem(null);
      
      // Update selectedUser so the modal immediately reflects changes if open
      if (selectedUser && selectedUser.finger_id === dataToUpdate.finger_id) {
        setSelectedUser(dataToUpdate);
      }
    } catch (err) {
      showToast('Gagal memperbarui profil: ' + err.message, 'error');
    }
  };

  const getTabName = (tabId) => {
    switch(tabId) {
      case 'dashboard': return 'Dashboard';
      case 'inventory': return 'Master Barang';
      case 'add_item': return 'Tambah Barang';
      case 'users': return 'Data Pengguna';
      case 'active_loans': return 'Peminjaman Aktif';
      case 'loan_history': return 'Riwayat Peminjaman';
      case 'logs_access': return 'Log Akses Loker';
      case 'logs_auth': return 'Log Autentikasi';
      case 'tools': return 'Hardware Tools';
      default: return 'Dashboard';
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === 'admin123') {
      setIsLoggedIn(true);
    } else {
      showToast('Password salah!', 'error');
    }
  };

  const forceLockerState = async (lokerId, command) => {
    const status = command === 'OPEN' ? 'UNLOCKED' : 'LOCKED';
    await update(ref(db, `/lockers/${lokerId}`), {
      command,
      status,
      updated_at: new Date().toISOString(),
    });
  };

  // -----------------------------------------------------
  // Data Processing for Dashboard Analytics
  // -----------------------------------------------------
  
  // 1. Line Chart Data (Dynamic Range)
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
    
    // Fill the array based on chartRange
    const result = [];
    const today = new Date();
    for (let i = chartRange - 1; i >= 0; i--) {
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

  // 3. Category Distribution (Donut Chart)
  const getCategoryData = () => {
    const categories = {};
    Object.values(inventory).forEach(item => {
      const cat = item.kategori || 'Lainnya';
      categories[cat] = (categories[cat] || 0) + 1;
    });
    return Object.entries(categories).map(([name, value]) => ({ name, value }));
  };
  const categoryData = getCategoryData();
  const CATEGORY_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

  // 4. Items per Loker (Bar Chart)
  const getLokerChartData = () => {
    const lokerData = {};
    LOKER_IDS.forEach(id => { lokerData[id] = { tersedia: 0, dipinjam: 0 }; });
    Object.values(inventory).forEach(item => {
      const loker = item.loker_assignment || item.loker;
      if (lokerData[loker]) {
        if (item.status === 'tersedia') lokerData[loker].tersedia++;
        else lokerData[loker].dipinjam++;
      }
    });
    return LOKER_IDS.map(id => ({
      name: id.replace('loker_0', 'Loker '),
      tersedia: lokerData[id].tersedia,
      dipinjam: lokerData[id].dipinjam,
    }));
  };
  const lokerBarData = getLokerChartData();

  // 5. Top Borrowers Leaderboard (hanya pengguna yang masih terdaftar)
  const getTopBorrowers = () => {
    const activeUserNames = new Set(users.map(u => u.name));
    const counts = {};
    loans.forEach(l => {
      if (l.user_name && activeUserNames.has(l.user_name))
        counts[l.user_name] = (counts[l.user_name] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  };
  const topBorrowers = getTopBorrowers();

  // 6. Overdue Items for Alert Banner
  const overdueItems = loans.filter(l => l.status === 'active' && l.expected_return_time && new Date() > new Date(l.expected_return_time));

  // 7. Transaksi Hari Ini
  const todayStr = new Date().toDateString();
  const todayTransactions = loans.filter(l => {
    const pinjam = new Date(l.timestamp_pinjam).toDateString() === todayStr;
    const kembali = l.timestamp_kembali && new Date(l.timestamp_kembali).toDateString() === todayStr;
    return pinjam || kembali;
  }).length;
  // -----------------------------------------------------

  if (!isLoggedIn) {
    return (
      <div className="relative flex items-center justify-center min-h-screen p-6 bg-midnight-void">
        <div className="relative z-10 w-full max-w-sm p-8 glass-card animate-fadeInUp">
          <div className="mb-6 text-center">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-2 rounded-full bg-dark-carbon">
              <SecurityRoundedIcon sx={{ fontSize: 32, color: 'inherit' }} />
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
    <>
      {/* Toast Notification */}
      <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] transition-all duration-300 ${toast.show ? 'translate-y-0 opacity-100' : '-translate-y-12 opacity-0 pointer-events-none'}`}>
        <div className={`flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl border backdrop-blur-md font-medium text-[14px] ${
          toast.type === 'error' ? 'bg-red-500/90 border-red-400 text-white' : 'bg-emerald-500/90 border-emerald-400 text-white'
        }`}>
          {toast.type === 'error' ? <WarningRoundedIcon fontSize="small" /> : <CheckCircleRoundedIcon fontSize="small" />}
          {toast.message}
        </div>
      </div>

      {/* Custom Confirm Modal */}
      {confirmDialog.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-midnight-void/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm glass-card border border-dark-carbon p-6 shadow-2xl animate-fadeInUp">
            <h3 className="text-lg font-bold text-polar-white mb-2">{confirmDialog.title}</h3>
            <p className="text-sm text-ash-gray mb-6 leading-relaxed whitespace-pre-wrap">{confirmDialog.message}</p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setConfirmDialog({ show: false, title: '', message: '', onConfirm: null })} 
                className="px-4 py-2 text-sm font-bold text-ash-gray hover:text-polar-white bg-dark-carbon/50 hover:bg-dark-carbon rounded-xl transition-colors"
              >
                Batal
              </button>
              <button 
                onClick={() => {
                  if (confirmDialog.onConfirm) confirmDialog.onConfirm();
                  setConfirmDialog({ show: false, title: '', message: '', onConfirm: null });
                }} 
                className="px-4 py-2 text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors shadow-[0_0_15px_rgba(239,68,68,0.3)]"
              >
                Ya, Lanjutkan
              </button>
            </div>
          </div>
        </div>
      )}

    <div className="admin-layout">
      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-brand">
          {!sidebarCollapsed && <span className="font-bold tracking-widest text-[14px] leading-tight">INVENTORY<br/>LOCKER</span>}
        </div>

        <div className="sidebar-menu">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`sidebar-menu-item ${activeTab === 'dashboard' ? 'active' : ''}`}
          >
            <DashboardRoundedIcon sx={{ fontSize: 20 }} />
            {!sidebarCollapsed && <span>Dashboard</span>}
          </button>
          <button 
            onClick={() => setActiveTab('inventory')}
            className={`sidebar-menu-item ${activeTab === 'inventory' ? 'active' : ''}`}
          >
            <StorageRoundedIcon sx={{ fontSize: 20 }} />
            {!sidebarCollapsed && <span>Master Barang</span>}
          </button>
          <button 
            onClick={() => setActiveTab('add_item')}
            className={`sidebar-menu-item ${activeTab === 'add_item' ? 'active' : ''}`}
          >
            <AddBoxRoundedIcon sx={{ fontSize: 20 }} />
            {!sidebarCollapsed && <span>Tambah Barang</span>}
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`sidebar-menu-item ${activeTab === 'users' ? 'active' : ''}`}
          >
            <GroupRoundedIcon sx={{ fontSize: 20 }} />
            {!sidebarCollapsed && <span>Data Pengguna</span>}
          </button>
          <button 
            onClick={() => setActiveTab('active_loans')}
            className={`sidebar-menu-item ${activeTab === 'active_loans' ? 'active' : ''}`}
          >
            <AssignmentReturnRoundedIcon sx={{ fontSize: 20 }} />
            {!sidebarCollapsed && <span>Peminjaman Aktif</span>}
          </button>
          <button 
            onClick={() => setActiveTab('loan_history')}
            className={`sidebar-menu-item ${activeTab === 'loan_history' ? 'active' : ''}`}
          >
            <HistoryRoundedIcon sx={{ fontSize: 20 }} />
            {!sidebarCollapsed && <span>Riwayat Peminjaman</span>}
          </button>
          <button 
            onClick={() => setActiveTab('logs_access')}
            className={`sidebar-menu-item ${activeTab === 'logs_access' ? 'active' : ''}`}
          >
            <AssignmentRoundedIcon sx={{ fontSize: 20 }} />
            {!sidebarCollapsed && <span>Log Akses Loker</span>}
          </button>
          <button 
            onClick={() => setActiveTab('logs_auth')}
            className={`sidebar-menu-item ${activeTab === 'logs_auth' ? 'active' : ''}`}
          >
            <LockRoundedIcon sx={{ fontSize: 20 }} />
            {!sidebarCollapsed && <span>Log Autentikasi</span>}
          </button>
          <button 
            onClick={() => setActiveTab('tools')}
            className={`sidebar-menu-item ${activeTab === 'tools' ? 'active' : ''}`}
          >
            <BuildRoundedIcon sx={{ fontSize: 20 }} />
            {!sidebarCollapsed && <span>Hardware Tools</span>}
          </button>
        </div>

        <div className="sidebar-bottom">
          <button className="sidebar-menu-item" onClick={() => setShowDiagnosticModal(true)}>
            <MonitorHeartRoundedIcon sx={{ fontSize: 20 }} />
            {!sidebarCollapsed && <span>Diagnostics</span>}
          </button>
          <button className="sidebar-menu-item" onClick={() => showToast('Silakan hubungi administrator sistem atau tim IT support untuk bantuan lebih lanjut.', 'success')}>
            <HelpOutlineRoundedIcon sx={{ fontSize: 20 }} />
            {!sidebarCollapsed && <span>Support</span>}
          </button>
        </div>

        <button 
          className="sidebar-toggle-btn"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {sidebarCollapsed ? <ChevronRightRoundedIcon fontSize="small" /> : <ChevronLeftRoundedIcon fontSize="small" />}
        </button>
      </aside>

      {/* Main Content Area */}
      <main className={`admin-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <header className="admin-header">
          <div>
            <h1 className="text-xl font-bold text-polar-white">
              Admin Dashboard
            </h1>
            <p className="mt-1 text-[13px] text-ash-gray">Sistem Inventaris IoT & Autentikasi Biometrik</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => window.open('/', '_blank')} className="btn-ghost">Ke Aplikasi User</button>
            <button onClick={() => window.open('/simulator', '_blank')} className="btn-ghost">Simulator</button>
            <button onClick={() => setIsLoggedIn(false)} className="btn-danger">Logout</button>
          </div>
        </header>

        <div className="admin-page-content mx-auto max-w-7xl">
        {/* Tab Content: Dashboard */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-fadeIn pb-8">
            {/* Overdue Alert Banner */}
            {overdueItems.length > 0 && (
              <div className="glass-card p-4 border border-red-500/30 bg-red-500/10 animate-fadeIn">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center shrink-0">
                    <WarningRoundedIcon sx={{ fontSize: 22, color: '#EF4444' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-red-400 text-[14px] mb-1">⚠️ {overdueItems.length} Barang Overdue!</h4>
                    <div className="space-y-0.5">
                      {overdueItems.slice(0, 3).map((item, idx) => (
                        <p key={idx} className="text-[12px] text-red-300/80 truncate">
                          <span className="font-bold text-red-300">{item.user_name}</span> — {item.item_name} (batas: {new Date(item.expected_return_time).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})})
                        </p>
                      ))}
                      {overdueItems.length > 3 && (
                        <p className="text-[11px] text-red-400/70">...dan {overdueItems.length - 3} lainnya</p>
                      )}
                    </div>
                  </div>
                  <button onClick={() => setActiveTab('active_loans')} className="text-[12px] font-bold text-red-400 bg-red-500/15 hover:bg-red-500/25 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap shrink-0 mt-1">
                    Lihat Detail →
                  </button>
                </div>
              </div>
            )}

            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="glass-card p-5 border-l-4 border-l-polar-white flex justify-between items-start">
                <div>
                  <h3 className="text-ash-gray font-bold uppercase text-xs mb-2">Total Barang</h3>
                  <p className="text-3xl font-bold text-polar-white">{Object.keys(inventory).length}</p>
                </div>
                <StorageRoundedIcon sx={{ fontSize: 20, color: 'var(--text-muted)' }} />
              </div>
              
              <div className="glass-card p-5 border-l-4 border-l-amber-glow flex justify-between items-start">
                <div>
                  <h3 className="text-ash-gray font-bold uppercase text-xs mb-2">Sedang Dipinjam</h3>
                  <p className="text-3xl font-bold text-polar-white">
                    {Object.values(inventory).filter(i => i.status !== 'tersedia').length}
                  </p>
                </div>
                <ShoppingCartRoundedIcon sx={{ fontSize: 20, color: 'var(--text-muted)' }} />
              </div>

              <div className="glass-card p-5 border-l-4 border-l-neon-green flex justify-between items-start">
                <div>
                  <h3 className="text-ash-gray font-bold uppercase text-xs mb-2">Pengguna</h3>
                  <p className="text-3xl font-bold text-polar-white">{users.length}</p>
                </div>
                <GroupRoundedIcon sx={{ fontSize: 20, color: 'var(--text-muted)' }} />
              </div>

              <div className="glass-card p-5 border-l-4 border-l-red-500 flex justify-between items-start">
                <div>
                  <h3 className="text-ash-gray font-bold uppercase text-xs mb-2">Kasus Overdue</h3>
                  <p className="text-3xl font-bold text-red-500">
                    {loans.filter(l => l.status === 'active' && l.expected_return_time && new Date() > new Date(l.expected_return_time)).length}
                  </p>
                </div>
                <WarningRoundedIcon sx={{ fontSize: 20, color: 'var(--text-muted)' }} />
              </div>

              <div className="glass-card p-5 border-l-4 border-l-blue-400 flex justify-between items-start">
                <div>
                  <h3 className="text-ash-gray font-bold uppercase text-xs mb-2">Transaksi Hari Ini</h3>
                  <p className="text-3xl font-bold text-polar-white">{todayTransactions}</p>
                </div>
                <TodayRoundedIcon sx={{ fontSize: 20, color: 'var(--text-muted)' }} />
              </div>
            </div>

            {/* Loker Status Mini Widgets */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {LOKER_IDS.map((lokerId) => {
                const data = lockerStatuses[lokerId];
                const isOpen = data?.status === 'UNLOCKED';
                const lokerLabel = lokerId === 'loker_01' ? 'RFID LF (125kHz)' : lokerId === 'loker_02' ? 'RFID HF (13.56MHz)' : 'Barcode / Kamera';
                const itemCount = Object.values(inventory).filter(i => (i.loker_assignment || i.loker) === lokerId).length;
                return (
                  <div key={lokerId} className={`glass-card p-4 border flex items-center gap-4 transition-all cursor-pointer hover:border-amber-glow/30 ${isOpen ? 'border-amber-glow/40 bg-amber-glow/5' : 'border-dark-carbon'}`} onClick={() => setActiveTab('tools')}>
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${isOpen ? 'bg-amber-glow/20 text-amber-glow' : 'bg-dark-carbon text-ash-gray'}`}>
                      {isOpen ? <LockOpenRoundedIcon sx={{ fontSize: 22 }} /> : <LockRoundedIcon sx={{ fontSize: 22 }} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold text-polar-white">{lokerId.replace('_', ' ').toUpperCase()}</p>
                      <p className="text-[11px] text-ash-gray mt-0.5">{lokerLabel} • {itemCount} item</p>
                    </div>
                    <div className="shrink-0">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider ${isOpen ? 'bg-amber-glow/20 text-amber-glow' : 'bg-neon-green/15 text-neon-green'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isOpen ? 'bg-amber-glow animate-pulse' : 'bg-neon-green'}`}></span>
                        {isOpen ? 'TERBUKA' : 'TERKUNCI'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Main Dashboard Layout: Stacked Full Width */}
            <div className="flex flex-col gap-6">
              
              {/* Full Width Line Chart */}
              <div className="glass-card p-6 border border-dark-carbon w-full flex flex-col">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-[14px] font-bold text-polar-white">
                    Tren Peminjaman ({chartRange} Hari)
                  </h3>
                  <select 
                    value={chartRange}
                    onChange={(e) => setChartRange(Number(e.target.value))}
                    className="bg-transparent text-ash-gray hover:text-polar-white text-sm focus:outline-none cursor-pointer font-medium"
                  >
                    <option value={7} className="bg-deep-space">7 Hari</option>
                    <option value={14} className="bg-deep-space">14 Hari</option>
                    <option value={30} className="bg-deep-space">30 Hari</option>
                  </select>
                </div>
                <div className="w-full h-75">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart key={`chart-${chartRange}-${loans.length}`} data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
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
                        contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #E2E8F0', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}
                        itemStyle={{ color: '#1E293B', fontWeight: 'bold' }}
                        labelStyle={{ color: '#64748B', fontWeight: 'normal', marginBottom: '4px' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="count" 
                        name="Jumlah Pinjam"
                        stroke="#1E293B" 
                        strokeWidth={4} 
                        dot={{ r: 5, fill: '#FFFFFF', stroke: '#1E293B', strokeWidth: 3 }}
                        activeDot={{ r: 7, fill: '#1E293B', stroke: '#FFFFFF', strokeWidth: 2 }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Charts: Kategori Distribution + Barang per Loker */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Donut Chart - Distribusi Kategori */}
                <div className="glass-card p-6 border border-dark-carbon">
                  <h3 className="text-[14px] font-bold text-polar-white mb-4">Distribusi Kategori Barang</h3>
                  {categoryData.length > 0 ? (
                    <div className="flex flex-col items-center">
                      <div className="w-full h-52">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={categoryData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value" stroke="none">
                              {categoryData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} itemStyle={{ color: '#e0e0e0' }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 mt-2">
                        {categoryData.map((entry, index) => (
                          <div key={entry.name} className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: CATEGORY_COLORS[index % CATEGORY_COLORS.length] }}></span>
                            <span className="text-[12px] text-ash-gray">{entry.name}</span>
                            <span className="text-[12px] font-bold text-polar-white">{entry.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-ash-gray text-sm py-12">Belum ada data barang</div>
                  )}
                </div>

                {/* Bar Chart - Barang per Loker */}
                <div className="glass-card p-6 border border-dark-carbon">
                  <h3 className="text-[14px] font-bold text-polar-white mb-4">Barang per Loker</h3>
                  <div className="w-full h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={lokerBarData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                        <XAxis dataKey="name" stroke="#8E8E93" tick={{ fill: '#8E8E93', fontSize: 12 }} axisLine={false} tickLine={false} />
                        <YAxis allowDecimals={false} stroke="#8E8E93" tick={{ fill: '#8E8E93', fontSize: 12 }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} itemStyle={{ color: '#e0e0e0' }} />
                        <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} formatter={(value) => <span style={{ color: '#8E8E93' }}>{value}</span>} />
                        <Bar dataKey="tersedia" name="Tersedia" fill="#10B981" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="dipinjam" name="Dipinjam" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Top Borrower + Activity Feed */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Borrower Leaderboard */}
                <div className="glass-card border border-dark-carbon w-full flex flex-col">
                  <div className="p-5 border-b border-dark-carbon/70">
                    <h3 className="text-[14px] font-bold text-polar-white flex items-center gap-2">🏆 Top Peminjam</h3>
                  </div>
                  <div className="flex flex-col px-5 py-2 flex-1">
                    {topBorrowers.length > 0 ? topBorrowers.map((borrower, idx) => (
                      <div key={borrower.name} className="flex items-center gap-4 py-4 border-b border-dark-carbon/50 last:border-0">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                          idx === 0 ? 'bg-amber-glow/20 text-amber-glow border border-amber-glow/30' :
                          idx === 1 ? 'bg-slate-300/20 text-slate-300 border border-slate-300/30' :
                          idx === 2 ? 'bg-orange-400/20 text-orange-400 border border-orange-400/30' :
                          'bg-dark-carbon text-ash-gray border border-dark-carbon'
                        }`}>
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-[14px] text-polar-white truncate">{borrower.name}</p>
                          <p className="text-[12px] text-ash-gray">{borrower.count} peminjaman</p>
                        </div>
                        <span className="text-[13px] font-bold text-polar-white bg-dark-carbon px-3 py-1 rounded-full shrink-0">{borrower.count}×</span>
                      </div>
                    )) : (
                      <div className="text-center text-ash-gray text-sm py-8 flex-1 flex items-center justify-center">Belum ada data peminjaman</div>
                    )}
                  </div>
                </div>

                {/* Live Activity Feed */}
              <div className="glass-card border border-dark-carbon w-full flex flex-col">
                <div className="p-5 border-b border-dark-carbon/70">
                  <h3 className="text-[14px] font-bold text-polar-white">Aktivitas Terkini</h3>
                </div>
                <div className="flex flex-col px-5 py-2">
                  {timelineData.slice(0, 5).map((item) => (
                    <div key={item.id} className="flex gap-4 py-4 border-b border-dark-carbon/50 last:border-0 items-center">
                      <div className="shrink-0 flex items-center justify-center">
                        {item.type === 'borrow' && <div className="w-11 h-11 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center"><ShoppingCartRoundedIcon sx={{ fontSize: 20 }}/></div>}
                        {item.type === 'return' && <div className="w-11 h-11 rounded-full bg-green-50 text-green-500 flex items-center justify-center"><CheckCircleRoundedIcon sx={{ fontSize: 20 }}/></div>}
                        {item.type === 'access_open' && <div className="w-11 h-11 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center"><LockOpenRoundedIcon sx={{ fontSize: 20 }}/></div>}
                        {item.type === 'access_close' && <div className="w-11 h-11 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center"><LockRoundedIcon sx={{ fontSize: 20 }}/></div>}
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <p className="font-medium text-[15px] text-polar-white truncate">{item.user}</p>
                        <p className="text-[13px] text-slate-ui truncate mt-0.5">{item.detail}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <span className="text-xs text-ash-gray whitespace-nowrap">{item.time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  ))}
                  {timelineData.length === 0 && (
                    <div className="text-center text-ash-gray text-sm py-8">Belum ada aktivitas</div>
                  )}
                </div>
                <div className="border-t border-dark-carbon/70 p-4 text-center">
                  <button 
                    onClick={() => setActiveTab('logs_access')}
                    className="text-[14px] font-semibold text-ash-gray hover:text-polar-white transition-colors"
                  >
                    Lihat Semua Aktivitas
                  </button>
                </div>
              </div>
              </div>
              
            </div>
          </div>
        )}

        {/* Tab Content: Inventory */}
        {activeTab === 'inventory' && (
          <div className="animate-fadeIn space-y-4 pb-8">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-2xl font-bold text-[#1E293B]">Master Data Barang</h2>
              <button onClick={() => {
                const data = Object.values(inventory).map(item => ({
                  Nama: item.nama, Tag_ID: item.tag_id || item.barcode, Tipe: item.tipe, Loker: item.loker_assignment, Status: item.status, Peminjam: item.current_borrower || '-', Kategori: item.kategori
                }));
                exportToCSV(data, ['Nama','Tag_ID','Tipe','Loker','Status','Peminjam','Kategori'], 'master_barang');
              }} className="flex items-center gap-2 px-4 py-2 bg-[#1E293B] text-white rounded-lg text-[13px] font-bold hover:bg-black transition-colors">
                <DownloadRoundedIcon sx={{ fontSize: 16 }} /> Export CSV
              </button>
            </div>
            
            {/* Filter & Search Bar */}
            <div className="bg-white rounded-xl border border-dark-carbon p-3 flex flex-col sm:flex-row gap-4 justify-between items-center">
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <div className="relative">
                  <SearchRoundedIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-ash-gray" sx={{ fontSize: 20 }} />
                  <input type="text" value={searchItemTerm} onChange={e => { setSearchItemTerm(e.target.value); setInventoryPage(1); }} placeholder="Search by Item Name or Tag ID..." className="pl-10 pr-4 py-2 border border-dark-carbon rounded-lg text-[13px] w-full sm:w-80 focus:outline-none focus:border-[#1E293B]" />
                </div>
                <select value={filterItemStatus} onChange={e => { setFilterItemStatus(e.target.value); setInventoryPage(1); }} className="border border-dark-carbon rounded-lg px-4 py-2 text-[13px] text-[#1E293B] focus:outline-none focus:border-[#1E293B] bg-white cursor-pointer">
                  <option>All Status</option>
                  <option>Tersedia</option>
                  <option>Dipinjam</option>
                </select>
                <select value={filterItemLoker} onChange={e => { setFilterItemLoker(e.target.value); setInventoryPage(1); }} className="border border-dark-carbon rounded-lg px-4 py-2 text-[13px] text-[#1E293B] focus:outline-none focus:border-[#1E293B] bg-white cursor-pointer">
                  <option>All Loker</option>
                  {LOKER_IDS.map(lokerId => (
                    <option key={lokerId} value={lokerId}>{lokerId.replace('_', ' ').toUpperCase()}</option>
                  ))}
                </select>
              </div>
              <div className="border border-dark-carbon rounded-lg px-4 py-2 text-[13px] font-bold text-ash-gray uppercase whitespace-nowrap">
                {Object.values(inventory).filter(item => {
                  const matchSearch = (item.nama && item.nama.toLowerCase().includes(searchItemTerm.toLowerCase())) || 
                                     (item.tag_id && item.tag_id.toLowerCase().includes(searchItemTerm.toLowerCase())) ||
                                     (item.barcode && item.barcode.toLowerCase().includes(searchItemTerm.toLowerCase()));
                  const matchStatus = filterItemStatus === 'All Status' || 
                                     (filterItemStatus === 'Tersedia' && item.status === 'tersedia') || 
                                     (filterItemStatus === 'Dipinjam' && item.status === 'dipinjam');
                  const matchLoker = filterItemLoker === 'All Loker' || item.loker_assignment === filterItemLoker;
                  return matchSearch && matchStatus && matchLoker;
                }).length} ITEM TERDAFTAR
              </div>
            </div>

            {/* Table Card */}
            <div className="bg-white rounded-xl border border-dark-carbon overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-200">
                  <thead>
                    <tr className="text-[11px] font-bold tracking-wider text-ash-gray uppercase bg-[#F9FAFB] border-b border-dark-carbon">
                      <th className="p-4 pl-6">Nama Barang</th>
                      <th className="p-4">Tag ID / Barcode</th>
                      <th className="p-4">Tipe Sensor</th>
                      <th className="p-4">Loker</th>
                      <th className="p-4 text-center">Status</th>
                      <th className="p-4 text-center">Peminjam Aktif Saat Ini</th>
                      <th className="p-4 text-center pr-6">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-carbon">
                    {(() => {
                      const filteredInventory = Object.values(inventory).filter(item => {
                        const matchSearch = (item.nama && item.nama.toLowerCase().includes(searchItemTerm.toLowerCase())) || 
                                           (item.tag_id && item.tag_id.toLowerCase().includes(searchItemTerm.toLowerCase())) ||
                                           (item.barcode && item.barcode.toLowerCase().includes(searchItemTerm.toLowerCase()));
                        const matchStatus = filterItemStatus === 'All Status' || 
                                           (filterItemStatus === 'Tersedia' && item.status === 'tersedia') || 
                                           (filterItemStatus === 'Dipinjam' && item.status === 'dipinjam');
                        const matchLoker = filterItemLoker === 'All Loker' || item.loker_assignment === filterItemLoker;
                        return matchSearch && matchStatus && matchLoker;
                      });
                      
                      const totalPages = Math.ceil(filteredInventory.length / itemsPerPage);
                      const startIndex = (inventoryPage - 1) * itemsPerPage;
                      const paginatedInventory = filteredInventory.slice(startIndex, startIndex + itemsPerPage);

                      if (filteredInventory.length === 0) {
                        return (
                          <tr>
                            <td colSpan="7" className="p-12 text-center">
                              <div className="flex flex-col items-center justify-center text-ash-gray">
                                <div className="w-16 h-16 mb-4 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                  <SearchOffRoundedIcon sx={{ fontSize: 32, color: 'inherit' }} />
                                </div>
                                <h3 className="text-[15px] font-bold text-[#1E293B] mb-1">Barang Tidak Ditemukan</h3>
                                <p className="text-[13px]">Coba ubah kata kunci pencarian atau filter yang digunakan.</p>
                              </div>
                            </td>
                          </tr>
                        );
                      }

                      return (
                        <>
                          {paginatedInventory.map((item, i) => {
                            const n = (item.nama || '').toLowerCase();
                            let ItemIcon = StorageRoundedIcon;
                            if (n.includes('dell') || n.includes('laptop') || n.includes('pc') || n.includes('mac')) ItemIcon = ComputerRoundedIcon;
                            else if (n.includes('cisco') || n.includes('switch') || n.includes('router') || n.includes('hub')) ItemIcon = RouterRoundedIcon;
                            else if (n.includes('fluke') || n.includes('tool') || n.includes('multimeter') || n.includes('obeng')) ItemIcon = BuildRoundedIcon;
                            
                            const isTersedia = item.status === 'tersedia';
                            
                            return (
                        <tr key={i} className="hover:bg-slate-50 transition-colors">
                          <td className="p-4 pl-6">
                            <p className="font-bold text-[14px] text-[#1E293B]">{item.nama}</p>
                          </td>
                          <td className="p-4 text-[13px] font-medium text-ash-gray">{item.tag_id || item.barcode}</td>
                          <td className="p-4 text-[13px] text-ash-gray">{item.tipe || (n.includes('barcode') ? 'Barcode' : 'RFID HF')}</td>
                          <td className="p-4 text-[13px] text-ash-gray">{item.loker_assignment}</td>
                          <td className="p-4 text-center">
                            <span className={`inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-medium border ${isTersedia ? 'border-green-200 text-green-600 bg-green-50' : 'border-red-200 text-red-600 bg-red-50'}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${isTersedia ? 'bg-green-500' : 'bg-red-500'}`}></span>
                              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            {item.current_borrower ? (
                              <span className="bg-[#F3F4F6] text-[#1E293B] px-4 py-1.5 rounded-md text-[13px] font-medium">{item.current_borrower}</span>
                            ) : (
                              <span className="text-[#1E293B] text-[14px] font-bold">-</span>
                            )}
                          </td>
                          <td className="p-4 pr-6">
                            <div className="flex justify-center gap-2 items-center h-full">
                              <button 
                                onClick={() => { setEditItem(item); setShowEditModal(true); }}
                                className="bg-[#F3F4F6] p-1.5 rounded-md text-[#475569] hover:bg-gray-200 transition-colors"
                                title="Edit Barang"
                              >
                                <EditRoundedIcon sx={{ fontSize: 16 }} />
                              </button>
                              <button 
                                onClick={() => handleDeleteBarang(item.tag_id, item.nama)}
                                className="bg-[#FEF2F2] p-1.5 rounded-md text-red-500 hover:bg-red-100 transition-colors"
                                title="Hapus Barang"
                              >
                                <DeleteRoundedIcon sx={{ fontSize: 16 }} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                          })}
                          {filteredInventory.length === 0 && (
                            <tr><td colSpan="7" className="p-8 text-center text-ash-gray">Barang tidak ditemukan</td></tr>
                          )}
                        </>
                      );
                    })()}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              <div className="p-4 border-t border-dark-carbon flex flex-col sm:flex-row justify-between items-center bg-white gap-4">
                <span className="text-[13px] text-ash-gray">
                  {(() => {
                    const filteredLength = Object.values(inventory).filter(item => {
                      const matchSearch = (item.nama && item.nama.toLowerCase().includes(searchItemTerm.toLowerCase())) || 
                                         (item.tag_id && item.tag_id.toLowerCase().includes(searchItemTerm.toLowerCase())) ||
                                         (item.barcode && item.barcode.toLowerCase().includes(searchItemTerm.toLowerCase()));
                      const matchStatus = filterItemStatus === 'All Status' || 
                                         (filterItemStatus === 'Tersedia' && item.status === 'tersedia') || 
                                         (filterItemStatus === 'Dipinjam' && item.status === 'dipinjam');
                      const matchLoker = filterItemLoker === 'All Loker' || item.loker_assignment === filterItemLoker;
                      return matchSearch && matchStatus && matchLoker;
                    }).length;
                    if (filteredLength === 0) return 'Showing 0 entries';
                    const start = (inventoryPage - 1) * itemsPerPage + 1;
                    const end = Math.min(start + itemsPerPage - 1, filteredLength);
                    return `Showing ${start} to ${end} of ${filteredLength} entries`;
                  })()}
                </span>
                {(() => {
                  const filteredLength = Object.values(inventory).filter(item => {
                    const matchSearch = (item.nama && item.nama.toLowerCase().includes(searchItemTerm.toLowerCase())) || 
                                       (item.tag_id && item.tag_id.toLowerCase().includes(searchItemTerm.toLowerCase())) ||
                                       (item.barcode && item.barcode.toLowerCase().includes(searchItemTerm.toLowerCase()));
                    const matchStatus = filterItemStatus === 'All Status' || 
                                       (filterItemStatus === 'Tersedia' && item.status === 'tersedia') || 
                                       (filterItemStatus === 'Dipinjam' && item.status === 'dipinjam');
                    const matchLoker = filterItemLoker === 'All Loker' || item.loker_assignment === filterItemLoker;
                    return matchSearch && matchStatus && matchLoker;
                  }).length;
                  const totalPages = Math.ceil(filteredLength / itemsPerPage) || 1;
                  
                  return (
                    <div className="flex gap-1">
                      <button 
                        onClick={() => setInventoryPage(p => Math.max(1, p - 1))}
                        disabled={inventoryPage === 1}
                        className="px-2.5 py-1 border border-dark-carbon rounded-md text-ash-gray hover:bg-gray-50 bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                      >&lt;</button>
                      <button className="px-3 py-1 border border-[#1E293B] rounded-md bg-[#1E293B] text-white font-medium">{inventoryPage}</button>
                      <button 
                        onClick={() => setInventoryPage(p => Math.min(totalPages, p + 1))}
                        disabled={inventoryPage === totalPages}
                        className="px-2.5 py-1 border border-dark-carbon rounded-md text-ash-gray hover:bg-gray-50 bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                      >&gt;</button>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* Tab Content: Add Item */}
        {activeTab === 'add_item' && (
          <div className="animate-fadeIn max-w-150 mx-auto pb-12">
            <div className="bg-white rounded-xl border border-dark-carbon shadow-sm overflow-hidden">
              {/* Header */}
              <div className="p-6 border-b border-dark-carbon flex items-start gap-4 bg-white">
                <button type="button" onClick={() => setActiveTab('inventory')} className="text-ash-gray hover:text-[#1E293B] transition-colors mt-1">
                  <ArrowBackRoundedIcon sx={{ fontSize: 20 }} />
                </button>
                <div>
                  <h2 className="text-[20px] font-bold text-[#1E293B] tracking-tight">Tambah Barang</h2>
                </div>
              </div>

              {/* Body */}
              <form onSubmit={handleAddBarang} className="p-6 space-y-6 bg-white">
                <div>
                  <label className="block mb-2 text-[11px] font-bold text-[#475569] uppercase tracking-wider">Nama Barang</label>
                  <input required type="text" value={newItem.nama} onChange={e => setNewItem({...newItem, nama: e.target.value})} className="w-full px-4 py-3 border border-dark-carbon rounded-lg text-[14px] text-[#1E293B] focus:outline-none focus:border-[#1E293B] transition-colors placeholder:text-[#94A3B8]" placeholder="Contoh: Multimeter" />
                </div>
                
                <div>
                  <label className="block mb-2 text-[11px] font-bold text-[#475569] uppercase tracking-wider">Katagori</label>
                  <select required value={newItem.kategori} onChange={e => setNewItem({...newItem, kategori: e.target.value})} className="w-full px-4 py-3 border border-dark-carbon rounded-lg text-[14px] text-[#1E293B] focus:outline-none focus:border-[#1E293B] transition-colors bg-white cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%231E293B%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-size-[16px_16px] bg-position-[right_1rem_center] bg-no-repeat pr-10">
                    <option value="" disabled hidden>Pilih Katagori</option>
                    <option value="Perkakas">Perkakas</option>
                    <option value="Elektronik">Elektronik</option>
                    <option value="Jaringan">Jaringan</option>
                    <option value="Komputer">Komputer</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-2 text-[11px] font-bold text-[#475569] uppercase tracking-wider">Pilih Loker Penyimpanan</label>
                  <div className="flex gap-3">
                    <select value={newItem.loker_assignment} onChange={e => {
                      const val = e.target.value;
                      setNewItem({...newItem, loker_assignment: val, tipe: val === 'loker_01' ? 'RFID_LF' : val === 'loker_02' ? 'RFID_HF' : 'BARCODE'});
                      setIsLockerOpenForNewItem(false);
                    }} className="flex-1 px-4 py-3 border border-dark-carbon rounded-lg text-[14px] text-[#1E293B] focus:outline-none focus:border-[#1E293B] transition-colors bg-white cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%231E293B%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-size-[16px_16px] bg-position-[right_1rem_center] bg-no-repeat pr-10">
                      <option value="loker_01">LOKER 1 (RFID LF/ 125kHz)</option>
                      <option value="loker_02">LOKER 2 (RFID HF/ 13.56MHz)</option>
                      <option value="loker_03">LOKER 3 (Barcode/ Kamera)</option>
                    </select>
                    <button type="button" onClick={() => {
                      if (isLockerOpenForNewItem) {
                        closeLocker(newItem.loker_assignment);
                        setIsLockerOpenForNewItem(false);
                      } else {
                        openLocker(newItem.loker_assignment);
                        setIsLockerOpenForNewItem(true);
                      }
                    }} className={`px-5 py-3 border border-dark-carbon rounded-lg font-bold text-[13px] transition-colors whitespace-nowrap ${isLockerOpenForNewItem ? 'bg-red-50 text-red-600 hover:bg-red-100 border-red-200' : 'bg-[#F8FAFC] text-[#1E293B] hover:bg-gray-100'}`}>
                      {isLockerOpenForNewItem ? 'Tutup Loker' : 'Buka Loker'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block mb-2 text-[11px] font-bold text-[#475569] uppercase tracking-wider">Tag ID / Barcode</label>
                  <div className="flex gap-3">
                    <input required type="text" value={newItem.tag_id} onChange={e => setNewItem({...newItem, tag_id: e.target.value})} className="flex-1 px-4 py-3 border border-dark-carbon rounded-lg text-[14px] text-[#1E293B] focus:outline-none focus:border-[#1E293B] transition-colors placeholder:text-[#94A3B8]" placeholder="UID TAG / BARCODE" />
                    <button type="button" onClick={async () => {
                      if (isListeningLoker) {
                        setIsListeningLoker(false);
                      } else {
                        setIsListeningLoker(true);
                        setNewItem(prev => ({ ...prev, tag_id: "" }));
                        try {
                          await update(ref(db, `/lockers/${newItem.loker_assignment}`), { last_uid: "" });
                        } catch (e) { console.error(e); }
                      }
                    }} className={`px-5 py-3 border border-dark-carbon rounded-lg font-bold text-[13px] transition-colors flex items-center gap-2 whitespace-nowrap ${isListeningLoker ? 'bg-[#1E293B] text-white animate-pulse border-[#1E293B]' : 'bg-[#F8FAFC] text-[#1E293B] hover:bg-gray-100'}`}>
                      <QrCodeScannerRoundedIcon sx={{ fontSize: 18 }} />
                      {isListeningLoker ? 'Mendengarkan...' : 'Scan via Alat'}
                    </button>
                  </div>
                  <p className="mt-2 text-[12px] text-ash-gray">Ketik manual atau klik "Scan via Alat" lalu tempelkan tag ke alat fisik</p>
                </div>

                {/* Footer Buttons */}
                <div className="pt-6 border-t border-dark-carbon flex gap-4 mt-8 bg-[#F8FAFC] -mx-6 -mb-6 p-6">
                  <button type="button" onClick={() => setActiveTab('inventory')} className="flex-1 py-3.5 border border-dark-carbon rounded-xl font-bold text-[13px] text-[#1E293B] hover:bg-gray-100 transition-colors bg-white">
                    BATAL
                  </button>
                  <button type="submit" className="flex-1 py-3.5 bg-[#171717] rounded-xl font-bold text-[13px] text-white hover:bg-black transition-colors">
                    SIMPAN BARANG
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Tab Content: Users */}
        {activeTab === 'users' && (
          <div className="p-6 glass-card animate-fadeIn">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <h2 className="text-xl font-bold text-polar-white">Pengguna Terdaftar (Fingerprint)</h2>
              <div className="relative w-full sm:w-64">
                <SearchRoundedIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" sx={{ fontSize: 20 }} />
                <input 
                  type="text" 
                  value={searchUserTerm}
                  onChange={e => setSearchUserTerm(e.target.value)}
                  placeholder="Search NIM or Name..." 
                  className="w-full pl-10 pr-4 py-2 border border-[#E2E8F0] rounded-xl text-[14px] bg-white text-[#1E293B] focus:outline-none focus:border-[#1E293B] transition-colors placeholder:text-[#64748B]" 
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {(() => {
                const filteredUsers = users.filter(user => {
                  const matchName = user.name && user.name.toLowerCase().includes(searchUserTerm.toLowerCase());
                  const matchNim = user.nim && user.nim.toLowerCase().includes(searchUserTerm.toLowerCase());
                  return matchName || matchNim;
                });
                
                return (
                  <>
                    {filteredUsers.map((user, i) => (
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
                    {filteredUsers.length === 0 && (
                      <div className="py-8 text-center text-ash-gray col-span-full">Pengguna tidak ditemukan</div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {/* Tab Content: Active Loans */}
        {activeTab === 'active_loans' && (
          <div className="animate-fadeIn w-full space-y-6">
            <div className="mb-2 flex justify-between items-start">
              <div>
                <h2 className="text-[22px] font-bold text-[#1E293B]">Peminjaman Aktif</h2>
                <p className="text-[13px] text-ash-gray mt-1">Daftar barang yang sedang dipinjam oleh pengguna</p>
              </div>
              <button onClick={() => {
                const data = loans.filter(l => l.status === 'active').map(l => ({
                  Peminjam: l.user_name, Barang: l.item_name, Item_ID: l.item_id, Waktu_Pinjam: l.timestamp_pinjam, Batas_Waktu: l.expected_return_time || '-', Durasi_Menit: l.duration_minutes || '-', Status: l.expected_return_time && new Date() > new Date(l.expected_return_time) ? 'OVERDUE' : 'Berjalan'
                }));
                exportToCSV(data, ['Peminjam','Barang','Item_ID','Waktu_Pinjam','Batas_Waktu','Durasi_Menit','Status'], 'peminjaman_aktif');
              }} className="flex items-center gap-2 px-4 py-2 bg-[#1E293B] text-white rounded-lg text-[13px] font-bold hover:bg-black transition-colors shrink-0">
                <DownloadRoundedIcon sx={{ fontSize: 16 }} /> Export CSV
              </button>
            </div>

            {(() => {
              const activeLoansList = loans.filter(l => l.status === 'active');
              const overdueCount = activeLoansList.filter(l => l.expected_return_time && new Date() > new Date(l.expected_return_time)).length;
              const tersediaCount = Object.values(inventory).filter(item => item.status === 'tersedia').length;
              
              return (
                <>
                  {/* Metric Cards Grid */}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    {/* Card 1: Total Pinjam */}
                    <div className="bg-white rounded-xl border border-dark-carbon p-5 flex items-center gap-4 shadow-sm">
                      <div className="w-12 h-12 rounded-full bg-[#F8FAFC] flex items-center justify-center text-[#1E293B]">
                        <TimerRoundedIcon />
                      </div>
                      <div>
                        <p className="text-[12px] font-bold text-ash-gray uppercase tracking-wider mb-1">Total Pinjam</p>
                        <h3 className="text-2xl font-bold text-[#1E293B] leading-none">{activeLoansList.length}</h3>
                      </div>
                    </div>
                    {/* Card 2: Overdue */}
                    <div className="bg-[#FEF2F2] rounded-xl border border-red-200 p-5 flex items-center gap-4 shadow-sm">
                      <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-500">
                        <ErrorOutlineRoundedIcon />
                      </div>
                      <div>
                        <p className="text-[12px] font-bold text-red-500 uppercase tracking-wider mb-1">Overdue</p>
                        <h3 className="text-2xl font-bold text-red-600 leading-none">{overdueCount}</h3>
                      </div>
                    </div>
                    {/* Card 3: Tersedia */}
                    <div className="bg-[#F0FDF4] rounded-xl border border-green-200 p-5 flex items-center gap-4 shadow-sm">
                      <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-500">
                        <CheckCircleRoundedIcon />
                      </div>
                      <div>
                        <p className="text-[12px] font-bold text-green-500 uppercase tracking-wider mb-1">Tersedia</p>
                        <h3 className="text-2xl font-bold text-green-600 leading-none">{tersediaCount}</h3>
                      </div>
                    </div>
                    {/* Card 4: Unit Loker */}
                    <div className="bg-white rounded-xl border border-dark-carbon p-5 flex items-center gap-4 shadow-sm">
                      <div className="w-12 h-12 rounded-full bg-[#F8FAFC] flex items-center justify-center text-[#1E293B]">
                        <InventoryRoundedIcon />
                      </div>
                      <div>
                        <p className="text-[12px] font-bold text-ash-gray uppercase tracking-wider mb-1">Unit Loker</p>
                        <h3 className="text-2xl font-bold text-[#1E293B] leading-none">{LOKER_IDS.length}</h3>
                      </div>
                    </div>
                  </div>

                  {/* Table Card */}
                  <div className="bg-white rounded-xl border border-dark-carbon overflow-hidden shadow-sm mt-6">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="text-[12px] font-bold tracking-wider text-ash-gray bg-[#F8FAFC] border-b border-dark-carbon">
                            <th className="p-4 pl-6">Peminjam</th>
                            <th className="p-4">Barang</th>
                            <th className="p-4">Waktu Pinjam</th>
                            <th className="p-4">Batas Waktu</th>
                            <th className="p-4 text-center">Status</th>
                            <th className="p-4 text-center pr-6">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-dark-carbon">
                          {(() => {
                            const totalLoanPages = Math.ceil(activeLoansList.length / itemsPerPage);
                            const startLoanIndex = (loansPage - 1) * itemsPerPage;
                            const paginatedLoans = activeLoansList.slice(startLoanIndex, startLoanIndex + itemsPerPage);

                            if (activeLoansList.length === 0) {
                              return (
                                <tr>
                                  <td colSpan="6" className="p-12 text-center">
                                    <div className="flex flex-col items-center justify-center text-ash-gray">
                                      <div className="w-16 h-16 mb-4 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                        <InboxRoundedIcon sx={{ fontSize: 32, color: 'inherit' }} />
                                      </div>
                                      <h3 className="text-[15px] font-bold text-[#1E293B] mb-1">Belum Ada Peminjaman Aktif</h3>
                                      <p className="text-[13px]">Saat ini tidak ada barang yang sedang dipinjam.</p>
                                    </div>
                                  </td>
                                </tr>
                              );
                            }

                            return (
                              <>
                                {paginatedLoans.map((loan, i) => {
                                  const isOverdue = loan.expected_return_time && new Date() > new Date(loan.expected_return_time);
                                  const initials = (loan.user_name || '').charAt(0).toUpperCase() || 'U';
                            
                            return (
                              <tr key={i} className={`hover:bg-slate-50 transition-colors`}>
                                <td className="p-4 pl-6">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0 ${isOverdue ? 'bg-red-100 text-red-600' : 'bg-[#F1F5F9] text-[#475569]'}`}>
                                      {initials}
                                    </div>
                                    <span className="font-bold text-[14px] text-[#1E293B]">{loan.user_name}</span>
                                  </div>
                                </td>
                                <td className="p-4">
                                  <p className="font-bold text-[13px] text-[#1E293B]">{loan.item_name}</p>
                                  <p className="text-[11px] font-mono text-[#94A3B8] tracking-widest mt-0.5">{loan.item_id}</p>
                                </td>
                                <td className="p-4">
                                  <span className="font-mono text-[13px] text-[#475569] font-medium">{new Date(loan.timestamp_pinjam).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}</span>
                                </td>
                                <td className="p-4">
                                  {loan.expected_return_time ? (
                                    <div className="flex flex-col">
                                      <span className={`font-mono text-[13px] font-bold ${isOverdue ? 'text-red-500' : 'text-[#1E293B]'}`}>
                                        {new Date(loan.expected_return_time).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}
                                      </span>
                                      <span className={`text-[11px] ${isOverdue ? 'text-red-500' : 'text-[#94A3B8]'}`}>({loan.duration_minutes} Mnt)</span>
                                    </div>
                                  ) : (
                                    <span className="text-[#94A3B8]">-</span>
                                  )}
                                </td>
                                <td className="p-4 text-center">
                                  {isOverdue ? (
                                    <span className="inline-flex items-center gap-1.5 bg-red-500 text-white px-3 py-1 rounded-full text-[10px] font-bold tracking-widest">
                                      <ErrorOutlineRoundedIcon sx={{ fontSize: 12 }} /> OVERDUE
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center bg-[#DCFCE7] text-[#16A34A] px-3 py-1 rounded-full text-[11px] font-bold tracking-wider">
                                      Berjalan
                                    </span>
                                  )}
                                </td>
                                <td className="p-4 text-center pr-6">
                                  <button onClick={() => handleForceReturn(loan)} className="px-3 py-1.5 bg-[#FEF2F2] text-red-500 hover:bg-red-100 border border-red-100 transition-colors rounded-lg text-[11px] font-bold tracking-wider whitespace-nowrap">
                                    FORCE RETURN
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                              </>
                            );
                          })()}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination Footer */}
                    <div className="p-4 border-t border-dark-carbon flex flex-col sm:flex-row justify-between items-center bg-[#F8FAFC] gap-4">
                      <span className="text-[12px] text-ash-gray font-medium">
                        {(() => {
                          if (activeLoansList.length === 0) return 'Menampilkan 0 peminjaman aktif';
                          const start = (loansPage - 1) * itemsPerPage + 1;
                          const end = Math.min(start + itemsPerPage - 1, activeLoansList.length);
                          return `Menampilkan ${start} sampai ${end} dari ${activeLoansList.length} peminjaman aktif`;
                        })()}
                      </span>
                      {(() => {
                        const totalLoanPages = Math.ceil(activeLoansList.length / itemsPerPage) || 1;
                        return (
                          <div className="flex gap-1.5">
                            <button 
                              onClick={() => setLoansPage(p => Math.max(1, p - 1))}
                              disabled={loansPage === 1}
                              className="w-8 h-8 flex items-center justify-center border border-dark-carbon rounded-md text-ash-gray hover:bg-gray-100 bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >&lt;</button>
                            <button className="w-8 h-8 flex items-center justify-center border border-[#1E293B] rounded-md bg-[#1E293B] text-white font-bold text-[13px]">{loansPage}</button>
                            <button 
                              onClick={() => setLoansPage(p => Math.min(totalLoanPages, p + 1))}
                              disabled={loansPage === totalLoanPages}
                              className="w-8 h-8 flex items-center justify-center border border-dark-carbon rounded-md text-ash-gray hover:bg-gray-100 bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >&gt;</button>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {/* Tab Content: Access Logs */}
        {activeTab === 'logs_access' && (
          <div className="p-6 glass-card animate-fadeIn">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-polar-white">Log Akses Loker (Hardware)</h2>
              <button onClick={() => {
                const data = accessLogs.slice(0, 50).map(log => ({ Waktu: log.timestamp, User: log.user || 'Sistem', Aksi: log.action, Loker: log.loker, Barang_Tag: log.item || log.uid || log.reason || '-' }));
                exportToCSV(data, ['Waktu','User','Aksi','Loker','Barang_Tag'], 'log_akses_loker');
              }} className="flex items-center gap-2 px-3 py-1.5 bg-dark-carbon text-polar-white rounded-lg text-[12px] font-bold hover:bg-dark-carbon/70 transition-colors">
                <DownloadRoundedIcon sx={{ fontSize: 14 }} /> Export CSV
              </button>
            </div>
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
                      <td className="p-4 text-ash-gray text-sm truncate max-w-50">{log.item || log.uid || log.reason || '-'}</td>
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
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-polar-white">Log Autentikasi Sidik Jari</h2>
              <button onClick={() => {
                const data = authLogs.slice(0, 50).map(log => ({ Waktu: log.timestamp, Pengguna: log.user, Finger_ID: log.finger_id }));
                exportToCSV(data, ['Waktu','Pengguna','Finger_ID'], 'log_autentikasi');
              }} className="flex items-center gap-2 px-3 py-1.5 bg-dark-carbon text-polar-white rounded-lg text-[12px] font-bold hover:bg-dark-carbon/70 transition-colors">
                <DownloadRoundedIcon sx={{ fontSize: 14 }} /> Export CSV
              </button>
            </div>
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
                      <td className="flex items-center gap-1 p-4 font-medium text-neon-green"><CheckCircleRoundedIcon sx={{ fontSize: 16, color: '#00AC5C' }} /> {log.user}</td>
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

        {/* Tab Content: Riwayat Peminjaman */}
        {activeTab === 'loan_history' && (
          <div className="animate-fadeIn w-full space-y-4 pb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
              <div>
                <h2 className="text-[22px] font-bold text-[#1E293B]">Riwayat Semua Peminjaman</h2>
                <p className="text-[13px] text-ash-gray mt-1">Catatan lengkap peminjaman & pengembalian barang</p>
              </div>
              <button onClick={() => {
                const filtered = loans.filter(l => {
                  const matchSearch = !searchLoanTerm || (l.user_name && l.user_name.toLowerCase().includes(searchLoanTerm.toLowerCase())) || (l.item_name && l.item_name.toLowerCase().includes(searchLoanTerm.toLowerCase()));
                  const matchStatus = filterLoanStatus === 'Semua' || l.status === (filterLoanStatus === 'Aktif' ? 'active' : 'returned');
                  const loanDate = new Date(l.timestamp_pinjam);
                  const matchDateFrom = !filterDateFrom || loanDate >= new Date(filterDateFrom);
                  const matchDateTo = !filterDateTo || loanDate <= new Date(filterDateTo + 'T23:59:59');
                  return matchSearch && matchStatus && matchDateFrom && matchDateTo;
                }).map(l => ({
                  Peminjam: l.user_name, Barang: l.item_name, Item_ID: l.item_id, Waktu_Pinjam: l.timestamp_pinjam, Waktu_Kembali: l.timestamp_kembali || '-', Durasi_Menit: l.duration_minutes || '-', Status: l.status === 'active' ? 'DIPINJAM' : 'KEMBALI', Keterangan: l.keterangan || '-'
                }));
                exportToCSV(filtered, ['Peminjam','Barang','Item_ID','Waktu_Pinjam','Waktu_Kembali','Durasi_Menit','Status','Keterangan'], 'riwayat_peminjaman');
              }} className="flex items-center gap-2 px-4 py-2 bg-[#1E293B] text-white rounded-lg text-[13px] font-bold hover:bg-black transition-colors shrink-0">
                <DownloadRoundedIcon sx={{ fontSize: 16 }} /> Export CSV
              </button>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl border border-dark-carbon p-3 flex flex-col lg:flex-row gap-3 items-center">
              <div className="relative flex-1 w-full lg:w-auto">
                <SearchRoundedIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-ash-gray" sx={{ fontSize: 20 }} />
                <input type="text" value={searchLoanTerm} onChange={e => setSearchLoanTerm(e.target.value)} placeholder="Cari peminjam atau barang..." className="w-full pl-10 pr-4 py-2 border border-dark-carbon rounded-lg text-[13px] focus:outline-none focus:border-[#1E293B]" />
              </div>
              <select value={filterLoanStatus} onChange={e => setFilterLoanStatus(e.target.value)} className="border border-dark-carbon rounded-lg px-4 py-2 text-[13px] text-[#1E293B] focus:outline-none focus:border-[#1E293B] bg-white cursor-pointer">
                <option>Semua</option>
                <option>Aktif</option>
                <option>Dikembalikan</option>
              </select>
              <div className="flex items-center gap-2">
                <span className="text-[12px] text-ash-gray font-bold whitespace-nowrap">Dari:</span>
                <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} className="border border-dark-carbon rounded-lg px-3 py-2 text-[13px] text-[#1E293B] focus:outline-none focus:border-[#1E293B] bg-white" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[12px] text-ash-gray font-bold whitespace-nowrap">Sampai:</span>
                <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} className="border border-dark-carbon rounded-lg px-3 py-2 text-[13px] text-[#1E293B] focus:outline-none focus:border-[#1E293B] bg-white" />
              </div>
              {(searchLoanTerm || filterLoanStatus !== 'Semua' || filterDateFrom || filterDateTo) && (
                <button onClick={() => { setSearchLoanTerm(''); setFilterLoanStatus('Semua'); setFilterDateFrom(''); setFilterDateTo(''); }} className="text-[12px] font-bold text-red-500 hover:text-red-600 transition-colors whitespace-nowrap">
                  Reset Filter
                </button>
              )}
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-dark-carbon overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-[11px] font-bold tracking-wider text-ash-gray uppercase bg-[#F9FAFB] border-b border-dark-carbon">
                      <th className="p-4 pl-6">Peminjam</th>
                      <th className="p-4">Barang</th>
                      <th className="p-4">Waktu Pinjam</th>
                      <th className="p-4">Waktu Kembali</th>
                      <th className="p-4">Durasi</th>
                      <th className="p-4 text-center">Status</th>
                      <th className="p-4 text-center pr-6">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-carbon">
                    {(() => {
                      const filteredLoans = [...loans].reverse().filter(l => {
                        const matchSearch = !searchLoanTerm || (l.user_name && l.user_name.toLowerCase().includes(searchLoanTerm.toLowerCase())) || (l.item_name && l.item_name.toLowerCase().includes(searchLoanTerm.toLowerCase()));
                        const matchStatus = filterLoanStatus === 'Semua' || l.status === (filterLoanStatus === 'Aktif' ? 'active' : 'returned');
                        const loanDate = new Date(l.timestamp_pinjam);
                        const matchDateFrom = !filterDateFrom || loanDate >= new Date(filterDateFrom);
                        const matchDateTo = !filterDateTo || loanDate <= new Date(filterDateTo + 'T23:59:59');
                        return matchSearch && matchStatus && matchDateFrom && matchDateTo;
                      });
                      return (
                        <>
                          {filteredLoans.map((loan, i) => {
                            const isActive = loan.status === 'active';
                            const isOverdue = isActive && loan.expected_return_time && new Date() > new Date(loan.expected_return_time);
                            return (
                              <tr key={i} className="hover:bg-slate-50 transition-colors">
                                <td className="p-4 pl-6">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${isOverdue ? 'bg-red-100 text-red-600' : isActive ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'}`}>
                                      {(loan.user_name || 'U').charAt(0)}
                                    </div>
                                    <span className="font-bold text-[13px] text-[#1E293B]">{loan.user_name}</span>
                                  </div>
                                </td>
                                <td className="p-4">
                                  <p className="font-bold text-[13px] text-[#1E293B]">{loan.item_name}</p>
                                  <p className="text-[10px] font-mono text-[#94A3B8] mt-0.5">{loan.item_id}</p>
                                </td>
                                <td className="p-4 font-mono text-[12px] text-[#475569]">
                                  {new Date(loan.timestamp_pinjam).toLocaleString('id-ID', {day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit'})}
                                </td>
                                <td className="p-4 font-mono text-[12px] text-[#475569]">
                                  {loan.timestamp_kembali ? new Date(loan.timestamp_kembali).toLocaleString('id-ID', {day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit'}) : <span className="text-[#94A3B8]">—</span>}
                                </td>
                                <td className="p-4 text-[12px] text-[#475569]">
                                  {loan.duration_minutes ? `${loan.duration_minutes} mnt` : '-'}
                                </td>
                                <td className="p-4 text-center">
                                  {isOverdue ? (
                                    <span className="inline-flex items-center gap-1 bg-red-500 text-white px-2.5 py-1 rounded-full text-[10px] font-bold">OVERDUE</span>
                                  ) : isActive ? (
                                    <span className="inline-flex items-center bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full text-[10px] font-bold">DIPINJAM</span>
                                  ) : (
                                    <span className="inline-flex items-center bg-green-100 text-green-700 px-2.5 py-1 rounded-full text-[10px] font-bold">KEMBALI</span>
                                  )}
                                </td>
                                <td className="p-4 text-center pr-6 text-[12px] text-[#475569]">
                                  {loan.keterangan || '-'}
                                </td>
                              </tr>
                            );
                          })}
                          {filteredLoans.length === 0 && (
                            <tr><td colSpan="7" className="p-8 text-center text-ash-gray">Tidak ada data peminjaman yang cocok</td></tr>
                          )}
                        </>
                      );
                    })()}
                  </tbody>
                </table>
              </div>
              <div className="p-4 border-t border-dark-carbon flex justify-between items-center bg-[#F8FAFC]">
                <span className="text-[12px] text-ash-gray font-medium">
                  Total: {loans.length} peminjaman ({loans.filter(l => l.status === 'active').length} aktif, {loans.filter(l => l.status === 'returned').length} dikembalikan)
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content: Tools */}
        {activeTab === 'tools' && (
          <div className="p-6 glass-card animate-fadeIn">
            <h2 className="mb-6 text-xl font-bold text-polar-white flex items-center gap-2">
              <LocalOfferRoundedIcon sx={{ fontSize: 24, color: 'inherit' }} /> Node 1, 2, 3 (Loker & Tag)
            </h2>
            
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-ash-gray uppercase mb-2">Status Loker Realtime</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {LOKER_IDS.map((lokerId) => {
                  const data = lockerStatuses[lokerId];
                  const isOpen = data?.status === 'UNLOCKED';
                  return (
                    <div key={lokerId} className={`p-4 rounded-lg border text-center transition-all ${
                      isOpen 
                        ? 'bg-amber-glow/10 border-amber-glow/30' 
                        : 'bg-midnight-void border-dark-carbon'
                    }`}>
                      <div className="mb-2">
                        {isOpen 
                          ? <LockOpenRoundedIcon sx={{ fontSize: 24, color: 'inherit' }} />
                          : <LockRoundedIcon sx={{ fontSize: 24, color: 'inherit' }} />
                        }
                      </div>
                      <p className="text-sm font-bold text-polar-white">{lokerId.replace('_', ' ').toUpperCase()}</p>
                      <p className="text-[10px] font-mono text-amber-glow/80 mt-0.5">
                        {lokerId === 'loker_01' ? 'RFID LF' : lokerId === 'loker_02' ? 'RFID HF' : 'Barcode'}
                      </p>
                      <p className={`text-xs font-mono mt-1 ${isOpen ? 'text-polar-white' : 'text-ash-gray'}`}>
                        {data?.status || 'LOCKED'}
                      </p>
                      <p className="text-xs font-mono text-ash-gray/70 mb-3">
                        cmd: {data?.command || '-'}
                      </p>
                      <button
                        onClick={() => forceLockerState(lokerId, isOpen ? 'CLOSE' : 'OPEN')}
                        className={`w-full py-2 rounded font-bold text-xs ${
                          isOpen 
                            ? 'bg-red-600/80 hover:bg-red-500 text-polar-white' 
                            : 'bg-dark-carbon hover:bg-dark-carbon/50 text-polar-white'
                        }`}
                      >
                        {isOpen ? 'LOCK' : 'UNLOCK'}
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 flex items-start gap-3 bg-deep-space/50 p-3 rounded-lg border border-dark-carbon">
                <input
                  type="checkbox"
                  id="autoRespondAdmin"
                  checked={autoRespondEnabled}
                  onChange={(e) => setAutoRespondEnabled(e.target.checked)}
                  className="w-5 h-5 accent-amber-glow cursor-pointer mt-0.5 shrink-0"
                />
                <label htmlFor="autoRespondAdmin" className="text-sm text-ash-gray cursor-pointer">
                  Auto-respond: Otomatis set status saat command berubah (simulasi firmware)
                </label>
              </div>
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
                  onClick={() => { setEditUserItem(selectedUser); setShowEditUserModal(true); }}
                  className="h-10 px-4 flex items-center justify-center rounded-xl bg-amber-glow/10 text-amber-glow hover:bg-amber-glow hover:text-gray-900 font-bold text-sm transition-colors gap-2"
                  title="Edit Pengguna"
                >
                  <EditRoundedIcon sx={{ fontSize: 16 }} /> <span className="hidden sm:inline">Edit</span>
                </button>
                <button 
                  onClick={() => handleDeleteUser(selectedUser)}
                  className="h-10 px-4 flex items-center justify-center rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-gray-900 font-bold text-sm transition-colors gap-2"
                  title="Hapus Pengguna"
                >
                  <DeleteRoundedIcon sx={{ fontSize: 16 }} /> <span className="hidden sm:inline">Hapus</span>
                </button>
                <button 
                  onClick={() => setShowUserModal(false)}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-dark-carbon/50 text-ash-gray hover:bg-red-500/20 hover:text-red-500 transition-colors"
                >
                  <CloseRoundedIcon />
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

      {/* Edit User Modal */}
      {showEditUserModal && editUserItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-midnight-void/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg glass-card border border-dark-carbon p-6 shadow-2xl animate-fadeInUp">
            <div className="flex justify-between items-center mb-6 border-b border-dark-carbon pb-4">
              <h2 className="text-xl font-bold text-polar-white flex items-center gap-2">
                <EditRoundedIcon sx={{ fontSize: 24 }} /> Edit Pengguna
              </h2>
              <button 
                onClick={() => { setShowEditUserModal(false); setEditUserItem(null); }}
                className="text-ash-gray hover:text-polar-white bg-dark-carbon p-1 rounded-lg transition-colors"
              >
                <CloseRoundedIcon sx={{ fontSize: 20 }} />
              </button>
            </div>
            <form onSubmit={handleEditUserSubmit} className="space-y-4">
              <div>
                <label className="block mb-2 text-xs font-bold text-ash-gray uppercase tracking-wider">Nama Lengkap</label>
                <input required type="text" value={editUserItem.name} onChange={e => setEditUserItem({...editUserItem, name: e.target.value})} className="w-full px-4 py-3 bg-deep-space border border-dark-carbon rounded-lg text-sm text-polar-white focus:outline-none focus:border-amber-glow transition-colors" />
              </div>
              <div>
                <label className="block mb-2 text-xs font-bold text-ash-gray uppercase tracking-wider">Nomor Induk Mahasiswa (NIM)</label>
                <input required type="text" value={editUserItem.nim} onChange={e => setEditUserItem({...editUserItem, nim: e.target.value})} className="w-full px-4 py-3 bg-deep-space border border-dark-carbon rounded-lg text-sm text-polar-white focus:outline-none focus:border-amber-glow transition-colors" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 text-xs font-bold text-ash-gray uppercase tracking-wider">No. Telepon / WhatsApp</label>
                  <input type="text" value={editUserItem.phone || ''} onChange={e => setEditUserItem({...editUserItem, phone: e.target.value})} className="w-full px-4 py-3 bg-deep-space border border-dark-carbon rounded-lg text-sm text-polar-white focus:outline-none focus:border-amber-glow transition-colors" />
                </div>
                <div>
                  <label className="block mb-2 text-xs font-bold text-ash-gray uppercase tracking-wider">Fingerprint ID</label>
                  <input type="text" value={`#${editUserItem.finger_id}`} disabled className="w-full px-4 py-3 bg-dark-carbon/50 border border-dark-carbon rounded-lg text-sm text-ash-gray cursor-not-allowed" />
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => { setShowEditUserModal(false); setEditUserItem(null); }} className="flex-1 py-3 bg-dark-carbon text-polar-white rounded-lg font-bold text-sm hover:bg-dark-carbon/80 transition-colors">
                  Batal
                </button>
                <button type="submit" className="flex-1 py-3 bg-amber-glow text-gray-900 rounded-lg font-bold text-sm hover:bg-amber-glow/90 transition-colors shadow-[0_0_15px_rgba(231,197,154,0.3)]">
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {showEditModal && editItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-midnight-void/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg glass-card border border-dark-carbon p-6 shadow-2xl animate-fadeInUp">
            <div className="flex justify-between items-center mb-6 border-b border-dark-carbon pb-4">
              <h2 className="text-xl font-bold text-polar-white flex items-center gap-2">
                <EditRoundedIcon sx={{ fontSize: 24 }} /> Edit Barang
              </h2>
              <button 
                onClick={() => { setShowEditModal(false); setEditItem(null); }}
                className="text-ash-gray hover:text-polar-white bg-dark-carbon p-1 rounded-lg transition-colors"
              >
                <CloseRoundedIcon sx={{ fontSize: 20 }} />
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

      {/* Diagnostics Modal */}
      {showDiagnosticModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1E293B]/40 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-90 bg-[#F8FAFC] rounded-3xl p-6 shadow-2xl animate-fadeInUp">
            <div className="flex items-center mb-4">
              <RouterRoundedIcon className="text-[#1E293B]" />
              <h2 className="text-[18px] font-bold text-[#1E293B] ml-2 tracking-tight">Node Diagnostics</h2>
              <button 
                onClick={() => setShowDiagnosticModal(false)}
                className="ml-auto w-8 h-8 flex items-center justify-center bg-[#E2E8F0] text-[#64748B] rounded-xl hover:bg-[#CBD5E1] transition-colors"
              >
                <CloseRoundedIcon sx={{ fontSize: 18 }} />
              </button>
            </div>
            
            <hr className="mb-5 border-[#E2E8F0]" />
            
            <div className="space-y-3">
              {[
                {name: 'Node 0', desc: 'Fingerprint'},
                {name: 'Node 1', desc: 'RFID LF'},
                {name: 'Node 2', desc: 'RFID HF'},
                {name: 'Node 3', desc: 'Barcode'}
              ].map((node, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-[#F1F5F9] border border-[#E2E8F0] rounded-2xl">
                  <div className="flex flex-col">
                    <span className="text-[14px] font-bold text-[#1E293B]">{node.name}</span>
                    <span className="text-[13px] text-[#64748B] mt-0.5">{node.desc}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-[11px] font-bold text-[#475569] tracking-widest">TERHUBUNG</span>
                    <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-center text-[12px] text-[#94A3B8] mt-6 px-4 leading-relaxed">
              Membaca data persisten dari Firebase Realtime Database.
            </p>
          </div>
        </div>
      )}
      </main>
    </div>
    </>
  );
}
