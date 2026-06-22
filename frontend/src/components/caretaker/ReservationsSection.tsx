"use client";

import { useState, useEffect } from "react";
import { caretakerPanelApi } from "@/lib/api/caretaker_panel";
import { reservationApi } from "@/lib/api/reservation";
import type { PanelReservationPublic } from "@/types/caretaker_panel_types";
import type { ReservationUpdate, ReservationState, Purpose } from "@/types/reservation_types";

interface ReservationsSectionProps {
  vehicleId: number;
  reservations: PanelReservationPublic[];
  onRefresh: () => void;
  toast: (type: "success" | "error", message: string) => void;
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

const PURPOSE_LABELS: Record<string, string> = {
  business: "Służbowy",
  private: "Prywatny",
  service: "Serwis",
};

export default function ReservationsSection({
  vehicleId,
  reservations,
  onRefresh,
  toast,
}: ReservationsSectionProps) {
  const [cancelingId, setCancelingId] = useState<number | null>(null);
  const [confirmCancelId, setConfirmCancelId] = useState<number | null>(null);
  const [acceptingId, setAcceptingId] = useState<number | null>(null);

  // --- Stany panelu edycji ---
  const [showPanel, setShowPanel] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // --- Stany formularza ---
  const [formData, setFormData] = useState<ReservationUpdate>({});
  const isCanceled = formData.state === "canceled";

  // Obsługa Escape
  useEffect(() => {
    if (!showPanel) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closePanel();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [showPanel]);

  const openEditPanel = (r: PanelReservationPublic) => {
    setEditingId(r.id);

    const formatForInput = (isoString?: string | null) => {
      if (!isoString) return "";
      return isoString.slice(0, 16);
    };

    setFormData({
      purpose: r.purpose as Purpose,
      state: r.state as ReservationState,
      price: r.price,
      distance: r.distance || 0,
      date_start_planned: formatForInput(r.date_start_planned),
      date_end_planned: formatForInput(r.date_end_planned),
      date_start: formatForInput(r.date_start),
      date_end: formatForInput(r.date_end),
      state_start: r.state_start || "",
      state_end: r.state_end || "",
    });

    setShowDeleteConfirm(false);
    setShowPanel(true);
  };

  const closePanel = () => {
    setShowPanel(false);
    setEditingId(null);
    setFormData({});
    setShowDeleteConfirm(false);
  };

  const handleFormChange = (field: keyof ReservationUpdate, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value === "" ? null : value }));
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;

    // Prosta walidacja dat planowanych
    if (formData.date_start_planned && formData.date_end_planned) {
      if (new Date(formData.date_end_planned) <= new Date(formData.date_start_planned)) {
        toast("error", "Data zakończenia musi być późniejsza niż data rozpoczęcia.");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const payload: ReservationUpdate = {
        ...formData,
        date_start_planned: formData.date_start_planned ? new Date(formData.date_start_planned).toISOString() : null,
        date_end_planned: formData.date_end_planned ? new Date(formData.date_end_planned).toISOString() : null,
        date_start: formData.date_start ? new Date(formData.date_start).toISOString() : null,
        date_end: formData.date_end ? new Date(formData.date_end).toISOString() : null,
      };

      await reservationApi.update(editingId, payload);
      toast("success", "Rezerwacja została zaktualizowana.");
      closePanel();
      onRefresh();
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "Błąd aktualizacji rezerwacji.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!editingId) return;
    setIsDeleting(true);
    try {
      await reservationApi.delete(editingId);
      toast("success", "Rezerwacja została całkowicie usunięte.");
      closePanel();
      onRefresh();
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "Błąd usuwania rezerwacji.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAccept = async (reservationId: number) => {
    setAcceptingId(reservationId);
    try {
      await caretakerPanelApi.acceptReservation(vehicleId, reservationId);
      toast("success", "Rezerwacja została zaakceptowana.");
      onRefresh();
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "Błąd akceptacji rezerwacji.");
    } finally {
      setAcceptingId(null);
    }
  };

  const handleCancel = async (reservationId: number) => {
    setCancelingId(reservationId);
    try {
      await caretakerPanelApi.cancelReservation(vehicleId, reservationId);
      toast("success", "Rezerwacja została anulowana.");
      setConfirmCancelId(null);
      onRefresh();
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "Błąd anulowania rezerwacji.");
    } finally {
      setCancelingId(null);
    }
  };

  const nonServiceReservations = reservations.filter((r) => r.purpose !== "service");

