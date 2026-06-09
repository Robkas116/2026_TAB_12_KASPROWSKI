import { useState } from "react";
import type { EquipmentPublic } from "@/types/equipment_types";

interface RemoveEquipmentFromSetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (equipmentId: number) => void;
  setOfEquipmentId: number;
  equipmentInSet: EquipmentPublic[];
  isLoading?: boolean;
}

export default function RemoveEquipmentFromSetModal({
  isOpen,
  onClose,
  onSuccess,
  equipmentInSet,
  isLoading = false,
}: RemoveEquipmentFromSetModalProps) {
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEquipmentId.trim()) {
      setError("Proszę wybrać wyposażenie");
      return;
    }
    setError(null);
    onSuccess(Number(selectedEquipmentId));
    setSelectedEquipmentId("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0, 0, 0, 0.7)" }}>
      <div className="rounded-2xl p-6 w-full max-w-md border border-white/10" style={{ background: "var(--color-overlay)" }}>
        <h3 className="text-lg font-bold text-white mb-4">Usuń wyposażenie z setu</h3>

        {equipmentInSet.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
              Ten set nie zawiera żadnego wyposażenia
            </p>
            <button
              onClick={onClose}
              className="mt-4 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer"
              style={{ background: "var(--color-accent)", color: "white" }}
            >
              Zamknij
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="p-3 rounded-lg bg-red-500/10 text-red-400 text-sm">{error}</div>}

            <div className="relative">
              <select
                value={selectedEquipmentId}
                onChange={(e) => setSelectedEquipmentId(e.target.value)}
                disabled={isLoading}
                className="w-full px-4 py-2.5 rounded-lg appearance-none cursor-pointer transition-all font-medium text-sm pr-10 hover:brightness-75"
                style={{
                  background: "var(--color-input-bg)",
                  color: "var(--color-text-primary)",
                  border: `1px solid var(--color-border)`,
                }}
              >
                <option value="" className="bg-gray-900 text-white">
                  Wybierz wyposażenie...
                </option>
                {equipmentInSet.map((eq) => (
                  <option key={eq.id} value={eq.id} className="bg-gray-900 text-white">
                    {eq.name}
                  </option>
                ))}
              </select>
              <svg
                className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none transition-all"
                style={{ color: "var(--color-text-secondary)" }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>

            <style>{`
              select:hover:not(:disabled) ~ svg {
                color: var(--color-text-primary);
              }
            `}</style>

            <div className="flex gap-2 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer hover:brightness-75"
                style={{
                  background: "var(--color-border)",
                  color: "var(--color-text-secondary)",
                }}
              >
                Anuluj
              </button>
              <button
                type="submit"
                disabled={!selectedEquipmentId.trim() || isLoading}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer disabled:opacity-50 hover:brightness-75"
                style={{
                  background: "var(--color-accent)",
                  color: "white",
                }}
              >
                {isLoading ? "Usuwam..." : "Usuń"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
