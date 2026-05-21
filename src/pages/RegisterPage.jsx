import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  submitEnrollmentRequest,
  listenEnrollmentStatus,
  clearEnrollmentQueue,
  setAuthStatusIdle,
} from "../services/firebase";
import LockIcon from '@mui/icons-material/Lock';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import PanToolIcon from '@mui/icons-material/PanTool';
import SettingsIcon from '@mui/icons-material/Settings';

const STATUS_INFO = {
  WAITING: { label: "Menunggu respons sensor...", icon: HourglassEmptyIcon, color: "text-yellow-500", step: 2 },
  PLACE_FINGER_1: { label: "Tempelkan jari ke sensor (scan 1/2)", icon: PanToolIcon, color: "text-emerald-400", step: 2 },
  LIFT_FINGER: { label: "Angkat jari dari sensor", icon: PanToolIcon, color: "text-purple-400", step: 2 },
  PLACE_FINGER_2: { label: "Tempelkan jari lagi (scan 2/2)", icon: PanToolIcon, color: "text-emerald-400", step: 3 },
  PROCESSING: { label: "Menyimpan data sidik jari...", icon: SettingsIcon, color: "text-orange-400", step: 3 },
  SUCCESS: { label: "Pendaftaran berhasil!", icon: CheckCircleIcon, color: "text-emerald-400", step: 4 },
  FAILED: { label: "Pendaftaran gagal. Silakan coba lagi.", icon: ErrorIcon, color: "text-red-400", step: 0 },
};

const STEPS = ["Data Diri", "Scan Jari 1", "Scan Jari 2", "Selesai"];

