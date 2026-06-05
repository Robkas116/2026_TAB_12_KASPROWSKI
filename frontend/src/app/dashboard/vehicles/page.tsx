"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { vehicleApi } from "@/lib/api/vehicle";
import { vehmodelApi } from "@/lib/api/vehmodel";
import { makeApi } from "@/lib/api/make";
import { caretakerApi } from "@/lib/api/caretaker";
import { workerApi } from "@/lib/api/worker";
import { setofequipmentApi } from "@/lib/api/set_of_equipment";
import { reservationApi } from "@/lib/api/reservation";
import { useToast } from "@/components/ui/Toast";
import type { VehiclePublic } from "@/types/vehicle_types";
import type { VehModelPublic } from "@/types/vehmodel_types";
import type { MakePublic } from "@/types/make_types";
import type { CaretakerPublic } from "@/types/caretaker_types";
import type { SetOfEquipmentPublic } from "@/types/set_of_equipment_types";
import type { WorkerPublic } from "@/types/worker_types";
import type { ReservationPublic } from "@/types/reservation_types";

interface EnrichedVehicle {
  vehicle: VehiclePublic;
  makeName: string;
  modelName: string;
  caretaker: { caretaker: CaretakerPublic; worker: WorkerPublic | null } | null;
  equipment: SetOfEquipmentPublic | null;
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

/* ── Mini calendar helpers ── */
function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function firstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay(); // 0=Sun
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function dateFromYMD(y: number, m: number, d: number) {
  return new Date(y, m, d);
}

const MONTHS_PL = [
  "Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec",
  "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień",
];
const DAYS_PL = ["Nd", "Pn", "Wt", "Śr", "Cz", "Pt", "So"];

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<EnrichedVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* Panel state */
  const [panelVehicle, setPanelVehicle] = useState<EnrichedVehicle | null>(null);
  const [reserveStart, setReserveStart] = useState("");
  const [reserveEnd, setReserveEnd] = useState("");
  const [reserving, setReserving] = useState(false);
  const [existingReservations, setExistingReservations] = useState<ReservationPublic[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
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
      const [vehResp, modelResp, makeResp, ctResp, workerResp, equipResp] = await Promise.all([
        vehicleApi.getAll(),
        vehmodelApi.getAll(),
        makeApi.getAll(),
        caretakerApi.getAll(),
        workerApi.getAll(),
        setofequipmentApi.getAll(),
      ]);

      // Backend returns { data, count } for these endpoints
      const vehicleItems: VehiclePublic[] = vehResp.items || [];
      const models: VehModelPublic[] = (modelResp as unknown as { data: VehModelPublic[]; count: number }).data || [];
      const makes: MakePublic[] = (makeResp as unknown as { data: MakePublic[]; count: number }).data || [];
      const caretakers: CaretakerPublic[] = ctResp.data || [];
      const workers: WorkerPublic[] = workerResp.data || [];
      const equipments: SetOfEquipmentPublic[] = (equipResp as unknown as { data: SetOfEquipmentPublic[]; count: number }).data || [];

      const enriched: EnrichedVehicle[] = vehicleItems.map((v) => {
        const model = models.find((m) => m.id === v.veh_model_id);
        const make = model ? makes.find((mk) => mk.id === model.make_id) : null;
        const ct = caretakers.find((c) => c.vehicle_id === v.id) || null;
        const worker = ct ? workers.find((w) => w.id === ct.worker_id) || null : null;
        const eq = equipments.find((e) => e.version_id === v.version_id) || null;

        return {
          vehicle: v,
          makeName: make?.name || "Nieznana marka",
          modelName: model?.name || "Nieznany model",
          caretaker: ct ? { caretaker: ct, worker } : null,
          equipment: eq,
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

  /* ── Panel open / close ── */
  const openPanel = async (ev: EnrichedVehicle) => {
    setPanelVehicle(ev);
    setReserveStart("");
    setReserveEnd("");
    setFieldErrors({});
    setSelectedStart(null);
    setSelectedEnd(null);
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

  /* ── Blocked dates set ── */
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

  /* ── Calendar click handlers ── */
  const handleCalendarDayClick = (day: number) => {
    const d = dateFromYMD(calendarMonth.year, calendarMonth.month, day);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (blockedDates.has(key)) return;
    if (d < new Date(new Date().setHours(0, 0, 0, 0))) return;

    if (!selectedStart || (selectedStart && selectedEnd)) {
      setSelectedStart(d);
      setSelectedEnd(null);
      setReserveStart(d.toISOString().slice(0, 16));
      setReserveEnd("");
      setFieldErrors({});
    } else {
      if (d < selectedStart) {
        setSelectedStart(d);
        setReserveStart(d.toISOString().slice(0, 16));
      } else {
        setSelectedEnd(d);
        setReserveEnd(d.toISOString().slice(0, 16));
        setFieldErrors({});
      }
    }
  };

  const isInRange = (day: number) => {
    if (!selectedStart || !selectedEnd) return false;
    const d = dateFromYMD(calendarMonth.year, calendarMonth.month, day);
    return d > selectedStart && d < selectedEnd;
  };

  const isSelected = (day: number) => {
    const d = dateFromYMD(calendarMonth.year, calendarMonth.month, day);
    return (selectedStart && sameDay(d, selectedStart)) || (selectedEnd && sameDay(d, selectedEnd));
  };

  /* ── Reservation submit ── */
  const handleReserve = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!reserveStart) errors.start = "Wybierz datę rozpoczęcia.";
    if (!reserveEnd) errors.end = "Wybierz datę zakończenia.";
    if (reserveStart && reserveEnd && new Date(reserveEnd) <= new Date(reserveStart)) {
      errors.end = "Data zakończenia musi być późniejsza.";
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;
    if (!panelVehicle) return;

    setReserving(true);
    try {
      const user = await api.getCurrentUser();
      await api.createReservation({
        vehicle_id: panelVehicle.vehicle.id,
        worker_id: user.id,
        date_start_planned: new Date(reserveStart).toISOString(),
        date_end_planned: new Date(reserveEnd).toISOString(),
        purpose: "business",
        price: 0,
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

  /* ── Calendar grid ── */
  const renderCalendar = () => {
    const { year, month } = calendarMonth;
    const totalDays = daysInMonth(year, month);
    const fdom = firstDayOfMonth(year, month); // 0=Sun
    const startOffset = fdom === 0 ? 6 : fdom - 1; // Start from Monday
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const cells: React.ReactNode[] = [];
    for (let i = 0; i < startOffset; i++) {
      cells.push(<div key={`empty-${i}`} />);
    }
    for (let d = 1; d <= totalDays; d++) {
      const date = dateFromYMD(year, month, d);
      const key = `${year}-${month}-${d}`;
      const blocked = blockedDates.has(key);
      const past = date < today;
      const selected = isSelected(d);
      const inRange = isInRange(d);

      cells.push(
        <button
          key={d}
          type="button"
          disabled={blocked || past}
          onClick={() => handleCalendarDayClick(d)}
          className={`h-9 w-9 rounded-lg text-xs font-medium transition-all flex items-center justify-center
            ${blocked
              ? "line-through cursor-not-allowed"
              : past
                ? "opacity-30 cursor-default"
                : "hover:bg-white/10 cursor-pointer"}
            ${selected ? "!text-white" : ""}
            ${inRange ? "" : ""}
          `}
          style={{
            background: selected
              ? "var(--color-accent)"
              : inRange
                ? "var(--color-accent-glow)"
                : blocked
                  ? "var(--color-error-soft)"
                  : "transparent",
            color: selected
              ? "#fff"
              : blocked
                ? "var(--color-error)"
                : inRange
                  ? "var(--color-accent-soft)"
                  : "var(--color-text-secondary)",
          }}
        >
          {d}
        </button>
      );
    }
    return cells;
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
            Flota pojazdów
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
            Przeglądaj dostępne samochody i rezerwuj
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
            <button type="button" onClick={fetchData} className="btn-ghost mt-2">Spróbuj ponownie</button>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {vehicles.map((ev, index) => (
            <button
              key={ev.vehicle.id}
              type="button"
              onClick={() => openPanel(ev)}
              className="glass-surface rounded-2xl overflow-hidden text-left group transition-all duration-300 hover:-translate-y-1 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }}
            >
              {/* Car image placeholder */}
              <div
                className={`h-40 bg-gradient-to-br ${carGradient(index)} relative flex items-center justify-center overflow-hidden`}
              >
                <svg className="h-20 w-28 opacity-30 group-hover:opacity-40 transition-opacity" viewBox="0 0 112 80" fill="none">
                  <rect x="8" y="24" width="96" height="28" rx="6" fill="white" />
                  <path d="M30 24V16C30 12 34 8 40 8H72C78 8 82 12 82 16V24" fill="white" />
                  <rect x="60" y="14" width="30" height="14" rx="4" fill="white" opacity="0.6" />
                  <circle cx="32" cy="56" r="10" fill="white" />
                  <circle cx="80" cy="56" r="10" fill="white" />
                  <circle cx="32" cy="56" r="5" fill="rgba(0,0,0,0.3)" />
                  <circle cx="80" cy="56" r="5" fill="rgba(0,0,0,0.3)" />
                  <rect x="4" y="50" width="14" height="6" rx="2" fill="white" opacity="0.4" />
                  <rect x="94" y="50" width="14" height="6" rx="2" fill="white" opacity="0.4" />
                </svg>
              </div>

              {/* Info */}
              <div className="p-4">
                <h3 className="font-bold text-base truncate" style={{ color: "var(--color-text-primary)" }}>
                  {ev.makeName}
                </h3>
                <p className="text-sm mt-0.5" style={{ color: "var(--color-text-secondary)" }}>
                  {ev.modelName}
                </p>
                {ev.vehicle.description && (
                  <p className="text-xs mt-1.5 truncate" style={{ color: "var(--color-text-muted)" }}>
                    {ev.vehicle.description}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-3">
                  {ev.caretaker ? (
                    <span className="badge" style={{ background: "var(--color-success-soft)", color: "var(--color-success)" }}>
                      Dostępny
                    </span>
                  ) : (
                    <span className="badge" style={{ background: "var(--color-warning-soft)", color: "var(--color-warning)" }}>
                      Bez opiekuna
                    </span>
                  )}
                  <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                    {ev.equipment?.equipments?.length ? `${ev.equipment.equipments.length} elem.` : ""}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* ── Right-side slide-in panel ── */}
      {panelVehicle && (
        <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="Szczegóły pojazdu">
          {/* Backdrop */}
          <div
            className="absolute inset-0 modal-backdrop"
            style={{ background: "rgba(0,0,0,0.7)" }}
            onClick={closePanel}
            aria-hidden="true"
          />

          {/* Panel */}
          <div
            className="relative z-10 w-full md:w-[44rem] h-full overflow-y-auto shadow-2xl animate-slide-in"
            style={{
              background: "var(--color-surface)",
              borderLeft: "1px solid var(--color-border)",
            }}
          >
            {/* Header */}
            <div
              className="sticky top-0 z-10 flex justify-between items-start p-6 border-b"
              style={{
                background: "var(--color-surface)",
                borderColor: "var(--color-border)",
              }}
            >
              <div>
                <p className="text-xs uppercase tracking-wider font-semibold" style={{ color: "var(--color-accent-soft)" }}>
                  {panelVehicle.makeName}
                </p>
                <h2 className="text-xl font-bold mt-0.5" style={{ color: "var(--color-text-primary)" }}>
                  {panelVehicle.modelName}
                </h2>
                {panelVehicle.vehicle.description && (
                  <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
                    {panelVehicle.vehicle.description}
                  </p>
                )}
              </div>
              <button
                onClick={closePanel}
                className="p-2 rounded-lg transition-colors hover:bg-white/5"
                style={{ color: "var(--color-text-muted)" }}
                aria-label="Zamknij panel"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Caretaker */}
              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--color-text-muted)" }}>
                  Opiekun pojazdu
                </h3>
                {panelVehicle.caretaker ? (
                  <div
                    className="rounded-xl p-4 flex items-center gap-3"
                    style={{ background: "var(--color-elevated)", border: "1px solid var(--color-border)" }}
                  >
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold shrink-0"
                      style={{ background: "var(--color-accent-glow)", color: "var(--color-accent-soft)" }}
                    >
                      {panelVehicle.caretaker.worker?.name?.charAt(0).toUpperCase() || "?"}
                    </div>
                    <div>
                      <p className="font-medium text-sm" style={{ color: "var(--color-text-primary)" }}>
                        {panelVehicle.caretaker.worker?.name || "Nieznany"}
                      </p>
                      <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                        Od {new Date(panelVehicle.caretaker.caretaker.date_start).toLocaleDateString("pl-PL")}
                        {panelVehicle.caretaker.caretaker.date_end &&
                          ` – do ${new Date(panelVehicle.caretaker.caretaker.date_end).toLocaleDateString("pl-PL")}`}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl p-4 text-center" style={{ background: "var(--color-elevated)", border: "1px solid var(--color-border)" }}>
                    <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Brak przypisanego opiekuna</p>
                  </div>
                )}
              </section>

              {/* Equipment */}
              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--color-text-muted)" }}>
                  Wyposażenie
                </h3>
                {panelVehicle.equipment && panelVehicle.equipment.equipments?.length > 0 ? (
                  <div className="rounded-xl p-4" style={{ background: "var(--color-elevated)", border: "1px solid var(--color-border)" }}>
                    <p className="text-sm font-medium mb-2" style={{ color: "var(--color-text-primary)" }}>
                      {panelVehicle.equipment.name}
                    </p>
                    <ul className="space-y-1.5">
                      {panelVehicle.equipment.equipments.map((eq) => (
                        <li key={eq.id} className="flex items-center gap-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                          <svg className="h-4 w-4 shrink-0" style={{ color: "var(--color-accent-soft)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          {eq.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="rounded-xl p-4 text-center" style={{ background: "var(--color-elevated)", border: "1px solid var(--color-border)" }}>
                    <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Brak danych o wyposażeniu</p>
                  </div>
                )}
              </section>

              {/* Calendar + Reservation */}
              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--color-text-muted)" }}>
                  Kalendarz rezerwacji
                </h3>

                <div
                  className="rounded-xl p-4"
                  style={{
                    background: "var(--color-elevated)",
                    border: "1px solid var(--color-accent-glow)",
                  }}
                >
                  {/* Month navigation */}
                  <div className="flex items-center justify-between mb-3">
                    <button type="button" onClick={prevMonth} className="p-1 rounded hover:bg-white/5 transition-colors" style={{ color: "var(--color-text-muted)" }}>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <span className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                      {MONTHS_PL[calendarMonth.month]} {calendarMonth.year}
                    </span>
                    <button type="button" onClick={nextMonth} className="p-1 rounded hover:bg-white/5 transition-colors" style={{ color: "var(--color-text-muted)" }}>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>

                  {/* Day headers */}
                  <div className="grid grid-cols-7 gap-1 mb-1">
                    {DAYS_PL.map((d) => (
                      <div key={d} className="text-center text-[10px] font-medium" style={{ color: "var(--color-text-muted)" }}>
                        {d}
                      </div>
                    ))}
                  </div>

                  {/* Day grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {renderCalendar()}
                  </div>

                  {/* Legend */}
                  <div className="flex items-center gap-4 mt-3 pt-3 border-t text-xs" style={{ borderColor: "var(--color-border)" }}>
                    <span className="flex items-center gap-1.5" style={{ color: "var(--color-text-muted)" }}>
                      <span className="w-3 h-3 rounded" style={{ background: "var(--color-error-soft)", border: "1px solid rgba(248,113,113,0.3)" }} />
                      Zajęte
                    </span>
                    <span className="flex items-center gap-1.5" style={{ color: "var(--color-text-muted)" }}>
                      <span className="w-3 h-3 rounded" style={{ background: "var(--color-accent)" }} />
                      Wybrane
                    </span>
                  </div>
                </div>

                {/* Reservation form */}
                <form onSubmit={handleReserve} className="mt-4 space-y-3" noValidate>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="rs-start" className="block text-xs font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>
                        Od
                      </label>
                      <input
                        id="rs-start"
                        type="datetime-local"
                        className={`input-dark text-sm ${fieldErrors.start ? "input-error" : ""}`}
                        value={reserveStart}
                        onChange={(e) => {
                          setReserveStart(e.target.value);
                          setSelectedStart(e.target.value ? new Date(e.target.value) : null);
                          if (fieldErrors.start) setFieldErrors((p) => ({ ...p, start: "" }));
                        }}
                      />
                      {fieldErrors.start && <p className="field-error">{fieldErrors.start}</p>}
                    </div>
                    <div>
                      <label htmlFor="rs-end" className="block text-xs font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>
                        Do
                      </label>
                      <input
                        id="rs-end"
                        type="datetime-local"
                        className={`input-dark text-sm ${fieldErrors.end ? "input-error" : ""}`}
                        value={reserveEnd}
                        onChange={(e) => {
                          setReserveEnd(e.target.value);
                          setSelectedEnd(e.target.value ? new Date(e.target.value) : null);
                          if (fieldErrors.end) setFieldErrors((p) => ({ ...p, end: "" }));
                        }}
                      />
                      {fieldErrors.end && <p className="field-error">{fieldErrors.end}</p>}
                    </div>
                  </div>

                  <button type="submit" disabled={reserving} className="btn-primary w-full">
                    {reserving ? (
                      <>
                        <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        Rezerwowanie...
                      </>
                    ) : (
                      <>
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Zarezerwuj
                      </>
                    )}
                  </button>
                </form>
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
