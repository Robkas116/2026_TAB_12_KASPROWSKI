"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { reservationApi } from "@/lib/api/reservation";
import { vehicleApi } from "@/lib/api/vehicle";
import { vehmodelApi } from "@/lib/api/vehmodel";
import { makeApi } from "@/lib/api/make";
import { workerApi } from "@/lib/api/worker";
import { useToast } from "@/components/ui/Toast";
import type { ReservationPublic } from "@/types/reservation_types";
import type { VehiclePublic } from "@/types/vehicle_types";
import type { VehModelPublic } from "@/types/vehmodel_types";
import type { MakePublic } from "@/types/make_types";
import type { WorkerPublic } from "@/types/worker_types";

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

const FIELD_LABELS: Record<string, string> = {
  date_start_planned: "Data rozpoczęcia (planowana)",
  date_end_planned: "Data zakończenia (planowana)",
  date_start: "Data rozpoczęcia",
  date_end: "Data zakończenia",
  price: "Cena (PLN)",
  purpose: "Cel rezerwacji",
  vehicle_id: "Pojazd",
  worker_id: "Pracownik",
  distance: "Dystans (km)",
  state: "Status",
  state_start: "Data zmiany statusu (początek)",
  state_end: "Data zmiany statusu (koniec)",
  id: "ID",
};

const FIELD_ORDER = [
  "id",
  "date_start_planned",
  "date_end_planned",
  "date_start",
  "date_end",
  "price",
  "purpose",
  "vehicle_id",
  "worker_id",
  "distance",
  "state",
  "state_start",
  "state_end",
];

const PURPOSE_OPTIONS = [
  { value: "business", label: "Służbowy" },
  { value: "private", label: "Prywatny" },
];