export default function RegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: "", nim: "", phone: "", email: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [enrollData, setEnrollData] = useState(null);
  const [fingerId, setFingerId] = useState(null);
  const unsubRef = useRef(null);

  useEffect(() => {
    return () => {
      if (unsubRef.current) unsubRef.current();
    };
  }, []);

  useEffect(() => {
    if (!enrollData) return;
    const info = STATUS_INFO[enrollData.status];
    if (info) setStep(info.step || step);

    if (enrollData.status === "SUCCESS" || enrollData.status === "FAILED") {
      setLoading(false);
      if (unsubRef.current) { unsubRef.current(); unsubRef.current = null; }
    }
  }, [enrollData]);

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = "Nama wajib diisi";
    if (!form.nim.trim()) e.nim = "NIM wajib diisi";
    if (!/^08\d{8,11}$/.test(form.phone)) e.phone = "Format: 08xxxxxxxxxx";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Email tidak valid";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const id = await submitEnrollmentRequest(form);
      setFingerId(id);
      setStep(2);

      unsubRef.current = listenEnrollmentStatus((data) => {
        setEnrollData(data);
      });
    } catch (err) {
      alert("Error: " + err.message);
      setLoading(false);
    }
  }

  async function handleReset() {
    await clearEnrollmentQueue();
    setStep(1);
    setForm({ name: "", nim: "", phone: "", email: "" });
    setErrors({});
    setEnrollData(null);
    setFingerId(null);
    setLoading(false);
  }

  // Handler: Kembali ke beranda — HARUS reset auth ke IDLE dulu
  async function handleGoHome() {
    await clearEnrollmentQueue();
    await setAuthStatusIdle();
    navigate('/');
  }

  // Handler: Masuk ke sistem setelah registrasi berhasil
  async function handleEnterSystem() {
    await clearEnrollmentQueue();
    await setAuthStatusIdle();
    navigate('/');
  }

  const statusInfo = enrollData ? STATUS_INFO[enrollData.status] : null;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-emerald-900/20 rounded-full filter blur-[120px]"></div>

      <div className="w-full max-w-md relative z-10 animate-fadeInUp">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto bg-gray-800 rounded-2xl flex items-center justify-center mb-4 border border-gray-700 shadow-lg">
            <LockIcon sx={{ fontSize: 32, color: '#10B981' }} />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Daftar Sidik Jari</h1>
          <p className="text-gray-400 text-sm mt-1">Sistem Inventaris IoT</p>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-between mb-8 px-2 relative">
          <div className="absolute top-4 left-0 w-full h-0.5 bg-gray-800 -z-10"></div>
          <div className="absolute top-4 left-0 h-0.5 bg-emerald-500 transition-all duration-500 -z-10" style={{ width: `${((step - 1) / 3) * 100}%` }}></div>
          
          {STEPS.map((label, i) => {
            const idx = i + 1;
            const active = step === idx;
            const done = step > idx;
            return (
              <div key={i} className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300
                  ${done ? "bg-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.5)]" : 
                    active ? "bg-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.8)] border-2 border-white" : 
                             "bg-gray-800 text-gray-500 border border-gray-700"}`}>
                  {done ? "✓" : idx}
                </div>
                <span className={`text-xs mt-2 font-medium ${active ? "text-emerald-400" : done ? "text-gray-300" : "text-gray-600"}`}>
                  {label}
                </span>
              </div>
            );
          })}
        </div>

        {/* STEP 1: Form */}
        {step === 1 && (
          <form onSubmit={handleSubmit} className="glass-card p-6">
            <h2 className="text-white font-semibold text-lg mb-5 flex items-center gap-2">
              <span className="w-1 h-5 bg-blue-500 rounded-full"></span> Data Pengguna
            </h2>

            <div className="space-y-4 mb-6">
              <div>
                <label className="text-gray-400 text-xs uppercase tracking-wider font-semibold mb-1 block">NIM</label>
                <input
                  type="text"
                  value={form.nim}
                  onChange={(e) => setForm({ ...form, nim: e.target.value })}
                  placeholder="Contoh: 1301213000"
                  className="input-field"
                />
                {errors.nim && <p className="text-red-400 text-xs mt-1">{errors.nim}</p>}
              </div>

              <div>
                <label className="text-gray-400 text-xs uppercase tracking-wider font-semibold mb-1 block">Nama Lengkap</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Contoh: Budi Santoso"
                  className="input-field"
                />
                {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="text-gray-400 text-xs uppercase tracking-wider font-semibold mb-1 block">Nomor Telepon</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="08xxxxxxxxxx"
                  className="input-field"
                />
                {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone}</p>}
              </div>

              <div>
                <label className="text-gray-400 text-xs uppercase tracking-wider font-semibold mb-1 block">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="nama@email.com"
                  className="input-field"
                />
                {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
              </div>
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={handleGoHome} className="btn-ghost flex-1">
                Batal
              </button>
              <button type="submit" disabled={loading} className="btn-primary flex-[2]">
                {loading ? "Memproses..." : "Lanjut Scan →"}
              </button>
            </div>
          </form>
        )}

        {/* STEP 2 & 3: Scan */}
        {(step === 2 || step === 3) && (
          <div className="glass-card p-8 text-center">
            <div className="relative w-32 h-32 mx-auto mb-8">
              <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-pulse-ring"></div>
              <div className="relative w-full h-full bg-gray-800 rounded-full border-2 border-emerald-500/50 flex items-center justify-center z-10 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                {statusInfo?.icon ? <statusInfo.icon sx={{ fontSize: 50, color: '#10B981' }} /> : <PanToolIcon sx={{ fontSize: 50, color: '#10B981' }} />}
              </div>
            </div>

            <h3 className={`text-xl font-bold mb-2 ${statusInfo?.color || "text-white"}`}>
              {statusInfo?.label || "Memproses..."}
            </h3>

            {enrollData?.message && (
              <p className="text-gray-400 mb-4">{enrollData.message}</p>
            )}

            <div className="bg-gray-900/50 rounded-lg p-3 inline-block border border-gray-800">
              <p className="text-gray-500 text-xs font-mono">Finger ID dialokasikan:</p>
              <p className="text-emerald-400 font-bold font-mono text-lg">#{fingerId}</p>
            </div>

            {enrollData?.status === "FAILED" && (
              <div className="space-y-3 mt-6">
                <button onClick={handleReset} className="w-full btn-danger">
                  Coba Lagi
                </button>
                <button onClick={handleGoHome} className="w-full btn-ghost text-sm">
                  Kembali ke Beranda
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP 4: Success */}
        {step === 4 && enrollData?.status === "SUCCESS" && (
          <div className="glass-card p-8 text-center border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.1)] border">
            <div className="w-20 h-20 mx-auto bg-emerald-500/20 rounded-full flex items-center justify-center mb-6">
              <CheckCircleIcon sx={{ fontSize: 48, color: '#10B981' }} />
            </div>
            <h2 className="text-2xl font-bold text-emerald-400 mb-2">Berhasil!</h2>
            <p className="text-gray-300 mb-6">Sidik jari <span className="text-white font-semibold">{form.name}</span> telah tersimpan.</p>
            
            <div className="bg-gray-900/80 rounded-xl p-4 text-left border border-gray-800 mb-6">
              <div className="grid grid-cols-3 gap-2 text-sm mb-2">
                <span className="text-gray-500">NIM</span>
                <span className="text-white col-span-2 font-medium">{form.nim}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm mb-2">
                <span className="text-gray-500">ID Jari</span>
                <span className="text-blue-400 font-mono font-bold col-span-2">#{fingerId}</span>
              </div>
            </div>

            <div className="space-y-3">
              <button onClick={handleEnterSystem} className="w-full btn-success">
                Masuk ke Sistem →
              </button>
              <button onClick={handleReset} className="w-full btn-ghost text-sm">
                Daftar Pengguna Lain
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
