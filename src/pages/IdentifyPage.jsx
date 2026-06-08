// src/pages/IdentifyPage.jsx
// Monitor realtime siapa yang sedang terautentikasi via sidik jari

import { useState, useEffect } from "react";
import { listenAuthStatus } from "../services/firebase";
import FingerprintRoundedIcon from '@mui/icons-material/FingerprintRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';

export default function IdentifyPage() {
  const [authData, setAuthData] = useState(null);
  const [history,  setHistory]  = useState([]);

  useEffect(() => {
    const unsub = listenAuthStatus((data) => {
      setAuthData(data);
      // Simpan riwayat lokal jika status AUTHORIZED
      if (data?.status === "AUTHORIZED" && data?.user) {
        setHistory((prev) => [
          { user: data.user, finger_id: data.finger_id, time: new Date().toLocaleTimeString("id-ID") },
          ...prev.slice(0, 9), // simpan 10 terakhir
        ]);
      }
    });
    return () => unsub();
  }, []);

  const isAuthorized = authData?.status === "AUTHORIZED";

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-lg mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-blue-500 mb-3"><FingerprintRoundedIcon sx={{ fontSize: 56 }} /></div>
          <h1 className="text-2xl font-bold text-gray-900">Monitor Identifikasi</h1>
          <p className="text-gray-600 text-sm mt-1">Status autentikasi Node 0 — realtime</p>
        </div>

        {/* Status Card */}
        <div className={`rounded-2xl p-6 mb-6 border-2 transition-all duration-500
          ${isAuthorized
            ? "bg-green-50 border-green-500 shadow-green-200/50 shadow-xl"
            : "bg-white  border-gray-300"}`}>

          <div className="flex items-center gap-4">
            {/* Indicator dot */}
            <div className={`w-4 h-4 rounded-full ${isAuthorized ? "bg-green-400 animate-pulse" : "bg-gray-600"}`} />
            <div>
              <p className={`text-sm font-medium ${isAuthorized ? "text-green-400" : "text-gray-500"}`}>
                {isAuthorized ? "TERAUTENTIKASI" : "MENUNGGU SCAN"}
              </p>
              <p className="text-gray-900 text-xl font-bold mt-0.5">
                {isAuthorized ? authData.user : "—"}
              </p>
            </div>

            {isAuthorized && (
              <div className="ml-auto text-right">
                <p className="text-gray-600 text-xs">Finger ID</p>
                <p className="text-blue-400 font-mono font-bold">#{authData.finger_id}</p>
              </div>
            )}
          </div>

          {/* Mode indicator */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-gray-500 text-xs">
              Mode: <span className="text-gray-300 font-mono">{authData?.mode || "—"}</span>
              &nbsp;|&nbsp;
              Status: <span className="text-gray-300 font-mono">{authData?.status || "—"}</span>
            </p>
          </div>
        </div>

        {/* Riwayat Akses */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200">
          <h2 className="text-gray-900 font-semibold mb-4">Riwayat Akses (sesi ini)</h2>
          {history.length === 0 ? (
            <p className="text-gray-600 text-sm text-center py-4">Belum ada aktivitas</p>
          ) : (
            <ul className="space-y-2">
              {history.map((item, i) => (
                <li key={i} className="flex items-center justify-between bg-gray-100
                                       rounded-lg px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    <CheckCircleRoundedIcon sx={{ fontSize: 20, color: '#4ade80' }} />
                    <div>
                      <p className="text-gray-900 text-sm font-medium">{item.user}</p>
                      <p className="text-gray-500 text-xs">ID #{item.finger_id}</p>
                    </div>
                  </div>
                  <span className="text-gray-500 text-xs font-mono">{item.time}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
