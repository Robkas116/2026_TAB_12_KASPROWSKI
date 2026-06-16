"use client";

import { useState, useEffect, useCallback } from "react";
import { caretakerPanelApi } from "@/lib/api/caretaker_panel";
import {
  daysInMonth,
  firstDayOfMonth,
  sameDay,
  dateFromYMD,
  doesRangeOverlap,
  toISODateString,
  MONTHS_PL,
  DAYS_PL,
} from "@/lib/calendar";
import type { PanelReservationPublic } from "@/types/caretaker_panel_types";
import type { ReservationPublic } from "@/types/reservation_types";

interface ServiceSectionProps {
  vehicleId: number;
  toast: (type: "success" | "error", message: string) => void;
}

export default function ServiceSection({ vehicleId, toast }: ServiceSectionProps) {
  const [services, setServices] = useState<PanelReservationPublic[]>([]);
  const [loading, setLoading] = useState(true);

  // --- Panel state ---
  const [showPanel, setShowPanel] = useState(false);
  const [editingService, setEditingService] = useState<PanelReservationPublic | null>(null);

  // --- Calendar state (identical to vehicles page) ---
  const now = new Date();
  const [calendarMonth, setCalendarMonth] = useState({
    year: now.getFullYear(),
    month: now.getMonth(),
  });
  const [selectedStart, setSelectedStart] = useState<Date | null>(null);
  const [selectedEnd, setSelectedEnd] = useState<Date | null>(null);
  const [selectingTimeFor, setSelectingTimeFor] = useState<"start" | "end" | null>(null);
  const [existingReservations, setExistingReservations] = useState<ReservationPublic[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Service name ---
  const [serviceName, setServiceName] = useState("");

  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const all = await caretakerPanelApi.getReservations(vehicleId);
      setServices(all.filter((r) => r.purpose === "service"));
    } catch {
      toast("error", "Nie udało się pobrać serwisów.");
    } finally {
      setLoading(false);
    }
  }, [vehicleId, toast]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  // Fetch reservations for calendar overlap checking
  const fetchCalendarData = useCallback(async () => {
    try {
      const all = await caretakerPanelApi.getReservations(vehicleId);
      setExistingReservations(
        all
          .filter((r) => r.state !== "canceled")
          .map(
            (r) =>
              ({
                id: r.id,
                date_start_planned: r.date_start_planned,
                date_end_planned: r.date_end_planned,
                state: r.state,
                vehicle_id: r.vehicle_id,
                worker_id: r.worker_id,
              }) as unknown as ReservationPublic,
          ),
      );
    } catch {
      setExistingReservations([]);
    }
  }, [vehicleId]);

  // --- Panel open/close ---
  const openCreatePanel = () => {
    setEditingService(null);
    setServiceName("");
    setSelectedStart(null);
    setSelectedEnd(null);
    setSelectingTimeFor(null);
    setFieldErrors({});
    setCalendarMonth({ year: now.getFullYear(), month: now.getMonth() });
    fetchCalendarData();
    setShowPanel(true);
  };

  const openEditPanel = (svc: PanelReservationPublic) => {
    setEditingService(svc);
    setServiceName(svc.service_name || "");
    const start = new Date(svc.date_start_planned);
    const end = new Date(svc.date_end_planned);
    setSelectedStart(start);
    setSelectedEnd(end);
    setSelectingTimeFor(null);
    setFieldErrors({});
    setCalendarMonth({ year: start.getFullYear(), month: start.getMonth() });
    fetchCalendarData();
    setShowPanel(true);
  };

  const closePanel = () => {
    setShowPanel(false);
    setEditingService(null);
  };

  // Keyboard escape
  useEffect(() => {
    if (!showPanel) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closePanel();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [showPanel]);

  // --- Calendar navigation ---
  const prevMonth = () =>
    setCalendarMonth((p) =>
      p.month === 0 ? { year: p.year - 1, month: 11 } : { year: p.year, month: p.month - 1 },
    );
  const nextMonth = () =>
    setCalendarMonth((p) =>
      p.month === 11 ? { year: p.year + 1, month: 0 } : { year: p.year, month: p.month + 1 },
    );

  // --- Calendar day click (identical logic to vehicles page) ---
  const handleCalendarDayClick = (day: number) => {
    const d = dateFromYMD(calendarMonth.year, calendarMonth.month, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (d < today) return;

    // Find first available hour
    let firstAvailableHour = 0;
    const nowDate = new Date();
    for (let h = 0; h < 24; h++) {
      const checkDate = new Date(d);
      checkDate.setHours(h, 0, 0, 0);
      const isPast = checkDate < nowDate;
      const isOccupied = existingReservations.some((r) => {
        // Exclude the reservation being edited
        if (editingService && r.id === editingService.id) return false;
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
      if (d < selectedStart) {
        setSelectedStart(d);
        setSelectingTimeFor("start");
      } else {
        setSelectedEnd(d);
        setSelectingTimeFor("end");
      }
    }
  };

  // --- Time click (identical logic to vehicles page) ---
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

      const filteredReservations = editingService
        ? existingReservations.filter((r) => r.id !== editingService.id)
        : existingReservations;

      if (selectedStart && doesRangeOverlap(selectedStart, newEnd, filteredReservations)) {
        setFieldErrors({ range: "Wybrany termin pokrywa się z istniejącą rezerwacją." });
        return;
      }

      setSelectedEnd(newEnd);
      setSelectingTimeFor(null);
      setFieldErrors({});
    }
  };

  // --- Submit ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!selectedStart) errors.start = "Wybierz datę rozpoczęcia.";
    if (!selectedEnd) errors.end = "Wybierz datę zakończenia.";
    if (selectedStart && selectedEnd && selectedEnd <= selectedStart) {
      errors.end = "Data zakończenia musi być późniejsza niż rozpoczęcia.";
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsSubmitting(true);
    try {
      if (editingService) {
        await caretakerPanelApi.editServiceReservation(vehicleId, editingService.id, {
          date_start_planned: toISODateString(selectedStart!),
          date_end_planned: toISODateString(selectedEnd!),
          service_name: serviceName || null,
        });
        toast("success", "Rezerwacja serwisowa zaktualizowana!");
      } else {
        await caretakerPanelApi.createServiceReservation(vehicleId, {
          date_start_planned: toISODateString(selectedStart!),
          date_end_planned: toISODateString(selectedEnd!),
          purpose: "service",
          price: 0,
          vehicle_id: vehicleId,
          worker_id: 0,
          service_name: serviceName || null,
        });
        toast("success", "Rezerwacja serwisowa utworzona!");
      }
      closePanel();
      fetchServices();
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "Błąd.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Calendar render (identical to vehicles page) ---
  const renderCalendar = () => {
    const { year, month } = calendarMonth;
    const totalDays = daysInMonth(year, month);
    const fdom = firstDayOfMonth(year, month);
    const startOffset = fdom === 0 ? 6 : fdom - 1; // Monday start
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Build blocked dates set
    const blockedDates = new Set<string>();
    for (const r of existingReservations) {
      if (editingService && r.id === editingService.id) continue;
      const s = new Date(r.date_start_planned);
      const e = new Date(r.date_end_planned);
      const cur = new Date(s);
      while (cur <= e) {
        blockedDates.add(`${cur.getFullYear()}-${cur.getMonth()}-${cur.getDate()}`);
        cur.setDate(cur.getDate() + 1);
      }
    }

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
            ${past ? "opacity-30 cursor-not-allowed" : "hover:bg-white/10 cursor-pointer text-white/70"}
            ${selected ? "!text-white !bg-purple-500 shadow-[0_0_15px_rgba(139,92,246,0.5)]" : ""}
            ${inRange ? "bg-purple-500/20 text-purple-300" : ""}
          `}
        >
          {d}
          {hasReservation && !selected && (
            <div className="absolute bottom-1 w-1 h-1 rounded-full bg-purple-400/50" />
          )}
        </button>,
      );
    }
    return cells;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-black text-white">Nadchodzące Serwisy</h2>
        <button
          type="button"
          onClick={openCreatePanel}
          className="px-6 py-3 text-xs font-black uppercase tracking-widest rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:from-cyan-500 hover:to-blue-500 transition-all shadow-lg shadow-cyan-500/20"
        >
          + Zaplanuj serwis
        </button>
      </div>

      {/* Service list */}
      {loading && (
        <div className="glass-surface rounded-2xl p-12 text-center">
          <p className="text-gray-400">Ładowanie serwisów...</p>
        </div>
      )}

      {!loading && services.length === 0 && (
        <div className="glass-surface rounded-2xl p-12 text-center">
          <svg className="w-12 h-12 mx-auto text-white/10 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
          </svg>
          <p className="text-gray-400 font-medium">Brak zaplanowanych serwisów dla tego pojazdu.</p>
        </div>
      )}

      {!loading && services.length > 0 && (
        <div className="space-y-4">
          {services.map((svc) => {
            const svcName = svc.service_name || null;
            return (
              <div key={svc.id} className="glass-surface rounded-2xl p-6 border border-white/5">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-xs font-black text-gray-400">#{svc.id}</span>
                      {svcName && (
                        <span className="text-sm font-bold text-white">{svcName}</span>
                      )}
                      <div className="px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                        Serwis
                      </div>
                      {svc.state === "completed" ? (
                        <div className="px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg bg-stone-500/10 text-stone-400 border border-stone-500/20">
                          Zakończony
                        </div>
                      ) : svc.state === "canceled" ? (
                        <div className="px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
                          Anulowany
                        </div>
                      ) : (
                        <div className="px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Zaplanowany
                        </div>
                      )}
                    </div>
                    {!svcName && (
                      <p className="text-sm font-bold text-gray-300">Serwis #{svc.id}</p>
                    )}
                    <p className="text-sm font-bold text-white">
                      {new Date(svc.date_start_planned).toLocaleDateString("pl-PL", {
                        day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
                      })}
                      {" – "}
                      {new Date(svc.date_end_planned).toLocaleDateString("pl-PL", {
                        day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
                      })}
                    </p>
                  </div>
                  {svc.state === "created" && (
                    <button
                      type="button"
                      onClick={() => openEditPanel(svc)}
                      className="px-4 py-2 text-xs font-black uppercase tracking-widest rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 transition-colors"
                    >
                      Edytuj
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* --- SIDE PANEL (identical structure to vehicles page) --- */}
      {showPanel && (
        <div className="fixed inset-x-0 top-16 bottom-0 z-[100] flex justify-end" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity" onClick={closePanel} />

          <div className="relative z-10 w-full md:w-[35rem] h-full bg-[#0d0f14] shadow-[-20px_0_60px_rgba(0,0,0,0.5)] animate-slide-in flex flex-col border-l border-white/5">
            {/* Header */}
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-black/20">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-cyan-400">
                  <span>{editingService ? "Edycja Serwisu" : "Planowanie Serwisu"}</span>
                  {editingService && (
                    <>
                      <span className="w-1 h-1 rounded-full bg-white/20" />
                      <span className="text-white/40">#{editingService.id}</span>
                    </>
                  )}
                </div>
                <h2 className="text-2xl font-black text-white">
                  {editingService ? "Edytuj serwis" : "Nowy serwis"}
                </h2>
              </div>
              <button onClick={closePanel} className="p-3 rounded-2xl hover:bg-white/5 transition-colors text-white/40 hover:text-white">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <form onSubmit={handleSubmit} className="p-8 flex-1 overflow-y-auto custom-scrollbar space-y-10">
              {/* Service name input */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
                  Nazwa serwisu
                </label>
                <input
                  type="text"
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  placeholder="np. Wymiana opon, Przegląd techniczny..."
                  className="w-full bg-white/5 border border-white/10 text-white rounded-2xl py-4 px-5 text-sm font-medium placeholder:text-white/20 focus:outline-none focus:border-cyan-500/50 transition-colors"
                />
              </div>

              {/* Calendar section (identical to vehicles page) */}
              <div className="space-y-6 pt-4">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/30">
                    Kalendarz Serwisu
                  </label>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={prevMonth} className="p-2 hover:bg-white/5 rounded-lg transition-colors text-white/40 hover:text-white">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <span className="text-xs font-black uppercase tracking-widest text-white/80 w-32 text-center">
                      {MONTHS_PL[calendarMonth.month]} {calendarMonth.year}
                    </span>
                    <button type="button" onClick={nextMonth} className="p-2 hover:bg-white/5 rounded-lg transition-colors text-white/40 hover:text-white">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="bg-black/20 rounded-[2rem] p-6 border border-white/5">
                  <div className="grid grid-cols-7 mb-4">
                    {DAYS_PL.map((d) => (
                      <div key={d} className="text-[9px] font-black uppercase text-white/20 text-center">
                        {d}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: firstDayOfMonth(calendarMonth.year, calendarMonth.month) }).map((_, i) => (
                      <div key={`empty-${i}`} />
                    ))}
                    {renderCalendar()}
                  </div>
                </div>

                {/* Hour picker (identical to vehicles page) */}
                {selectingTimeFor && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black uppercase tracking-widest text-purple-400">
                        Wybierz godzinę {selectingTimeFor === "start" ? "rozpoczęcia" : "zakończenia"}
                      </label>
                      <button
                        type="button"
                        onClick={() => setSelectingTimeFor(null)}
                        className="text-[10px] font-bold text-white/40 hover:text-white transition-colors"
                      >
                        Anuluj
                      </button>
                    </div>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                      {Array.from({ length: 24 }).map((_, i) => {
                        const hourDate = new Date(
                          selectingTimeFor === "start" ? selectedStart! : selectedEnd!,
                        );
                        hourDate.setHours(i, 0, 0, 0);

                        const isPast = hourDate < new Date();
                        const isOccupied = existingReservations.some((r) => {
                          if (editingService && r.id === editingService.id) return false;
                          const s = new Date(r.date_start_planned);
                          const e = new Date(r.date_end_planned);
                          return hourDate >= s && hourDate < e;
                        });
                        const isSelected =
                          selectingTimeFor === "start"
                            ? selectedStart && selectedStart.getHours() === i
                            : selectedEnd && selectedEnd.getHours() === i;

                        return (
                          <button
                            key={i}
                            type="button"
                            disabled={isPast || isOccupied}
                            onClick={() => handleTimeClick(i)}
                            className={`py-2.5 rounded-xl text-[10px] font-black transition-all border
                              ${isPast || isOccupied
                                ? "bg-white/5 border-transparent text-white/10 cursor-not-allowed"
                                : "bg-white/5 border-white/5 text-white/60 hover:border-purple-500/50 hover:text-white"}
                              ${isSelected
                                ? "!bg-purple-500 !border-purple-500 !text-white shadow-[0_0_15px_rgba(139,92,246,0.3)]"
                                : ""}
                            `}
                          >
                            {String(i).padStart(2, "0")}:00
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Selected period display */}
                <div className="flex items-center justify-between px-2 pt-2">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black uppercase tracking-widest text-white/30">
                      Wybrany Okres
                    </span>
                    <span className="text-xs font-bold text-white/80">
                      {selectedStart
                        ? `${selectedStart.toLocaleDateString("pl-PL")} ${String(selectedStart.getHours()).padStart(2, "0")}:00`
                        : "..."}{" "}
                      —{" "}
                      {selectedEnd
                        ? `${selectedEnd.toLocaleDateString("pl-PL")} ${String(selectedEnd.getHours()).padStart(2, "0")}:00`
                        : "..."}
                    </span>
                  </div>
                </div>
              </div>
            </form>

            {/* Footer (identical structure to vehicles page) */}
            <div className="p-8 border-t border-white/5 bg-black/20 space-y-6">
              {fieldErrors.range && (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
                  {fieldErrors.range}
                </div>
              )}

              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || !selectedStart || !selectedEnd}
                className="w-full py-4 text-sm font-black uppercase tracking-widest rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:from-cyan-500 hover:to-blue-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg shadow-cyan-500/20"
              >
                {isSubmitting
                  ? "Zapisywanie..."
                  : editingService
                    ? "Zapisz zmiany"
                    : "Zatwierdź serwis"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
