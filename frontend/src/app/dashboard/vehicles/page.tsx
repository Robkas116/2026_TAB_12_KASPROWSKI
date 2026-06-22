"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { vehicleApi } from "@/lib/api/vehicle";
import { vehmodelApi } from "@/lib/api/vehmodel";
import { makeApi } from "@/lib/api/make";
import { caretakerApi } from "@/lib/api/caretaker";
import { workerApi } from "@/lib/api/worker";
import { versionApi } from "@/lib/api/version";
import { reservationApi } from "@/lib/api/reservation";
import { useToast } from "@/components/ui/Toast";
import {
  daysInMonth,
  firstDayOfMonth,
  sameDay,
  dateFromYMD,
  doesRangeOverlap,
  MONTHS_PL,
  DAYS_PL,
} from "@/lib/calendar";
import type { VehiclePublic } from "@/types/vehicle_types";
import type { VehModelPublic } from "@/types/vehmodel_types";
import type { MakePublic } from "@/types/make_types";
import type { CaretakerPublic } from "@/types/caretaker_types";
import type { VersionPublic } from "@/types/version_types";
import type { WorkerPublic } from "@/types/worker_types";
import type { ReservationPublic } from "@/types/reservation_types";

interface EnrichedVehicle {
  vehicle: VehiclePublic;
  makeName: string;
  modelName: string;
  caretaker: { caretaker: CaretakerPublic; worker: WorkerPublic | null } | null;
  versionName: string;
}

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