  return (
    <div className="space-y-6 relative">
      <h2 className="text-xl font-black text-white">Rezerwacje pojazdu</h2>

      {nonServiceReservations.length === 0 && (
        <div className="glass-surface rounded-2xl p-12 text-center">
          <svg className="w-12 h-12 mx-auto text-white/10 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
          </svg>
          <p className="text-gray-400 font-medium">Brak rezerwacji dla tego pojazdu.</p>
        </div>
      )}

      <div className="space-y-4">
        {nonServiceReservations.map((r) => {
          const stateStyle = STATE_COLORS[r.state] || STATE_COLORS.created;
          const isCancelable = !["completed", "canceled"].includes(r.state);

          return (
            <div key={r.id} className="glass-surface rounded-2xl p-6 border border-white/5">
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-xs font-black text-gray-400">#{r.id}</span>
                    <div
                      className="px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg flex items-center gap-1.5"
                      style={{ background: stateStyle.bg, color: stateStyle.text }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: stateStyle.dot }} />
                      {STATE_LABELS[r.state] || r.state}
                    </div>
                    <div className="px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      {PURPOSE_LABELS[r.purpose] || r.purpose}
                    </div>
                  </div>
                  <p className="text-sm font-bold text-white">
                    {new Date(r.date_start_planned).toLocaleDateString("pl-PL", {
                      day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
                    })}
                    {" – "}
                    {new Date(r.date_end_planned).toLocaleDateString("pl-PL", {
                      day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
                    })}
                  </p>
                  <div className="flex flex-wrap gap-4 text-xs">
                    <div>
                      <span className="text-gray-500">Pracownik: </span>
                      <span className="font-bold text-gray-300">{r.worker_name}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Cena: </span>
                      <span className="font-bold text-gray-300">{r.price} PLN</span>
                    </div>
                    {r.distance !== null && (
                      <div>
                        <span className="text-gray-500">Dystans: </span>
                        <span className="font-bold text-gray-300">{r.distance} km</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {r.state === "created" && confirmCancelId !== r.id && (
                    <button
                      type="button"
                      onClick={() => handleAccept(r.id)}
                      disabled={acceptingId === r.id}
                      className="px-4 py-2 text-xs font-black uppercase tracking-widest rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 disabled:opacity-50 transition-colors"
                    >
                      {acceptingId === r.id ? "..." : "Akceptuj"}
                    </button>
                  )}
                  {isCancelable && (
                    confirmCancelId === r.id ? (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setConfirmCancelId(null)}
                          className="px-4 py-2 text-xs font-bold rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-white/60"
                        >
                          Cofnij
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCancel(r.id)}
                          disabled={cancelingId === r.id}
                          className="px-4 py-2 text-xs font-black uppercase tracking-widest rounded-xl bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
                        >
                          {cancelingId === r.id ? "..." : "Odrzuć"}
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmCancelId(r.id)}
                        className="px-4 py-2 text-xs font-black uppercase tracking-widest rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
                      >
                        Odrzuć
                      </button>
                    )
                  )}

                  <button
                    type="button"
                    onClick={() => openEditPanel(r)}
                    className="px-4 py-2 text-xs font-black uppercase tracking-widest rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/20 transition-colors"
                  >
                    Edytuj
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* --- PANEL EDYCJI REZERWACJI --- */}
      {showPanel && (
        <div className="fixed inset-x-0 top-16 bottom-0 z-[100] flex justify-end" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity" onClick={closePanel} />

          <div className="relative z-10 w-full md:w-[35rem] h-full bg-[#0d0f14] shadow-[-20px_0_60px_rgba(0,0,0,0.5)] animate-slide-in flex flex-col border-l border-white/5">

            {/* Header panelu */}
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-black/20">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-purple-400">
                  <span>Edycja Rezerwacji</span>
                  <span className="w-1 h-1 rounded-full bg-white/20" />
                  <span className="text-white/40">#{editingId}</span>
                </div>
                <h2 className="text-2xl font-black text-white">Edytuj parametry</h2>
              </div>
              <button onClick={closePanel} className="p-3 rounded-2xl hover:bg-white/5 transition-colors text-white/40 hover:text-white">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Zawartość formularza */}
            <form id="reservation-form" onSubmit={handleUpdateSubmit} className="p-8 flex-1 overflow-y-auto custom-scrollbar space-y-8">

              {isCanceled && (
                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-center">
                  <p className="text-xs font-bold text-red-400">
                    Ta rezerwacja jest anulowana. Edycja parametrów została zablokowana. Możesz ją jedynie usunąć z systemu.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-6">
                {/* Status */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Status</label>
                  <select
                    value={formData.state || ""}
                    onChange={(e) => handleFormChange("state", e.target.value)}
                    disabled={isCanceled}
                    className="w-full appearance-none bg-white/5 border border-white/10 text-white rounded-2xl py-3 px-4 text-sm font-medium focus:outline-none focus:border-purple-500/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="created" className="bg-[#0d0f14]">Utworzona</option>
                    <option value="accepted" className="bg-[#0d0f14]">Zaakceptowana</option>
                    <option value="in_progress" className="bg-[#0d0f14]">W trakcie</option>
                    <option value="completed" className="bg-[#0d0f14]">Zakończona</option>
                  </select>
                </div>

                {/* Cel */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Cel Rezerwacji</label>
                  <select
                    value={formData.purpose || ""}
                    onChange={(e) => handleFormChange("purpose", e.target.value)}
                    disabled={isCanceled}
                    className="w-full appearance-none bg-white/5 border border-white/10 text-white rounded-2xl py-3 px-4 text-sm font-medium focus:outline-none focus:border-purple-500/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="business" className="bg-[#0d0f14]">Służbowy</option>
                    <option value="private" className="bg-[#0d0f14]">Prywatny</option>
                  </select>
                </div>
              </div>

              <div className="h-px w-full bg-white/5" />

              <div className="grid grid-cols-2 gap-6">
                {/* Data start planned */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Planowany Start</label>
                  <input
                    type="datetime-local"
                    value={formData.date_start_planned || ""}
                    onChange={(e) => handleFormChange("date_start_planned", e.target.value)}
                    required
                    disabled={isCanceled}
                    className="w-full bg-white/5 border border-white/10 text-white rounded-2xl py-3 px-4 text-sm font-medium focus:outline-none focus:border-purple-500/50 transition-colors [color-scheme:dark] disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Data end planned */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Planowany Koniec</label>
                  <input
                    type="datetime-local"
                    value={formData.date_end_planned || ""}
                    onChange={(e) => handleFormChange("date_end_planned", e.target.value)}
                    required
                    disabled={isCanceled}
                    className="w-full bg-white/5 border border-white/10 text-white rounded-2xl py-3 px-4 text-sm font-medium focus:outline-none focus:border-purple-500/50 transition-colors [color-scheme:dark] disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {/* Data start actual */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Faktyczny Start</label>
                  <input
                    type="datetime-local"
                    value={formData.date_start || ""}
                    onChange={(e) => handleFormChange("date_start", e.target.value)}
                    disabled={isCanceled}
                    className="w-full bg-white/5 border border-white/10 text-white rounded-2xl py-3 px-4 text-sm font-medium focus:outline-none focus:border-purple-500/50 transition-colors [color-scheme:dark] disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Data end actual */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Faktyczny Koniec</label>
                  <input
                    type="datetime-local"
                    value={formData.date_end || ""}
                    onChange={(e) => handleFormChange("date_end", e.target.value)}
                    disabled={isCanceled}
                    className="w-full bg-white/5 border border-white/10 text-white rounded-2xl py-3 px-4 text-sm font-medium focus:outline-none focus:border-purple-500/50 transition-colors [color-scheme:dark] disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="h-px w-full bg-white/5" />

              <div className="grid grid-cols-2 gap-6">
                {/* Cena */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Cena (PLN)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price ?? ""}
                    onChange={(e) => handleFormChange("price", parseFloat(e.target.value))}
                    disabled={isCanceled}
                    className="w-full bg-white/5 border border-white/10 text-white rounded-2xl py-3 px-4 text-sm font-medium focus:outline-none focus:border-purple-500/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Dystans */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Dystans (km)</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={formData.distance ?? ""}
                    onChange={(e) => handleFormChange("distance", parseInt(e.target.value))}
                    disabled={isCanceled}
                    className="w-full bg-white/5 border border-white/10 text-white rounded-2xl py-3 px-4 text-sm font-medium focus:outline-none focus:border-purple-500/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {/* Stan początkowy */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Uwagi - Start</label>
                  <textarea
                    rows={2}
                    value={formData.state_start || ""}
                    onChange={(e) => handleFormChange("state_start", e.target.value)}
                    disabled={isCanceled}
                    className="w-full bg-white/5 border border-white/10 text-white rounded-2xl py-3 px-4 text-sm font-medium focus:outline-none focus:border-purple-500/50 transition-colors resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Stan końcowy */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Uwagi - Koniec</label>
                  <textarea
                    rows={2}
                    value={formData.state_end || ""}
                    onChange={(e) => handleFormChange("state_end", e.target.value)}
                    disabled={isCanceled}
                    className="w-full bg-white/5 border border-white/10 text-white rounded-2xl py-3 px-4 text-sm font-medium focus:outline-none focus:border-purple-500/50 transition-colors resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

            </form>

            {/* Footer panelu */}
            <div className="p-8 border-t border-white/5 bg-black/20 space-y-6">
              {!isCanceled && (
                <button
                  type="submit"
                  form="reservation-form"
                  disabled={isSubmitting}
                  className="w-full py-4 text-sm font-black uppercase tracking-widest rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-500 hover:to-blue-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg shadow-purple-500/20"
                >
                  {isSubmitting ? "Zapisywanie..." : "Zapisz Zmiany"}
                </button>
              )}

              {!showDeleteConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full py-4 text-xs font-black uppercase tracking-widest text-red-400/60 hover:text-red-400 transition-colors"
                >
                  Usuń rezerwację całkowicie
                </button>
              ) : (
                <div className="p-6 rounded-3xl bg-red-500/5 border border-red-500/10 space-y-4 animate-in fade-in zoom-in duration-300">
                  <p className="text-sm font-bold text-red-400 text-center">Czy na pewno chcesz usunąć tę rezerwację?</p>
                  <p className="text-[10px] text-red-400/60 text-center uppercase tracking-wider">Tej operacji nie można cofnąć.</p>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 py-3 rounded-xl bg-white/5 text-xs font-bold hover:bg-white/10 transition-colors text-white"
                    >
                      Cofnij
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="flex-1 py-3 rounded-xl bg-red-500 text-xs font-black text-white hover:bg-red-600 shadow-lg shadow-red-500/20 disabled:opacity-50"
                    >
                      {isDeleting ? "..." : "Tak, usuń"}
                    </button>
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