const HIDDEN_FIELDS = new Set(["id", "state", "state_start", "state_end", "date_start", "date_end", "vehicle_id", "worker_id", "distance"]);
const EDITABLE_FIELDS = new Set(["date_start_planned", "date_end_planned", "price", "purpose", "vehicle_id", "worker_id"]);

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<EnrichedReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [panelReservation, setPanelReservation] = useState<EnrichedReservation | null>(null);
  const [formData, setFormData] = useState<Record<string, unknown>>({});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const currentUser = await api.getCurrentUser();
      if (!currentUser) throw new Error("Nie znaleziono użytkownika.");

      const [resResp, vehResp, modelResp, makeResp, workerResp] = await Promise.all([
        reservationApi.getAll(0, 100, currentUser.id),
        vehicleApi.getAll(),
        vehmodelApi.getAll(),
        makeApi.getAll(),
        workerApi.getAll(),
      ]);

      const resData: ReservationPublic[] = resResp.data || [];
      const vehData: VehiclePublic[] = vehResp.items || [];
      const models: VehModelPublic[] = (modelResp as unknown as { data: VehModelPublic[]; count: number }).data || [];
      const makes: MakePublic[] = (makeResp as unknown as { data: MakePublic[]; count: number }).data || [];
      
      const enriched: EnrichedReservation[] = resData
        .map((r) => {
          const vehicle = vehData.find((v) => v.id === r.vehicle_id) || null;
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

  const openPanel = (er: EnrichedReservation) => {
    setPanelReservation(er);
    const data: Record<string, unknown> = {};
    FIELD_ORDER.forEach((key) => {
      const value = er.reservation[key as keyof ReservationPublic];
      if (typeof value === "string" && (key.includes("date") || key.includes("planned"))) {
        const d = new Date(value);
        if (!isNaN(d.getTime())) {
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, "0");
          const day = String(d.getDate()).padStart(2, "0");
          const hours = String(d.getHours()).padStart(2, "0");
          const minutes = String(d.getMinutes()).padStart(2, "0");
          data[key] = `${year}-${month}-${day}T${hours}:${minutes}`;
        } else {
          data[key] = value; 
        }
      } else {
        data[key] = value;
      }
    });
    setFormData(data);
    setFormErrors({});
    setShowDeleteConfirm(false);
  };

  const closePanel = () => {
    setPanelReservation(null);
    setFormData({});
    setFormErrors({});
    setShowDeleteConfirm(false);
  };

  useEffect(() => {
    if (!panelReservation) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closePanel();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [panelReservation]);

  const handleFieldChange = (key: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (formErrors[key]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!panelReservation) return;

    const errors: Record<string, string> = {};

    if (!formData.date_start_planned) errors.date_start_planned = "Data rozpoczęcia jest wymagana";
    if (!formData.date_end_planned) errors.date_end_planned = "Data zakończenia jest wymagana";
    if (formData.price !== null && formData.price !== undefined && typeof formData.price === "string" && formData.price === "") {
      errors.price = "Cena jest wymagana";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const updateData: Record<string, unknown> = {};
      EDITABLE_FIELDS.forEach((key) => {
        let value = formData[key];
        if (key.includes("date") && value) {
          value = new Date(value as string).toISOString();
        }
        if (key === "price" && value) {
          value = parseFloat(value as string);
        }
        if (key.endsWith("_id") && value) {
          value = parseInt(value as string, 10);
        }
        updateData[key] = value;
      });

      await reservationApi.update(panelReservation.reservation.id, updateData);
      toast("success", "Rezerwacja została zaktualizowana.");
      closePanel();
      fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Błąd aktualizacji rezerwacji.";
      toast("error", msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!panelReservation) return;
    setIsDeleting(true);
    try {
      await reservationApi.delete(panelReservation.reservation.id);
      toast("success", "Rezerwacja została usunięta.");
      closePanel();
      fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Błąd usuwania rezerwacji.";
      toast("error", msg);
    } finally {
      setIsDeleting(false);
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
    <div className="space-y-6 relative">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {reservations.map((er, index) => {
            const stateStyle = STATE_COLORS[er.reservation.state] || STATE_COLORS.created;
            const stateLabel = STATE_LABELS[er.reservation.state] || er.reservation.state;

            return (
              <button
                key={er.reservation.id}
                type="button"
                onClick={() => openPanel(er)}
                className="glass-surface rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 text-left"
                style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }}
              >
                <div className={`h-32 bg-gradient-to-br ${carGradient(index)} relative flex items-center justify-center overflow-hidden`}>
                  <svg className="h-16 w-24 opacity-25" viewBox="0 0 112 80" fill="none">
                    <rect x="8" y="24" width="96" height="28" rx="6" fill="white" />
                    <path d="M30 24V16C30 12 34 8 40 8H72C78 8 82 12 82 16V24" fill="white" />
                    <rect x="60" y="14" width="30" height="14" rx="4" fill="white" opacity="0.6" />
                    <circle cx="32" cy="56" r="10" fill="white" />
                    <circle cx="80" cy="56" r="10" fill="white" />
                  </svg>
                  <div className="absolute bottom-0 left-0 right-0 bg-black/40 backdrop-blur-sm px-3 py-2">
                    <p className="text-xs font-medium text-white/90 text-center">
                      {formatDateShort(er.reservation.date_start_planned)} – {formatDateShort(er.reservation.date_end_planned)}
                    </p>
                  </div>
                </div>

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
                    <span className="badge shrink-0" style={{ background: stateStyle.bg, color: stateStyle.text }}>
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
              </button>
            );
          })}
        </div>
      )}

      {/* --- PANEL BOCZNY (SZCZEGÓŁY / EDYCJA) --- */}
      {panelReservation && (
        <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="Szczegóły rezerwacji">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 modal-backdrop" 
            style={{ background: "rgba(0,0,0,0.7)" }}
            onClick={closePanel}
            aria-hidden="true"
          />
          
          {/* Kontener panelu */}
          <div 
            className="relative z-10 w-full md:w-[32rem] h-full overflow-y-auto shadow-2xl animate-slide-in flex flex-col"
            style={{ 
              background: "var(--color-surface)",
              borderLeft: "1px solid var(--color-border)"
            }}
          >
            {/* Nagłówek panelu */}
            <div 
              className="sticky top-0 z-10 flex justify-between items-start p-6 border-b shrink-0" 
              style={{ 
                background: "var(--color-surface)",
                borderColor: "var(--color-border)" 
              }}
            >
              <div>
                <p className="text-xs uppercase tracking-wider font-semibold" style={{ color: "var(--color-accent-soft)" }}>
                  {panelReservation.makeName}
                </p>
                <h2 className="text-xl font-bold mt-0.5" style={{ color: "var(--color-text-primary)" }}>
                  {panelReservation.modelName}
                </h2>
                <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
                  ID Rezerwacji: #{panelReservation.reservation.id}
                </p>
              </div>
              <button 
                onClick={closePanel} 
                className="p-2 rounded-lg transition-colors hover:bg-white/5"
                style={{ color: "var(--color-text-muted)" }}
                aria-label="Zamknij panel"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Formularz w panelu */}
            <div className="p-6 flex-1 overflow-y-auto space-y-6">
              <form id="reservation-form" onSubmit={handleSubmit} className="space-y-5">
                {FIELD_ORDER.map((key) => {
                  if (HIDDEN_FIELDS.has(key)) return null;

                  const isEditable = EDITABLE_FIELDS.has(key);
                  const label = FIELD_LABELS[key] || key;
                  const value = formData[key] !== undefined && formData[key] !== null ? formData[key] : "";
                  const error = formErrors[key];

                  return (
                    <div key={key}>
                      <label 
                        className="block text-xs font-semibold uppercase tracking-wider mb-1.5" 
                        style={{ color: "var(--color-text-muted)" }}
                      >
                        {label}
                      </label>
                      {isEditable ? (
                        <div>
                          {key === "purpose" ? (
                            <>
                              <select
                                className={`input-dark w-full text-sm ${error ? "input-error" : ""}`}
                                value={String(value)}
                                onChange={(e) => handleFieldChange(key, e.target.value)}
                              >
                                {PURPOSE_OPTIONS.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                              {error && (
                                <p className="field-error mt-1">{error}</p>
                              )}
                            </>
                          ) : (
                            <>
                              <input
                                type={key.includes("date") || key.includes("planned") ? "datetime-local" : key === "price" || key === "distance" ? "number" : "text"}
                                step={key === "price" ? "0.01" : undefined}
                                className={`input-dark w-full text-sm ${error ? "input-error" : ""}`}
                                value={value as string | number}
                                onChange={(e) => handleFieldChange(key, e.target.value)}
                              />
                              {error && (
                                <p className="field-error mt-1">{error}</p>
                              )}
                            </>
                          )}
                        </div>
                      ) : (
                        <div 
                          className="rounded-xl p-3 text-sm font-medium" 
                          style={{ 
                            background: "var(--color-elevated)", 
                            border: "1px solid var(--color-border)",
                            color: "var(--color-text-primary)" 
                          }}
                        >
                          {String(value || "Brak danych")}
                        </div>
                      )}
                    </div>
                  );
                })}
              </form>
            </div>

            {/* Stopka z przyciskami (Zapisz / Usuń) */}
            <div className="p-6 border-t flex flex-col gap-3 shrink-0" style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}>
              <button 
                type="submit" 
                form="reservation-form" 
                disabled={isSubmitting} 
                className="btn-primary w-full"
              >
                {isSubmitting ? (
                  <>
                    <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin mr-2" />
                    Zapisywanie...
                  </>
                ) : "Zapisz zmiany"}
              </button>
              
{!showDeleteConfirm ? (
                <button 
                  type="button" 
                  onClick={() => setShowDeleteConfirm(true)} 
                  className="w-full py-2 px-4 rounded-md font-medium transition-colors text-sm bg-red-600 text-white hover:bg-red-700"
                >
                  Usuń rezerwację
                </button>
              ) : (
                <div 
                  className="p-4 rounded-xl border" 
                  style={{ borderColor: "var(--color-error)", background: "var(--color-error-soft)" }}
                >
                  <p className="text-sm text-center mb-3 font-medium" style={{ color: "var(--color-error)" }}>
                    Czy na pewno chcesz usunąć tę rezerwację?
                  </p>
                  <div className="flex gap-2">
                    <button 
                      type="button" 
                      onClick={() => setShowDeleteConfirm(false)} 
                      className="flex-1 py-1.5 px-3 rounded-lg text-sm bg-black text-white hover:bg-gray-800 transition-colors" 
                    >
                      Anuluj
                    </button>
                    <button 
                      type="button" 
                      onClick={handleDelete} 
                      disabled={isDeleting} 
                      className="flex-1 py-1.5 px-3 rounded-lg text-sm text-white transition-colors" 
                      style={{ background: "var(--color-error)" }}
                    >
                      {isDeleting ? "Usuwanie..." : "Tak, usuń"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* --- KONIEC PANELU BOCZNEGO --- */}
    </div>
  );
}