import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  submitEnrollmentRequest,
  listenEnrollmentStatus,
  clearEnrollmentQueue,
  setAuthStatusIdle,
} from "../services/firebase";
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import ErrorRoundedIcon from '@mui/icons-material/ErrorRounded';
import HourglassEmptyRoundedIcon from '@mui/icons-material/HourglassEmptyRounded';
import PanToolRoundedIcon from '@mui/icons-material/PanToolRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';

const STATUS_INFO = {
  WAITING: { label: "Menunggu respons sensor...", icon: HourglassEmptyRoundedIcon, color: "text-polar-white", step: 2 },
  PLACE_FINGER_1: { label: "Tempelkan jari ke sensor (scan 1/2)", icon: PanToolRoundedIcon, color: "text-polar-white", step: 2 },
  LIFT_FINGER: { label: "Angkat jari dari sensor", icon: PanToolRoundedIcon, color: "text-polar-white", step: 2 },
  PLACE_FINGER_2: { label: "Tempelkan jari lagi (scan 2/2)", icon: PanToolRoundedIcon, color: "text-polar-white", step: 3 },
  PROCESSING: { label: "Menyimpan data sidik jari...", icon: SettingsRoundedIcon, color: "text-polar-white", step: 3 },
  SUCCESS: { label: "Pendaftaran berhasil!", icon: CheckCircleRoundedIcon, color: "text-neon-green", step: 4 },
  FAILED: { label: "Pendaftaran gagal. Silakan coba lagi.", icon: ErrorRoundedIcon, color: "text-red-400", step: 0 },
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
      <div className="w-full max-w-md relative z-10 animate-fadeInUp">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto bg-dark-carbon rounded-2xl flex items-center justify-center mb-4 border border-dark-carbon shadow-lg">
            <LockRoundedIcon sx={{ fontSize: 32, color: 'inherit' }} />
          </div>
          <h1 className="text-2xl font-bold text-polar-white tracking-tight">Daftar Sidik Jari</h1>
          <p className="text-ash-gray text-sm mt-1">Sistem Inventaris IoT</p>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-between mb-8 px-2 relative">
          <div className="absolute top-4 left-0 w-full h-0.5 bg-dark-carbon -z-10"></div>
          <div className="absolute top-4 left-0 h-0.5 bg-amber-glow transition-all duration-500 -z-10" style={{ width: `${((step - 1) / 3) * 100}%` }}></div>
          
          {STEPS.map((label, i) => {
            const idx = i + 1;
            const active = step === idx;
            const done = step > idx;
            return (
              <div key={i} className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300
                  ${done ? "bg-amber-glow text-midnight-void" : 
                    active ? "bg-amber-glow text-midnight-void border-2 border-polar-white" : 
                             "bg-dark-carbon text-ash-gray border border-dark-carbon"}`}>
                  {done ? <CheckCircleRoundedIcon sx={{ fontSize: 18 }} /> : idx}
                </div>
                <span className={`text-xs mt-2 font-medium ${active ? "text-polar-white" : done ? "text-slate-ui" : "text-ash-gray/70"}`}>
                  {label}
                </span>
              </div>
            );
          })}
        </div>

        {/* STEP 1: Form */}
        {step === 1 && (
          <form onSubmit={handleSubmit} className="glass-card p-6">
            <h2 className="text-polar-white font-semibold text-lg mb-5 flex items-center gap-2">
              <span className="w-1 h-5 bg-amber-glow rounded-full"></span> Data Pengguna
            </h2>

            <div className="space-y-4 mb-6">
              <div>
                <label className="text-ash-gray text-xs uppercase tracking-wider font-semibold mb-1 block">NIM</label>
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
                <label className="text-ash-gray text-xs uppercase tracking-wider font-semibold mb-1 block">Nama Lengkap</label>
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
                <label className="text-ash-gray text-xs uppercase tracking-wider font-semibold mb-1 block">Nomor Telepon</label>
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
                <label className="text-ash-gray text-xs uppercase tracking-wider font-semibold mb-1 block">Email</label>
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
                {loading ? "Memproses..." : <span className="flex items-center gap-2 justify-center">Lanjut Scan <ArrowForwardRoundedIcon sx={{ fontSize: 18 }} /></span>}
              </button>
            </div>
          </form>
        )}

        {/* STEP 2 & 3: Scan */}
        {(step === 2 || step === 3) && (
          <div className="glass-card p-8 text-center">
            <div className="relative w-32 h-32 mx-auto mb-8">
              <div className="absolute inset-0 rounded-full bg-amber-glow/20 animate-pulse-ring"></div>
              <div className="relative w-full h-full bg-dark-carbon rounded-full border-2 border-amber-glow/50 flex items-center justify-center z-10">
                {statusInfo?.icon ? <statusInfo.icon sx={{ fontSize: 50, color: 'inherit' }} /> : <PanToolRoundedIcon sx={{ fontSize: 50, color: 'inherit' }} />}
              </div>
            </div>

            <h3 className={`text-xl font-bold mb-2 ${statusInfo?.color || "text-polar-white"}`}>
              {statusInfo?.label || "Memproses..."}
            </h3>

            {enrollData?.message && (
              <p className="text-ash-gray mb-4">{enrollData.message}</p>
            )}

            <div className="bg-deep-space/50 rounded-lg p-3 inline-block border border-dark-carbon">
              <p className="text-ash-gray text-xs font-mono">Finger ID dialokasikan:</p>
              <p className="text-polar-white font-bold font-mono text-lg">#{fingerId}</p>
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
          <div className="glass-card p-8 text-center border-amber-glow/30 border">
            <div className="w-20 h-20 mx-auto bg-neon-green/15 rounded-full flex items-center justify-center mb-6">
              <CheckCircleRoundedIcon sx={{ fontSize: 48, color: '#00AC5C' }} />
            </div>
            <h2 className="text-2xl font-bold text-neon-green mb-2">Berhasil!</h2>
            <p className="text-slate-ui mb-6">Sidik jari <span className="text-polar-white font-semibold">{form.name}</span> telah tersimpan.</p>
            
            <div className="bg-deep-space/80 rounded-xl p-4 text-left border border-dark-carbon mb-6">
              <div className="grid grid-cols-3 gap-2 text-sm mb-2">
                <span className="text-ash-gray">NIM</span>
                <span className="text-polar-white col-span-2 font-medium">{form.nim}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm mb-2">
                <span className="text-ash-gray">ID Jari</span>
                <span className="text-polar-white font-mono font-bold col-span-2">#{fingerId}</span>
              </div>
            </div>

            <div className="space-y-3">
              <button onClick={handleEnterSystem} className="w-full btn-success">
                <span className="flex items-center justify-center gap-2">Masuk ke Sistem <ArrowForwardRoundedIcon sx={{ fontSize: 18 }} /></span>
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
