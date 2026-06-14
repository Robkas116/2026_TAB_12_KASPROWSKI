"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
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

const STATE_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  created: { bg: "rgba(139, 92, 246, 0.2)", text: "#c4b5fd", dot: "#8b5cf6" },
  accepted: { bg: "rgba(52, 211, 153, 0.2)", text: "#34d399", dot: "#10b981" },
  in_progress: { bg: "rgba(96,165,250,0.2)", text: "#93c5fd", dot: "#3b82f6" },
  completed: { bg: "rgba(168,162,158,0.2)", text: "#d6d3d1", dot: "#78716c" },
  canceled: { bg: "rgba(248,113,113,0.2)", text: "#f87171", dot: "#ef4444" },
};

const CAR_IMAGES = [
  "/assets/cars/car-sedan.png",
  "/assets/cars/car-suv.png",
  "/assets/cars/car-compact.png",
  "/assets/cars/car-van.jpg",
];

function getCarImage(index: number) {
  return CAR_IMAGES[index % CAR_IMAGES.length];
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

const MONTHS_PL = [
  "Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec",
  "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień",
];
const DAYS_PL = ["Nd", "Pn", "Wt", "Śr", "Cz", "Pt", "So"];

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function firstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}
function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function dateFromYMD(y: number, m: number, d: number) {
  return new Date(y, m, d);
}

function normalizeDayStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