export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<EnrichedVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [panelVehicle, setPanelVehicle] = useState<EnrichedVehicle | null>(null);
  const [reserving, setReserving] = useState(false);
  const [reservePurpose, setReservePurpose] = useState("business");
  const [existingReservations, setExistingReservations] = useState<ReservationPublic[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [selectedStart, setSelectedStart] = useState<Date | null>(null);
  const [selectedEnd, setSelectedEnd] = useState<Date | null>(null);
  const [selectingTimeFor, setSelectingTimeFor] = useState<"start" | "end" | null>(null);

  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [vehResp, modelResp, makeResp, ctResp, workerResp, versionResp] = await Promise.all([
        vehicleApi.getAll(),
        vehmodelApi.getAll(),
        makeApi.getAll(),
        caretakerApi.getAll(),
        workerApi.getAll(),
        versionApi.getAll(),
      ]);


      const vehicleItems: VehiclePublic[] = vehResp.items || [];
      const models: VehModelPublic[] = (modelResp as unknown as { data: VehModelPublic[]; count: number }).data || [];
      const makes: MakePublic[] = (makeResp as unknown as { data: MakePublic[]; count: number }).data || [];
      const caretakers: CaretakerPublic[] = ctResp.data || [];
      const workers: WorkerPublic[] = workerResp.data || [];
      const versions: VersionPublic[] = (versionResp as unknown as { data: VersionPublic[]; count: number }).data || [];

      const enriched: EnrichedVehicle[] = vehicleItems.map((v) => {
        const model = models.find((m) => m.id === v.veh_model_id);
        const make = model ? makes.find((mk) => mk.id === model.make_id) : null;
        const ct = caretakers.find((c) => c.vehicle_id === v.id) || null;
        const worker = ct ? workers.find((w) => w.id === ct.worker_id) || null : null;
        const version = versions.find((ver) => ver.id === v.version_id);

        return {
          vehicle: v,
          makeName: make?.name || "Nieznana marka",
          modelName: model?.name || "Nieznany model",
          caretaker: ct ? { caretaker: ct, worker } : null,
          versionName: version?.destination || "Brak wersji",
        };
      });

      setVehicles(enriched);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się pobrać danych.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  
  const openPanel = async (ev: EnrichedVehicle) => {
    setPanelVehicle(ev);
    setFieldErrors({});
    setSelectedStart(null);
    setSelectedEnd(null);
    setSelectingTimeFor(null);
    setReservePurpose("business");
    const now = new Date();
    setCalendarMonth({ year: now.getFullYear(), month: now.getMonth() });

    try {
      const resResp = await reservationApi.getAll();
      const all = resResp.data || [];
      setExistingReservations(
        all.filter((r) => r.vehicle_id === ev.vehicle.id && r.state !== "canceled")
      );
    } catch {
      setExistingReservations([]);
    }
  };

  const closePanel = () => setPanelVehicle(null);

  useEffect(() => {
    if (!panelVehicle) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closePanel();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [panelVehicle]);


  const blockedDates = useMemo(() => {
    // We don't block the whole day anymore unless it's fully occupied
    // But for the calendar UI, we can keep track of days that have *some* reservations
    const set = new Set<string>();
    for (const r of existingReservations) {
      const s = new Date(r.date_start_planned);
      const e = new Date(r.date_end_planned);
      const cur = new Date(s);
      while (cur <= e) {
        set.add(`${cur.getFullYear()}-${cur.getMonth()}-${cur.getDate()}`);
        cur.setDate(cur.getDate() + 1);
      }
    }
    return set;
  }, [existingReservations]);


  const handleCalendarDayClick = (day: number) => {
    const d = dateFromYMD(calendarMonth.year, calendarMonth.month, day);
    if (d < new Date(new Date().setHours(0, 0, 0, 0))) return;

    // Find first available hour
    let firstAvailableHour = 0;
    const now = new Date();
    for (let h = 0; h < 24; h++) {
      const checkDate = new Date(d);
      checkDate.setHours(h, 0, 0, 0);
      const isPast = checkDate < now;
      const isOccupied = existingReservations.some(r => {
        const s = new Date(r.date_start_planned);
        const e = new Date(r.date_end_planned);
        return checkDate >= s && checkDate < e;
      });
      if (!isPast && !isOccupied) {
        firstAvailableHour = h;
        break;
      }
    }
    d.setHours(firstAvailableHour, 0, 0, 0);

    if (!selectedStart || (selectedStart && selectedEnd)) {
      setSelectedStart(d);
      setSelectedEnd(null);
      setSelectingTimeFor("start");
      setFieldErrors({});
    } else {
      const dDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const startDate = new Date(selectedStart.getFullYear(), selectedStart.getMonth(), selectedStart.getDate());
      if (dDate < startDate) {
        setSelectedStart(d);
        setSelectingTimeFor("start");
      } else {
        setSelectedEnd(d);
        setSelectingTimeFor("end");
      }
    }
  };

  const handleTimeClick = (hour: number) => {
    if (!selectingTimeFor) return;

    if (selectingTimeFor === "start" && selectedStart) {
      const newStart = new Date(selectedStart);
      newStart.setHours(hour, 0, 0, 0);
      setSelectedStart(newStart);
      setSelectingTimeFor(null);
    } else if (selectingTimeFor === "end" && selectedEnd) {
      const newEnd = new Date(selectedEnd);
      newEnd.setHours(hour, 0, 0, 0);
      
      if (selectedStart && newEnd <= selectedStart) {
        setFieldErrors({ range: "Data zakończenia musi być późniejsza niż rozpoczęcia." });
        return;
      }
      
      if (selectedStart && doesRangeOverlap(selectedStart, newEnd, existingReservations)) {
        setFieldErrors({ range: "Wybrany termin pokrywa się z istniejącą rezerwacją." });
        return;
      }

      setSelectedEnd(newEnd);
      setSelectingTimeFor(null);
      setFieldErrors({});
    }
  };

  const handleReserve = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!selectedStart) errors.start = "Wybierz datę rozpoczęcia.";
    if (!selectedEnd) errors.end = "Wybierz datę zakończenia.";

    if (selectedStart && selectedEnd && selectedEnd <= selectedStart) {
      errors.end = "Data zakończenia musi być późniejsza niż data rozpoczęcia.";
    }
    if (selectedStart && selectedEnd && doesRangeOverlap(selectedStart, selectedEnd, existingReservations)) {
      errors.range = "Wybrany termin pokrywa się z istniejącą rezerwacją.";
    }

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;
    if (!panelVehicle) return;

    setReserving(true);
    const diffMs = selectedEnd!.getTime() - selectedStart!.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    const finalPrice = reservePurpose === "business" ? 0 : Math.ceil(diffHours / 24) * 150;

    try {
      const user = await api.getCurrentUser();
      const toISO = (d: Date) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        const h = String(d.getHours()).padStart(2, "0");
        return `${y}-${m}-${day}T${h}:00:00`;
      };
      await api.createReservation({
        vehicle_id: panelVehicle.vehicle.id,
        worker_id: user.id,
        date_start_planned: toISO(selectedStart!),
        date_end_planned: toISO(selectedEnd!),
        purpose: reservePurpose as "business" | "private",
        price: finalPrice,      
      });
      toast("success", "Rezerwacja została utworzona!");
      closePanel();
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "Błąd rezerwacji.");
    } finally {
      setReserving(false);
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
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const cells: React.ReactNode[] = [];
    for (let i = 0; i < startOffset; i++) {
      cells.push(<div key={`empty-${i}`} />);
    }
    for (let d = 1; d <= totalDays; d++) {
      const date = dateFromYMD(year, month, d);
      const key = `${year}-${month}-${d}`;
      const hasReservation = blockedDates.has(key);
      const past = date < today;
      const isStart = selectedStart && sameDay(date, selectedStart);
      const isEnd = selectedEnd && sameDay(date, selectedEnd);
      const selected = isStart || isEnd;
      const inRange = selectedStart && selectedEnd && date > selectedStart && date < selectedEnd;

      cells.push(
        <button
          key={d}
          type="button"
          disabled={past}
          onClick={() => handleCalendarDayClick(d)}
          className={`h-9 w-9 rounded-lg text-xs font-medium transition-all flex flex-col items-center justify-center relative
            ${past
                ? "opacity-30 cursor-not-allowed"
                : "hover:bg-white/10 cursor-pointer text-white/70"}
            ${selected ? "!text-white !bg-purple-500 shadow-[0_0_15px_rgba(139,92,246,0.5)]" : ""}
            ${inRange ? "bg-purple-500/20 text-purple-300" : ""}
          `}
        >
          {d}
          {hasReservation && !selected && <div className="absolute bottom-1 w-1 h-1 rounded-full bg-purple-400/50" />}
        </button>
      );
    }
    return cells;
  };

  return (
    <div className="space-y-10 relative z-10 py-4">
      {/* Unified Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <nav className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-purple-400/80">
            <Link href="/dashboard" className="hover:text-purple-300 transition-colors">System</Link>
            <span className="w-1 h-1 rounded-full bg-white/20" />
            <span className="text-white/40">Katalog Floty</span>
          </nav>
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tighter">
            Flota <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">Pojazdów</span>
          </h1>
          <p className="text-gray-400 text-sm max-w-md font-medium leading-relaxed">
            Przeglądaj wszystkie dostępne samochody, sprawdź ich opiekunów i dokonaj rezerwacji w systemie.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="btn-ghost px-6 py-3 border-white/5 text-xs font-black uppercase tracking-widest hover:bg-white/5 transition-all flex items-center gap-2"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Powrót do menu
        </Link>
      </div>

      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-surface rounded-2xl overflow-hidden">
              <div className="skeleton h-40 w-full" />
              <div className="p-4 space-y-2">
                <div className="skeleton h-5 w-24" />
                <div className="skeleton h-4 w-32" />
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
            <button type="button" onClick={fetchData} className="btn-ghost mt-2 px-8 border-white/5">Spróbuj ponownie</button>
          </div>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && vehicles.length === 0 && (
        <div className="glass-surface rounded-2xl p-12 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full" style={{ background: "var(--color-accent-glow)" }}>
              <svg className="h-6 w-6" style={{ color: "var(--color-accent-soft)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <p className="font-medium" style={{ color: "var(--color-text-secondary)" }}>Brak pojazdów</p>
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>W systemie nie ma jeszcze żadnych pojazdów.</p>
          </div>
        </div>
      )}

      {/* Vehicle Cards Grid */}
      {!loading && !error && vehicles.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {vehicles.map((ev, index) => (
            <button
              key={ev.vehicle.id}
              type="button"
              onClick={() => openPanel(ev)}
              className="glass-elevated rounded-3xl overflow-hidden text-left group transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.5)] border-white/5 hover:border-purple-500/30"
            >
              {/* Top: Placeholder Silhouette */}
              <div className="relative h-44 flex items-center justify-center bg-black/40 overflow-hidden border-b border-white/5">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.1)_0%,transparent_70%)]" />
                <svg className="w-24 h-24 text-white/10 group-hover:text-purple-500/20 transition-colors duration-500" viewBox="0 0 24 24" fill="currentColor">
                   <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" />
                </svg>
                
                <div className="absolute top-4 left-4">
                   <span className="px-3 py-1 bg-white/5 backdrop-blur-md rounded-lg border border-white/10 text-[9px] font-black uppercase tracking-widest text-white/40">
                     S/N: {ev.vehicle.id.toString().padStart(4, '0')}
                   </span>
                </div>
              </div>

              {/* Info */}
              <div className="p-6 space-y-4">
                <div>
                  <h3 className="text-xl font-black text-white group-hover:text-purple-400 transition-colors tracking-tight">
                    {ev.makeName}
                  </h3>
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">
                    {ev.modelName}
                  </p>
                  <p className="text-purple-400/90 text-[11px] font-semibold mt-1 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    Wersja: {ev.versionName}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {ev.caretaker ? (
                    <span className="badge px-3 py-1 text-[9px] font-black uppercase tracking-widest" style={{ background: "rgba(52, 211, 153, 0.1)", color: "#34d399", border: "1px solid rgba(52, 211, 153, 0.2)" }}>
                      Opiekun: {ev.caretaker.worker?.name || "Brak"}
                    </span>
                  ) : (
                    <span className="badge px-3 py-1 text-[9px] font-black uppercase tracking-widest" style={{ background: "rgba(251, 191, 36, 0.1)", color: "#fbbf24", border: "1px solid rgba(251, 191, 36, 0.2)" }}>
                      Bez opiekuna
                    </span>
                  )}
                </div>

                <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black uppercase tracking-widest text-white/30">Opiekun</span>
                    <span className="text-xs font-bold text-gray-300">{ev.caretaker?.worker?.name || "Brak"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-purple-400 group-hover:text-white transition-all">
                    <span>Rezerwuj</span>
                    <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* --- SIDE PANEL --- */}
      {panelVehicle && (
        <div className="fixed inset-x-0 top-16 bottom-0 z-[100] flex justify-end" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity" onClick={closePanel} />
          
          <div className="relative z-10 w-full md:w-[35rem] h-full bg-[#0d0f14] shadow-[-20px_0_60px_rgba(0,0,0,0.5)] animate-slide-in flex flex-col border-l border-white/5">
            {/* Header */}
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-black/20">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-purple-400">
                   <span>Specyfikacja Pojazdu</span>
                   <span className="w-1 h-1 rounded-full bg-white/20" />
                   <span className="text-white/40">#{panelVehicle.vehicle.id}</span>
                </div>
                <h2 className="text-2xl font-black text-white">
                  {panelVehicle.makeName} {panelVehicle.modelName}
                </h2>
              </div>
              <button onClick={closePanel} className="p-3 rounded-2xl hover:bg-white/5 transition-colors text-white/40 hover:text-white">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-8 flex-1 overflow-y-auto custom-scrollbar space-y-10">
              <div className="relative h-48 bg-white/5 rounded-3xl flex items-center justify-center border border-white/5 overflow-hidden group/panel-car">
                 <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.1)_0%,transparent_70%)]" />
                 <svg className="w-24 h-24 text-white/10 group-hover/panel-car:text-purple-500/20 transition-colors duration-500" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" />
                 </svg>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-widest text-white/30">Lokalizacja</label>
                   <div className="bg-white/5 rounded-2xl p-4 text-sm font-bold text-white/80 border border-white/5">
                      Polska
                   </div>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-widest text-white/30">Status Floty</label>
                   <div className="bg-emerald-500/10 rounded-2xl p-4 text-sm font-bold text-emerald-400 border border-emerald-500/20">
                      Operacyjny
                   </div>
                </div>
              </div>

              <div className="space-y-4">
                 <label className="text-[10px] font-black uppercase tracking-widest text-white/30">Wersja pojazdu</label>
                 <div className="bg-white/5 rounded-3xl p-6 border border-white/5">
                    <h4 className="font-bold text-white">
                      {panelVehicle.versionName}
                    </h4>
                 </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Cel rezerwacji</label>
                    <select
                      className="input-dark bg-white/5 border-white/10 text-white rounded-2xl py-4 w-full focus:border-purple-500/50"
                      value={reservePurpose}
                      onChange={(e) => setReservePurpose(e.target.value)}
                    >
                      <option value="business" className="bg-[#0d0f14]">Służbowy (0 PLN)</option>
                      <option value="private" className="bg-[#0d0f14]">Prywatny (150 PLN / doba)</option>
                    </select>
                </div>
              </div>

              <div className="space-y-6 pt-4">
                <div className="flex items-center justify-between">
                   <label className="text-[10px] font-black uppercase tracking-widest text-white/30">Kalendarz Rezerwacji</label>
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

                {/* Hourly Picker */}
                {selectingTimeFor && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black uppercase tracking-widest text-purple-400">
                        Wybierz godzinę {selectingTimeFor === "start" ? "rozpoczęcia" : "zakończenia"}
                      </label>
                      <button 
                        onClick={() => setSelectingTimeFor(null)}
                        className="text-[10px] font-bold text-white/40 hover:text-white transition-colors"
                      >
                        Anuluj
                      </button>
                    </div>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                      {Array.from({ length: 24 }).map((_, i) => {
                        const hourDate = new Date(selectingTimeFor === "start" ? selectedStart! : selectedEnd!);
                        hourDate.setHours(i, 0, 0, 0);
                        
                        const isPast = hourDate < new Date();
                        const isOccupied = existingReservations.some(r => {
                           const s = new Date(r.date_start_planned);
                           const e = new Date(r.date_end_planned);
                           return hourDate >= s && hourDate < e;
                        });
                        const isInvalidEnd = selectingTimeFor === "end" && !!selectedStart && hourDate <= selectedStart;
                        const isDisabled = isPast || isOccupied || isInvalidEnd;
                        const isSelected = selectingTimeFor === "start" 
                           ? (selectedStart && selectedStart.getHours() === i)
                           : (selectedEnd && selectedEnd.getHours() === i);

                        return (
                          <button
                            key={i}
                            type="button"
                            disabled={isDisabled}
                            onClick={() => handleTimeClick(i)}
                            className={`py-2.5 rounded-xl text-[10px] font-black transition-all border
                              ${isDisabled 
                                ? "bg-white/5 border-transparent text-white/10 cursor-not-allowed" 
                                : "bg-white/5 border-white/5 text-white/60 hover:border-purple-500/50 hover:text-white"}
                              ${isSelected ? "!bg-purple-500 !border-purple-500 !text-white shadow-[0_0_15px_rgba(139,92,246,0.3)]" : ""}
                            `}
                          >
                            {String(i).padStart(2, '0')}:00
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between px-2 pt-2">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black uppercase tracking-widest text-white/30">Wybrany Okres</span>
                    <span className="text-xs font-bold text-white/80">
                      {selectedStart ? `${selectedStart.toLocaleDateString('pl-PL')} ${String(selectedStart.getHours()).padStart(2, '0')}:00` : "..." } — {selectedEnd ? `${selectedEnd.toLocaleDateString('pl-PL')} ${String(selectedEnd.getHours()).padStart(2, '0')}:00` : "..."}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] font-black uppercase tracking-widest text-white/30">Łączny Koszt</span>
                    <div className="text-xl font-black text-white">
                      {selectedStart && selectedEnd 
                      ? `${reservePurpose === "business" ? 0 : Math.max(1, Math.ceil((selectedEnd.getTime() - selectedStart.getTime()) / (1000*60*60*24))) * 150} PLN` 
                      : "—"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Panel Footer */}
              <div className="p-8 border-t border-white/5 bg-black/20 space-y-6">
                <div className="flex justify-end items-end">
                  <div className="text-right space-y-1">
                    <span className="text-[9px] font-black uppercase tracking-widest text-white/30">Łączny Koszt</span>
                    <div className="text-2xl font-black text-white">
                      {selectedStart && selectedEnd 
                      ? `${reservePurpose === "business" ? 0 : Math.max(1, Math.ceil((selectedEnd.getTime() - selectedStart.getTime()) / (1000*60*60*24))) * 150} PLN` 
                      : "—"}
                    </div>
                  </div>
                </div>

              {fieldErrors.range && (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
                  {fieldErrors.range}
                </div>
              )}

              <button
                onClick={handleReserve}
                disabled={reserving || !selectedStart || !selectedEnd}
                className="btn-primary w-full py-5 rounded-2xl shadow-[0_15px_40px_rgba(139,92,246,0.3)] disabled:shadow-none disabled:opacity-30 transition-all text-base font-black uppercase tracking-widest"
              >
                {reserving ? "Przetwarzanie..." : "Zatwierdź Rezerwację"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
