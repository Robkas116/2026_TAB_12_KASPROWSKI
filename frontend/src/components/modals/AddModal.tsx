import { useEffect, useState } from "react";
import { OPTIONAL_FIELDS } from "@/lib/forms";
import { versionApi } from "@/lib/api/version";
import type { EntityType } from "@/types";

interface AddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newData: Record<string, unknown>) => void;
  entityType: string;
  initialState: Record<string, string>;
}

export default function AddModal({
  isOpen,
  onClose,
  onSuccess,
  entityType,
  initialState,
}: AddModalProps) {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [versions, setVersions] = useState<Array<{ id: number; destination: string }>>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);

  useEffect(() => {
    if (isOpen && initialState) {
      setFormData({ ...initialState });
      setFieldErrors({});
      setSubmitted(false);
    }
  }, [isOpen, initialState]);

  useEffect(() => {
    if (!isOpen || entityType !== "Set_Of_Equipment") return;
    const fetchVersions = async () => {
      setLoadingVersions(true);
      try {
        const result = await versionApi.getAll();
        const items = Array.isArray(result) ? result : (result as any)?.data || [];
        setVersions(items);
      } catch {
        setVersions([]);
      } finally {
        setLoadingVersions(false);
      }
    };
    fetchVersions();
  }, [isOpen, entityType]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  if (!isOpen || !initialState) return null;

  const fields = Object.keys(initialState);
  const optionalFieldsForEntity = OPTIONAL_FIELDS[entityType as EntityType] || new Set();

  const getInputType = (field: string) => {
    if (field=== "date_start" || field === "date_end" || field === "date") return "date";
    if(field.includes("date")) return "datetime-local";
    if (field === "price" || field.endsWith("_id") || field === "distance") return "number";
    return "text";
  };

  const validateField = (field: string, value: string): string => {
    if (!optionalFieldsForEntity.has(field) && !value.trim()) {
      return `Pole "${field.replace(/_/g, " ")}" jest wymagane.`;
    }
    if (field === "email" && value && !value.includes("@")) {
      return "Proszę podać poprawny adres email.";
    }
    return "";
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (submitted || fieldErrors[name]) {
      const error = validateField(name, value);
      setFieldErrors((prev) => {
        const next = { ...prev };
        if (error) next[name] = error;
        else delete next[name];
        return next;
      });
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);

    const errors: Record<string, string> = {};
    for (const field of fields) {
      const err = validateField(field, formData[field] || "");
      if (err) errors[field] = err;
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    const normalizedData = Object.fromEntries(
      Object.entries(formData).map(([key, value]) => {
        if ((key.endsWith("_id") || key === "price" || key === "distance") && value !== "") {
          return [key, Number(value)];
        }
        if (key.includes("date") && value) {
          return [key, new Date(value).toISOString()];
        }
        return [key, value];
      }),
    );

    onSuccess(normalizedData);
  };

  // Translate entity type for display
  const entityLabel = (() => {
    const map: Record<string, string> = {
      Makes: "markę",
      Vehicles: "pojazd",
      Workers: "pracownika",
      Reservations: "rezerwację",
      Models: "model",
      Actions: "akcję",
      Equipments: "wyposażenie",
      SetOfEquipments: "zestaw",
      Versions: "wersję",
    };
    return map[entityType] || entityType;
  })();

  return (
    <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }}>
      {/* Backdrop click to close */}
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      <div 
          className="rounded-2xl w-full max-w-md p-6 relative z-10 shadow-2xl max-h-[90vh] overflow-y-auto"
          style={{ backgroundColor: "var(--color-background, #111827)" }}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>
            Dodaj {entityLabel}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer p-1.5 rounded-lg transition-colors hover:bg-white/5"
            style={{ color: "var(--color-text-muted)" }}
            aria-label="Zamknij"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {fields.map((field) => {
            const isOptional = optionalFieldsForEntity.has(field);
            const hasError = !!fieldErrors[field];

            return (
              <div key={field}>
                <label
                  htmlFor={`add-${field}`}
                  className="block text-sm font-medium mb-1.5"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  {field.replace(/_/g, " ")}
                  {isOptional && (
                    <span className="ml-1 text-xs" style={{ color: "var(--color-text-muted)" }}>
                      (opcjonalne)
                    </span>
                  )}
                </label>

                {field === "purpose" ? (
                  <select
                    id={`add-${field}`}
                    name={field}
                    value={formData[field] || "business"}
                    onChange={handleChange}
                    className={`input-dark ${hasError ? "input-error" : ""}`}
                    required={!isOptional}
                  >
                    <option value="business">Biznesowy</option>
                    <option value="private">Prywatny</option>
                  </select>
                ) : field === "state" ? (
                  <select
                    id={`add-${field}`}
                    name={field}
                    value={formData[field] || "created"}
                    onChange={handleChange}
                    className={`input-dark ${hasError ? "input-error" : ""}`}
                    required={!isOptional}
                  >
                    <option value="created">Utworzona</option>
                    <option value="accepted">Zaakceptowana</option>
                    <option value="in_progress">W trakcie</option>
                    <option value="completed">Zakończona</option>
                    <option value="canceled">Anulowana</option>
                  </select>
                ) : field === "version_id" ? (
                  <div className="relative">
                    <select
                      id={`add-${field}`}
                      name={field}
                      value={formData[field] || ""}
                      onChange={handleChange}
                      disabled={loadingVersions}
                      className={`w-full px-4 py-2.5 rounded-lg appearance-none cursor-pointer transition-all font-medium text-sm pr-10 ${hasError ? "input-error" : "input-dark"}`}
                      style={{
                        background: "var(--color-input-bg)",
                        color: "var(--color-text-primary)",
                        border: `1px solid var(--color-border)`,
                        maxHeight: "200px",
                      }}
                      required={!isOptional}
                    >
                      <option value="" className="bg-gray-900 text-white">
                        Wybierz wersję...
                      </option>
                      {versions.map((v) => (
                        <option key={v.id} value={v.id} className="bg-gray-900 text-white">
                          {v.destination}
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
                ) : (
                  <input
                    id={`add-${field}`}
                    type={getInputType(field)}
                    step={field === "price" || field === "distance" ? "1" : undefined}
                    name={field}
                    value={formData[field] || ""}
                    onChange={handleChange}
                    className={`input-dark ${hasError ? "input-error" : ""}`}
                    required={!isOptional}
                    aria-invalid={hasError}
                    aria-describedby={hasError ? `add-error-${field}` : undefined}
                  />
                )}

                {hasError && (
                  <p id={`add-error-${field}`} className="field-error" role="alert">
                    <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {fieldErrors[field]}
                  </p>
                )}
              </div>
            );
          })}

          <div className="flex justify-end gap-3 pt-4 border-t" style={{ borderColor: "var(--color-border)" }}>
            <button type="button" onClick={onClose} className="cursor-pointer btn-ghost">
              Anuluj
            </button>
            <button type="submit" className="cursor-pointer btn-primary">
              Zapisz
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