function normalizeDayEnd(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

function doesRangeOverlap(start: Date, end: Date, reservations: ReservationPublic[]) {
  if (end <= start) return false;
  const normalizedStart = normalizeDayStart(start);
  const normalizedEnd = normalizeDayEnd(end);
  return reservations.some((reservation) => {
    const reservationStart = normalizeDayStart(new Date(reservation.date_start_planned));
    const reservationEnd = normalizeDayEnd(new Date(reservation.date_end_planned));
    return normalizedStart <= reservationEnd && normalizedEnd >= reservationStart;
  });
}

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<EnrichedReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [panelReservation, setPanelReservation] = useState<EnrichedReservation | null>(null);
  const [formData, setFormData] = useState<Record<string, unknown>>({});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const [existingReservations, setExistingReservations] = useState<ReservationPublic[]>([]);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [selectedStart, setSelectedStart] = useState<Date | null>(null);
  const [selectedEnd, setSelectedEnd] = useState<Date | null>(null);

  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const currentUser = await api.getCurrentUser();
      if (!currentUser) throw new Error("Nie znaleziono użytkownika.");

      const [resResp, vehResp, modelResp, makeResp] = await Promise.all([
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

  const openPanel = async (er: EnrichedReservation) => {
    setPanelReservation(er);
    const data: Record<string, unknown> = {};
    FIELD_ORDER.forEach((key) => {
      data[key] = er.reservation[key as keyof ReservationPublic];
    });
    setFormData(data);
    setShowDeleteConfirm(false);

    const s = new Date(er.reservation.date_start_planned);
    const e = new Date(er.reservation.date_end_planned);
    setSelectedStart(s);
    setSelectedEnd(e);
    setCalendarMonth({ year: s.getFullYear(), month: s.getMonth() });

    try {
      const resResp = await reservationApi.getAll();
      const all = resResp.data || [];
      setExistingReservations(
        all.filter((r) => r.vehicle_id === er.reservation.vehicle_id && r.id !== er.reservation.id && r.state !== "canceled")
      );
    } catch {
      setExistingReservations([]);
    }
  };

  const closePanel = () => {
    setPanelReservation(null);
    setFormData({});
    setShowDeleteConfirm(false);
    setSelectedStart(null);
    setSelectedEnd(null);
  };

  const blockedDates = useMemo(() => {
    const set = new Set<string>();
    for (const r of existingReservations) {
      const start = new Date(r.date_start_planned);
      const end = new Date(r.date_end_planned);
      const cur = new Date(start);
      while (cur <= end) {
        set.add(`${cur.getFullYear()}-${cur.getMonth()}-${cur.getDate()}`);
        cur.setDate(cur.getDate() + 1);
      }
    }
    return set;
  }, [existingReservations]);

  const handleCalendarDayClick = (day: number) => {
    const d = dateFromYMD(calendarMonth.year, calendarMonth.month, day);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (blockedDates.has(key)) return;

    if (!selectedStart || (selectedStart && selectedEnd)) {
      setSelectedStart(d);
      setSelectedEnd(null);
    } else {
      if (d < selectedStart) {
        setSelectedStart(d);
      } else {
        setSelectedEnd(d);
      }
    }
  };

  const prevMonth = () => {
    setCalendarMonth((p) => p.month === 0 ? { year: p.year - 1, month: 11 } : { year: p.year, month: p.month - 1 });
  };
  const nextMonth = () => {
    setCalendarMonth((p) => p.month === 11 ? { year: p.year + 1, month: 0 } : { year: p.year, month: p.month + 1 });
  };

  const renderCalendar = () => {
    const { year, month } = calendarMonth;
    const totalDays = daysInMonth(year, month);
    const fdom = firstDayOfMonth(year, month); 
    const startOffset = fdom === 0 ? 6 : fdom - 1; 

    const cells: React.ReactNode[] = [];
    for (let i = 0; i < startOffset; i++) {
      cells.push(<div key={`empty-${i}`} />);
    }
    for (let d = 1; d <= totalDays; d++) {
      const date = dateFromYMD(year, month, d);
      const key = `${year}-${month}-${d}`;
      const blocked = blockedDates.has(key);
      const selected = (selectedStart && sameDay(date, selectedStart)) || (selectedEnd && sameDay(date, selectedEnd));
      const inRange = selectedStart && selectedEnd && date > selectedStart && date < selectedEnd;

      cells.push(
        <button
          key={d}
          type="button"
          disabled={blocked}
          onClick={() => handleCalendarDayClick(d)}
          className={`h-9 w-9 rounded-lg text-xs font-medium transition-all flex items-center justify-center
            ${blocked ? "line-through cursor-not-allowed text-white/10" : "hover:bg-white/10 cursor-pointer text-white/70"}
            ${selected ? "!text-white !bg-purple-500 shadow-[0_0_15px_rgba(139,92,246,0.5)]" : ""}
            ${inRange ? "bg-purple-500/20 text-purple-300" : ""}
          `}
        >
          {d}
        </button>
      );
    }
    return cells;
  };

  const handleFieldChange = (key: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!panelReservation || !selectedStart || !selectedEnd) {
       toast("error", "Wybierz okres rezerwacji na kalendarzu.");
       return;
    }

    if (doesRangeOverlap(selectedStart, selectedEnd, existingReservations)) {
      toast("error", "Wybrany termin pokrywa się z istniejącą rezerwacją. Wybierz inny okres.");
      return;
    }

    setIsSubmitting(true);
    try {
      const toLocalYMD = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const updateData: Record<string, unknown> = {
         date_start_planned: `${toLocalYMD(selectedStart)}T00:00:00`,
         date_end_planned: `${toLocalYMD(selectedEnd)}T23:59:59`,
         purpose: formData.purpose,
         price: parseFloat(String(formData.price)) || 0
      };

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

  const formatDateFull = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString("pl-PL", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  useEffect(() => {
    if (!panelReservation) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closePanel();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [panelReservation]);

  return (
    <div className="space-y-10 relative z-10 py-4">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <nav className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-purple-400/80">
            <Link href="/dashboard" className="hover:text-purple-300 transition-colors">System</Link>
            <span className="w-1 h-1 rounded-full bg-white/20" />
            <span className="text-white/40">Zarządzanie rezerwacjami</span>
          </nav>
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tighter">
            Twoja <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">Flota</span>
          </h1>
          <p className="text-gray-400 text-sm max-w-md font-medium leading-relaxed">
            Przeglądaj, edytuj i monitoruj status wszystkich aktywnych pojazdów w Twoim harmonogramie.
          </p>
        </div>
        <Link
          href="/dashboard/vehicles"
          className="btn-primary px-8 py-3 shadow-[0_0_30px_rgba(139,92,246,0.3)] hover:shadow-[0_0_40px_rgba(139,92,246,0.5)] transition-all"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Zarezerwuj pojazd
        </Link>
      </div>

      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* Main Content */}
      <div className="space-y-6">
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-surface rounded-[2rem] overflow-hidden h-[450px]">
                <div className="skeleton h-48 w-full" />
                <div className="p-8 space-y-4">
                  <div className="skeleton h-8 w-1/2" />
                  <div className="skeleton h-20 w-full rounded-2xl" />
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="glass-elevated rounded-[2.5rem] p-20 text-center border-red-500/10 max-w-2xl mx-auto mt-12">
            <div className="flex flex-col items-center gap-6">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-red-500/10 text-red-500">
                <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold">Synchronizacja nieudana</h3>
                <p className="text-gray-400">{error}</p>
              </div>
              <button onClick={fetchData} className="btn-ghost px-8 border-white/5">Spróbuj ponownie</button>
            </div>
          </div>
        )}

        {!loading && !error && reservations.length === 0 && (
          <div className="glass-elevated rounded-[3rem] p-24 text-center max-w-3xl mx-auto mt-12">
            <div className="flex flex-col items-center gap-8">
              <div className="relative">
                <div className="absolute inset-0 bg-purple-500/20 blur-3xl rounded-full" />
                <div className="relative flex h-24 w-24 items-center justify-center rounded-[2rem] bg-white/5 border border-white/10 text-purple-400">
                  <Image src="/assets/icons/icon-calendar-check.svg" alt="Calendar" width={48} height={48} />
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="text-3xl font-black">Brak zaplanowanych tras</h3>
                <p className="text-gray-400 text-lg max-w-md mx-auto leading-relaxed">
                  Wygląda na to, że Twoja flota obecnie odpoczywa. Czas zaplanować kolejną podróż.
                </p>
              </div>
              <Link href="/dashboard/vehicles" className="btn-primary px-10 py-4 rounded-2xl text-base">
                Przeglądaj dostępne auta
              </Link>
            </div>
          </div>
        )}

        {!loading && !error && reservations.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {reservations.map((er, index) => {
              const stateStyle = STATE_COLORS[er.reservation.state] || STATE_COLORS.created;
              const stateLabel = STATE_LABELS[er.reservation.state] || er.reservation.state;

              return (
                <button
                  key={er.reservation.id}
                  type="button"
                  onClick={() => openPanel(er)}
                  className="group relative glass-elevated rounded-[2rem] overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.5)] text-left border-white/5 hover:border-purple-500/30"
                >
                  {/* Top: Tech Placeholder */}
                  <div className="relative h-40 flex items-center justify-center bg-black/40 overflow-hidden border-b border-white/5">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.1)_0%,transparent_70%)]" />
                    <svg className="w-24 h-24 text-white/10 group-hover:text-purple-500/20 transition-colors duration-500" viewBox="0 0 24 24" fill="currentColor">
                       <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" />
                    </svg>
                    
                    <div className="absolute top-6 right-6">
                      <div
                        className="badge gap-2 px-3 py-1 text-[9px] font-black uppercase tracking-[0.1em] backdrop-blur-xl border-white/5"
                        style={{ background: stateStyle.bg, color: stateStyle.text }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full animate-pulse shadow-[0_0_10px_currentColor]" style={{ background: stateStyle.dot }} />
                        {stateLabel}
                      </div>
                    </div>
                  </div>

                  <div className="p-8 space-y-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <h3 className="text-xl font-black text-white group-hover:text-purple-400 transition-colors tracking-tight">
                          {er.makeName} {er.modelName}
                        </h3>
                        <div className="flex items-center gap-2 opacity-40">
                          <Image src="/assets/icons/icon-dashboard.svg" alt="ID" width={12} height={12} className="invert" />
                          <span className="text-[10px] font-mono tracking-widest font-bold uppercase">RES-{er.reservation.id}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-black/30 rounded-2xl p-5 border border-white/5 space-y-4 relative overflow-hidden group/timeline">
                       <div className="absolute left-[27px] top-8 bottom-8 w-px bg-gradient-to-b from-purple-500/50 via-blue-500/50 to-transparent" />
                      <div className="flex items-center gap-4 relative">
                        <div className="w-6 h-6 flex items-center justify-center rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400">
                           <Image src="/assets/icons/icon-calendar-check.svg" alt="Start" width={12} height={12} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] text-white/30 uppercase font-black tracking-widest">Odbiór</span>
                          <span className="text-xs font-bold text-gray-200">{formatDateFull(er.reservation.date_start_planned)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 relative">
                        <div className="w-6 h-6 flex items-center justify-center rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400">
                           <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                           </svg>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] text-white/30 uppercase font-black tracking-widest">Zwrot</span>
                          <span className="text-xs font-bold text-gray-200">{formatDateFull(er.reservation.date_end_planned)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-3 px-3 py-1.5 bg-white/5 rounded-xl border border-white/5">
                        <Image
                          src={er.reservation.purpose === "business" ? "/assets/icons/icon-business.svg" : "/assets/icons/icon-private.svg"}
                          alt="Purpose"
                          width={12}
                          height={12}
                          className="opacity-70"
                        />
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/50">
                          {er.reservation.purpose === "business" ? "Business" : "Personal"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-purple-400 group-hover:text-white transition-all">
                        <span>Zarządzaj</span>
                        <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* --- PANEL BOCZNY --- */}
      {panelReservation && (
        <div className="fixed inset-x-0 top-16 bottom-0 z-[100] flex justify-end" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity" onClick={closePanel} />
          <div className="relative z-10 w-full md:w-[35rem] h-full bg-[#0d0f14] shadow-[-20px_0_60px_rgba(0,0,0,0.5)] animate-slide-in flex flex-col border-l border-white/5">
            {/* Panel Header */}
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-black/20">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-purple-400">
                   <span>Edycja Rezerwacji</span>
                   <span className="w-1 h-1 rounded-full bg-white/20" />
                   <span className="text-white/40">#{panelReservation.reservation.id}</span>
                </div>
                <h2 className="text-2xl font-black text-white">
                  {panelReservation.makeName} {panelReservation.modelName}
                </h2>
              </div>
              <button onClick={closePanel} className="p-3 rounded-2xl hover:bg-white/5 transition-colors text-white/40 hover:text-white">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Panel Content */}
            <div className="p-8 flex-1 overflow-y-auto custom-scrollbar space-y-10">
              {/* Car Visual Placeholder in Panel */}
              <div className="relative h-48 bg-white/5 rounded-3xl flex items-center justify-center border border-white/5 overflow-hidden group/panel-car">
                 <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.1)_0%,transparent_70%)]" />
                 <svg className="w-24 h-24 text-white/10 group-hover/panel-car:text-purple-500/20 transition-colors duration-500" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" />
                 </svg>
              </div>

              {/* Editable Fields */}
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Cel rezerwacji</label>
                    <select
                      className="input-dark bg-white/5 border-white/10 text-white rounded-2xl py-4 w-full focus:border-purple-500/50"
                      value={String(formData.purpose || "business")}
                      onChange={(e) => handleFieldChange("purpose", e.target.value)}
                    >
                      {PURPOSE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

              {/* REZERVATION CALENDAR */}
              <div className="space-y-6 pt-4">
                <div className="flex items-center justify-between">
                   <label className="text-[10px] font-black uppercase tracking-widest text-white/30">Edytuj Okres Rezerwacji</label>
                   <div className="flex items-center gap-2">
                      <button onClick={prevMonth} className="p-2 hover:bg-white/5 rounded-lg transition-colors text-white/40 hover:text-white">
                         <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M15 19l-7-7 7-7" /></svg>
                      </button>
                      <span className="text-xs font-black uppercase tracking-widest text-white/80 w-32 text-center">
                        {MONTHS_PL[calendarMonth.month]} {calendarMonth.year}
                      </span>
                      <button onClick={nextMonth} className="p-2 hover:bg-white/5 rounded-lg transition-colors text-white/40 hover:text-white">
                         <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M9 5l7 7-7 7" /></svg>
                      </button>
                   </div>
                </div>

                <div className="bg-black/20 rounded-[2rem] p-6 border border-white/5">
                   <div className="grid grid-cols-7 mb-4">
                      {DAYS_PL.map(d => <div key={d} className="text-[9px] font-black uppercase text-white/20 text-center">{d}</div>)}
                   </div>
                   <div className="grid grid-cols-7 gap-1">
                      {Array.from({ length: firstDayOfMonth(calendarMonth.year, calendarMonth.month) }).map((_, i) => (
                        <div key={`empty-${i}`} />
                      ))}
                      {renderCalendar()}
                   </div>
                </div>

                <div className="flex items-center justify-between px-2 pt-2">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black uppercase tracking-widest text-white/30">Wybrany Okres</span>
                    <span className="text-xs font-bold text-white/80">
                      {selectedStart ? selectedStart.toLocaleDateString('pl-PL') : "..." } — {selectedEnd ? selectedEnd.toLocaleDateString('pl-PL') : "..."}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] font-black uppercase tracking-widest text-white/30">Łączny Koszt</span>
                    <div className="text-xl font-black text-white">
                      {selectedStart && selectedEnd ? `${Math.max(1, Math.ceil((selectedEnd.getTime() - selectedStart.getTime()) / (1000*60*60*24))) * 150} PLN` : "—"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 border-t border-white/5 bg-black/20 space-y-4">
              <button 
                type="submit" 
                form="reservation-form" 
                onClick={handleSubmit}
                disabled={isSubmitting} 
                className="btn-primary w-full py-5 rounded-2xl shadow-[0_10px_30px_rgba(139,92,246,0.3)] text-base font-black uppercase tracking-widest"
              >
                {isSubmitting ? "Synchronizacja..." : "Zapisz zmiany"}
              </button>
              
              {!showDeleteConfirm ? (
                <button 
                  type="button" 
                  onClick={() => setShowDeleteConfirm(true)} 
                  className="w-full py-4 text-xs font-black uppercase tracking-widest text-red-400/60 hover:text-red-400 transition-colors"
                >
                  Usuń rezerwację z systemu
                </button>
              ) : (
                <div className="p-6 rounded-3xl bg-red-500/5 border border-red-500/10 space-y-4 animate-in fade-in zoom-in duration-300">
                  <p className="text-sm font-bold text-red-400 text-center">Nieodwracalnie usunąć rezerwację?</p>
                  <div className="flex gap-3">
                    <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-3 rounded-xl bg-white/5 text-xs font-bold hover:bg-white/10 transition-colors">Anuluj</button>
                    <button onClick={handleDelete} disabled={isDeleting} className="flex-1 py-3 rounded-xl bg-red-500 text-xs font-black text-white hover:bg-red-600 shadow-lg shadow-red-500/20">{isDeleting ? "Usuwanie..." : "Tak, usuń"}</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
