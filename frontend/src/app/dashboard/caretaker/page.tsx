"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { caretakerPanelApi } from "@/lib/api/caretaker_panel";
import type { VehicleWithMake } from "@/types/caretaker_panel_types";

const CAR_COLORS = [
  "from-violet-600 to-purple-500",
  "from-emerald-600 to-teal-500",
  "from-amber-500 to-orange-600",
  "from-blue-600 to-cyan-500",
  "from-rose-600 to-pink-500",
  "from-indigo-600 to-blue-500",
  "from-teal-600 to-green-500",
  "from-fuchsia-600 to-violet-500",
];

function carGradient(index: number) {
  return CAR_COLORS[index % CAR_COLORS.length];
}

export default function CaretakerVehiclesPage() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<VehicleWithMake[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accessChecked, setAccessChecked] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await caretakerPanelApi.getMyVehicles();
      setVehicles(data);
      if (data.length === 0) {
        router.replace("/dashboard");
        return;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się pobrać pojazdów.");
    } finally {
      setLoading(false);
      setAccessChecked(true);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="space-y-10 relative z-10 py-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <nav className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-purple-400/80">
            <Link href="/dashboard" className="hover:text-purple-300 transition-colors">
              System
            </Link>
            <span className="w-1 h-1 rounded-full bg-white/20" />
            <span className="text-white/40">Panel Opiekuna</span>
          </nav>
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tighter">
            Twoje{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
              Pojazdy
            </span>
          </h1>
          <p className="text-gray-400 text-sm max-w-md font-medium leading-relaxed">
            Wybierz pojazd, którym zarządzasz, aby przeglądać serwisy, rezerwacje i eksploatacje.
          </p>
        </div>
      </div>

      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* Loading / access check */}
      {(loading || !accessChecked) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass-surface rounded-3xl overflow-hidden animate-pulse">
              <div className="h-44 bg-white/5" />
              <div className="p-6 space-y-3">
                <div className="h-5 w-2/3 bg-white/5 rounded-lg" />
                <div className="h-3 w-1/3 bg-white/5 rounded-lg" />
                <div className="h-3 w-1/2 bg-white/5 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="glass-surface rounded-3xl p-12 text-center space-y-4">
          <svg className="w-12 h-12 mx-auto text-red-400/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <p className="text-red-400 font-medium">{error}</p>
          <button
            type="button"
            onClick={fetchData}
            className="px-6 py-3 text-xs font-black uppercase tracking-widest rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
          >
            Spróbuj ponownie
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && vehicles.length === 0 && (
        <div className="glass-surface rounded-3xl p-12 text-center space-y-4">
          <svg className="w-12 h-12 mx-auto text-white/10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
          </svg>
          <p className="text-gray-400 font-medium text-lg">Nie jesteś opiekunem żadnego pojazdu.</p>
          <p className="text-gray-500 text-sm">
            Skontaktuj się z administratorem, aby przypisać Cię jako opiekuna pojazdu.
          </p>
        </div>
      )}

      {/* Vehicle cards */}
      {!loading && !error && vehicles.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {vehicles.map((v, i) => (
            <Link
              key={v.id}
              href={`/dashboard/caretaker/${v.id}`}
              className="glass-elevated rounded-3xl overflow-hidden group transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.5)] border-white/5 hover:border-cyan-500/30"
            >
              {/* Top visual */}
              <div className="relative h-44 flex items-center justify-center bg-black/40 overflow-hidden border-b border-white/5">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.1)_0%,transparent_70%)]" />
                <div className={`absolute inset-0 bg-gradient-to-br ${carGradient(i)} opacity-10 group-hover:opacity-20 transition-opacity duration-500`} />
                <svg className="w-24 h-24 text-white/10 group-hover:text-cyan-500/20 transition-colors duration-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" />
                </svg>
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 bg-white/5 backdrop-blur-md rounded-lg border border-white/10 text-[9px] font-black uppercase tracking-widest text-white/40">
                    S/N: {String(v.id).padStart(4, "0")}
                  </span>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <h3 className="text-xl font-black text-white group-hover:text-cyan-400 transition-colors tracking-tight">
                    {v.make_name}
                  </h3>
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">
                    {v.model_name}
                  </p>
                  <p className="text-cyan-400/90 text-[11px] font-semibold mt-1 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    {v.version_name}
                  </p>
                </div>

                <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black uppercase tracking-widest text-white/30">Status</span>
                    <span className="text-xs font-bold text-emerald-400">Aktywny</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-cyan-400 group-hover:text-white transition-all">
                    <span>Zarządzaj</span>
                    <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
