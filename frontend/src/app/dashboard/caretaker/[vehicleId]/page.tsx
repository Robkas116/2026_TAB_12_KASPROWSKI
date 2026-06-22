"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { caretakerPanelApi } from "@/lib/api/caretaker_panel";
import { useToast } from "@/components/ui/Toast";
import ServiceSection from "@/components/caretaker/ServiceSection";
import ReservationsSection from "@/components/caretaker/ReservationsSection";
import ExploitationSection from "@/components/caretaker/ExploitationSection";
import type { VehicleWithMake, PanelReservationPublic, PanelExploitationPublic } from "@/types/caretaker_panel_types";

type Tab = "services" | "reservations" | "exploitations";

export default function CaretakerVehiclePage() {
  const params = useParams();
  const router = useRouter();
  const vehicleId = Number(params.vehicleId);
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<Tab>("services");
  const [vehicle, setVehicle] = useState<VehicleWithMake | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data for each tab
  const [reservations, setReservations] = useState<PanelReservationPublic[]>([]);
  const [exploitations, setExploitations] = useState<PanelExploitationPublic[]>([]);

  const fetchVehicle = useCallback(async () => {
    try {
      const vehicles = await caretakerPanelApi.getMyVehicles();
      const v = vehicles.find((veh) => veh.id === vehicleId);
      if (!v) {
        router.replace("/dashboard/caretaker");
        return;
      }
      setVehicle(v);
    } catch {
      router.replace("/dashboard/caretaker");
    }
  }, [vehicleId, router]);

  const fetchReservations = useCallback(async () => {
    try {
      const data = await caretakerPanelApi.getReservations(vehicleId);
      setReservations(data);
    } catch {
      // toast handled in sections
    }
  }, [vehicleId]);

  const fetchExploitations = useCallback(async () => {
    try {
      const data = await caretakerPanelApi.getExploitations(vehicleId);
      setExploitations(data);
    } catch {
      // toast handled in sections
    }
  }, [vehicleId]);



  useEffect(() => {
    setLoading(true);
    Promise.all([fetchVehicle(), fetchReservations(), fetchExploitations()])
      .finally(() => setLoading(false));
  }, [fetchVehicle, fetchReservations, fetchExploitations]);

  const refreshData = useCallback(() => {
    fetchReservations();
    fetchExploitations();
  }, [fetchReservations, fetchExploitations]);

  const tabs: { key: Tab; label: string }[] = [
    { key: "services", label: "Serwisy" },
    { key: "reservations", label: "Rezerwacje" },
    { key: "exploitations", label: "Eksploatacje" },
  ];

  // Loading
  if (loading) {
    return (
      <div className="space-y-10 relative z-10 py-4">
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-48 bg-white/5 rounded-lg" />
          <div className="h-10 w-96 bg-white/5 rounded-lg" />
        </div>
        <div className="glass-surface rounded-3xl p-12 text-center">
          <p className="text-gray-400">Ładowanie...</p>
        </div>
      </div>
    );
  }

  // Error
  if (error || !vehicle) {
    return (
      <div className="space-y-10 relative z-10 py-4">
        <div className="glass-surface rounded-3xl p-12 text-center space-y-4">
          <svg className="w-12 h-12 mx-auto text-red-400/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <p className="text-red-400 font-medium">{error || "Nie znaleziono pojazdu."}</p>
          <Link
            href="/dashboard/caretaker"
            className="inline-block px-6 py-3 text-xs font-black uppercase tracking-widest rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
          >
            Powrót do listy pojazdów
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 relative z-10 py-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <nav className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-purple-400/80">
            <Link href="/dashboard" className="hover:text-purple-300 transition-colors">
              System
            </Link>
            <span className="w-1 h-1 rounded-full bg-white/20" />
            <Link href="/dashboard/caretaker" className="hover:text-purple-300 transition-colors">
              Panel Opiekuna
            </Link>
            <span className="w-1 h-1 rounded-full bg-white/20" />
            <span className="text-white/40">{vehicle.make_name} {vehicle.model_name}</span>
          </nav>
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tighter">
            {vehicle.make_name}{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
              {vehicle.model_name}
            </span>
          </h1>
          <p className="text-gray-400 text-sm max-w-md font-medium leading-relaxed">
            Zarządzaj serwisami, rezerwacjami i eksploatacją pojazdu.
          </p>
        </div>
        <Link
          href="/dashboard/caretaker"
          className="px-6 py-3 border border-white/5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white/5 transition-all flex items-center gap-2 text-white/60 hover:text-white"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Powrót
        </Link>
      </div>

      {/* Vehicle info bar */}
      <div className="glass-surface rounded-2xl p-4 flex flex-wrap items-center gap-4 border border-white/5">
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-black uppercase tracking-widest text-white/30">Wersja:</span>
          <span className="text-xs font-bold text-cyan-400">{vehicle.version_name}</span>
        </div>
        <div className="w-px h-4 bg-white/10" />
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-black uppercase tracking-widest text-white/30">ID pojazdu:</span>
          <span className="text-xs font-bold text-gray-300">#{vehicle.id}</span>
        </div>
        <div className="w-px h-4 bg-white/10" />
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-xs font-bold text-emerald-400">Aktywny</span>
        </div>
      </div>

      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* Tab Navigation */}
      <div className="flex gap-1 border-b border-white/5">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`relative px-6 py-3 text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab.key
              ? "text-cyan-400"
              : "text-white/30 hover:text-white/60"
              }`}
          >
            {tab.label}
            {activeTab === tab.key && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "services" && (
        <ServiceSection vehicleId={vehicleId} toast={toast} onRefresh={refreshData} />
      )}
      {activeTab === "reservations" && (
        <ReservationsSection
          vehicleId={vehicleId}
          reservations={reservations}
          onRefresh={refreshData}
          toast={toast}
        />
      )}
      {activeTab === "exploitations" && (
        <ExploitationSection
          vehicleId={vehicleId}
          exploitations={exploitations}
          onRefresh={refreshData}
          toast={toast}
        />
      )}
    </div>
  );
}
