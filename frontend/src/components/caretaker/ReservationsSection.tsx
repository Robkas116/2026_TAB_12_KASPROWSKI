"use client";

import { useState } from "react";
import { caretakerPanelApi } from "@/lib/api/caretaker_panel";
import type { PanelReservationPublic } from "@/types/caretaker_panel_types";

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
    <div className="space-y-6">
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
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
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
                          {cancelingId === r.id ? "..." : "Potwierdź odrzucenie"}
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmCancelId(r.id)}
                        className="px-5 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
                      >
                        Odrzuć
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
