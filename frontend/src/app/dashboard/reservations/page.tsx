"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { reservationApi } from "@/lib/api/reservation";
import { vehicleApi } from "@/lib/api/vehicle";
import { vehmodelApi } from "@/lib/api/vehmodel";
import { makeApi } from "@/lib/api/make";
import type { ReservationPublic } from "@/types/reservation_types";
import type { VehiclePublic } from "@/types/vehicle_types";
import type { VehModelPublic } from "@/types/vehmodel_types";
import type { MakePublic } from "@/types/make_types";

interface EnrichedReservation {
  reservation: ReservationPublic;
  vehicle: VehiclePublic | null;
  makeName: string;
  modelName: string;
}

const STATE_LABELS: Record<string, string> = {
  created: "Utworzona",
  accepted: "Zaakceptowana",
  in_progress: "W trakcie",
  completed: "Zakończona",
  canceled: "Anulowana",
};

const STATE_COLORS: Record<string, { bg: string; text: string }> = {
  created: { bg: "var(--color-accent-glow)", text: "var(--color-accent-soft)" },
  accepted: { bg: "var(--color-success-soft)", text: "var(--color-success)" },
  in_progress: { bg: "rgba(96,165,250,0.15)", text: "#93c5fd" },
  completed: { bg: "rgba(168,162,158,0.15)", text: "#d6d3d1" },
  canceled: { bg: "var(--color-error-soft)", text: "var(--color-error)" },
};

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

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<EnrichedReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Get current user
      const currentUser = await api.getCurrentUser();
      if (!currentUser) throw new Error("Nie znaleziono użytkownika.");

      // 2. Fetch data filtered by user ID
      const [resResp, vehResp, modelResp, makeResp] = await Promise.all([
        reservationApi.getAll(0, 100, currentUser.id),
        vehicleApi.getAll(),
        vehmodelApi.getAll(),
        makeApi.getAll(),
      ]);

      const resData: ReservationPublic[] = resResp.data || [];
      const vehicles: VehiclePublic[] = vehResp.items || [];
      const models: VehModelPublic[] = (modelResp as unknown as { data: VehModelPublic[]; count: number }).data || [];
      const makes: MakePublic[] = (makeResp as unknown as { data: MakePublic[]; count: number }).data || [];

      const enriched: EnrichedReservation[] = resData
        .map((r) => {
          const vehicle = vehicles.find((v) => v.id === r.vehicle_id) || null;
          const model = vehicle ? models.find((m) => m.id === vehicle.veh_model_id) : null;
          const make = model ? makes.find((mk) => mk.id === model.make_id) : null;

          return {
            reservation: r,
            vehicle,
            makeName: make?.name || "Nieznana marka",
            modelName: model?.name || "Nieznany model",
          };
        })
        .sort(
          (a, b) =>
            new Date(a.reservation.date_start_planned).getTime() -
            new Date(b.reservation.date_end_planned).getTime(),
        );

      setReservations(enriched);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się pobrać rezerwacji.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString("pl-PL", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  const formatDateShort = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString("pl-PL", {
        day: "numeric",
        month: "short",
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1
            className="text-2xl sm:text-3xl font-bold tracking-tight"
            style={{
              background: "linear-gradient(135deg, var(--color-text-primary) 0%, var(--color-accent-soft) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Twoje rezerwacje
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
            Historia i status wszystkich rezerwacji
          </p>
        </div>
        <Link
          href="/dashboard"
          className="text-sm font-medium hover:underline inline-flex items-center gap-1 shrink-0"
          style={{ color: "var(--color-accent-soft)" }}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Powrót do menu
        </Link>
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-surface rounded-2xl overflow-hidden">
              <div className="skeleton h-36 w-full" />
              <div className="p-4 space-y-2">
                <div className="skeleton h-4 w-16" />
                <div className="skeleton h-5 w-32" />
                <div className="skeleton h-4 w-44" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="glass-surface rounded-2xl p-12 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full" style={{ background: "var(--color-error-soft)" }}>
              <svg className="h-6 w-6" style={{ color: "var(--color-error)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <p className="font-medium" style={{ color: "var(--color-error)" }}>Błąd ładowania</p>
            <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>{error}</p>
            <button type="button" onClick={fetchData} className="btn-ghost mt-2">Spróbuj ponownie</button>
          </div>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && reservations.length === 0 && (
        <div className="glass-surface rounded-2xl p-12 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full" style={{ background: "var(--color-accent-glow)" }}>
              <svg className="h-6 w-6" style={{ color: "var(--color-accent-soft)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <p className="font-medium" style={{ color: "var(--color-text-secondary)" }}>Brak rezerwacji</p>
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              Nie masz jeszcze żadnych rezerwacji. Utwórz pierwszą, aby rozpocząć.
            </p>
            <Link href="/dashboard/vehicles" className="btn-primary mt-2">
              Przeglądaj pojazdy
            </Link>
          </div>
        </div>
      )}

      {/* Reservation Cards */}
      {!loading && !error && reservations.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {reservations.map((er, index) => {
            const stateStyle = STATE_COLORS[er.reservation.state] || STATE_COLORS.created;
            const stateLabel = STATE_LABELS[er.reservation.state] || er.reservation.state;

            return (
              <div
                key={er.reservation.id}
                className="glass-surface rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1"
                style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }}
              >
                {/* Car image placeholder */}
                <div
                  className={`h-32 bg-gradient-to-br ${carGradient(index)} relative flex items-center justify-center overflow-hidden`}
                >
                  <svg className="h-16 w-24 opacity-25" viewBox="0 0 112 80" fill="none">
                    <rect x="8" y="24" width="96" height="28" rx="6" fill="white" />
                    <path d="M30 24V16C30 12 34 8 40 8H72C78 8 82 12 82 16V24" fill="white" />
                    <rect x="60" y="14" width="30" height="14" rx="4" fill="white" opacity="0.6" />
                    <circle cx="32" cy="56" r="10" fill="white" />
                    <circle cx="80" cy="56" r="10" fill="white" />
                  </svg>

                  {/* Date range overlay */}
                  <div className="absolute bottom-0 left-0 right-0 bg-black/40 backdrop-blur-sm px-3 py-2">
                    <p className="text-xs font-medium text-white/90 text-center">
                      {formatDateShort(er.reservation.date_start_planned)} –{" "}
                      {formatDateShort(er.reservation.date_end_planned)}
                    </p>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h3 className="font-bold text-sm truncate" style={{ color: "var(--color-text-primary)" }}>
                        {er.makeName}
                      </h3>
                      <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                        {er.modelName}
                      </p>
                    </div>
                    <span
                      className="badge shrink-0"
                      style={{ background: stateStyle.bg, color: stateStyle.text }}
                    >
                      {stateLabel}
                    </span>
                  </div>

                  {er.vehicle?.description && (
                    <p className="text-xs mt-1 truncate" style={{ color: "var(--color-text-muted)" }}>
                      {er.vehicle.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between mt-3 pt-3 border-t text-xs" style={{ borderColor: "var(--color-border)" }}>
                    <span style={{ color: "var(--color-text-muted)" }}>
                      Cel:{" "}
                      <span style={{ color: "var(--color-text-secondary)" }}>
                        {er.reservation.purpose === "business" ? "Służbowy" : "Prywatny"}
                      </span>
                    </span>
                    <span style={{ color: "var(--color-text-secondary)" }}>
                      {er.reservation.price > 0 ? `${er.reservation.price.toFixed(2)} PLN` : "Bezpłatnie"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
