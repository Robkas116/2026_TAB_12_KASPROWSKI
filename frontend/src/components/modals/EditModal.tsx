import { useEffect, useState } from "react";
import { OPTIONAL_FIELDS } from "@/lib/forms";
import type { EntityType } from "@/types";

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedData: Record<string, unknown>) => void;
  entityType: string;
  initialData: Record<string, unknown> | null;
}

export default function EditModal({
  isOpen,
  onClose,
  onSuccess,
  entityType,
  initialData,
}: EditModalProps) {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (initialData) {
      const clean: Record<string, string> = {};
      for (const [key, value] of Object.entries(initialData)) {
        if (key === "id") continue;
        if (key.includes("date") && value && typeof value === "string") {
          const d = new Date(value);
          if (!isNaN(d.getTime())) {
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, "0");
            const day = String(d.getDate()).padStart(2, "0");
            const hours = String(d.getHours()).padStart(2, "0");
            const minutes = String(d.getMinutes()).padStart(2, "0");
            clean[key] = `${year}-${month}-${day}T${hours}:${minutes}`;
          } else {
            clean[key] = value;
          }
        } else {
          clean[key] = value != null ? String(value) : "";
        }
      }
      setFormData(clean);
      setFieldErrors({});
      setSubmitted(false);
    }
  }, [initialData]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  if (!isOpen || !initialData) return null;

  const fields = Object.keys(initialData).filter((key) => key !== "id");
  const optionalFieldsForEntity = OPTIONAL_FIELDS[entityType as EntityType] || new Set();

  const getInputType = (field: string) => {
    if (field.includes("date")) return "datetime-local";
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
        if ((key.endsWith("_id") || key === "price" || key === "distance") && value !== "" && value !== null) {
          return [key, Number(value)];
        }
        if (key.includes("date") && value) {
          if (typeof value === "string" && !value.endsWith("Z")) {
            return [key, new Date(value).toISOString()];
          }
        }
        return [key, value === "" ? null : value];
      }),
    );

    onSuccess(normalizedData);
  };

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
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      <div className="glass-overlay rounded-2xl w-full max-w-md p-6 relative z-10 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>
            Edytuj {entityLabel}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors hover:bg-white/5"
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
                  htmlFor={`edit-${field}`}
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

                <input
                  id={`edit-${field}`}
                  type={getInputType(field)}
                  step={field === "price" || field === "distance" ? "0.01" : undefined}
                  name={field}
                  value={formData[field] || ""}
                  onChange={handleChange}
                  className={`input-dark ${hasError ? "input-error" : ""}`}
                  required={!isOptional}
                  aria-invalid={hasError}
                  aria-describedby={hasError ? `edit-error-${field}` : undefined}
                />

                {hasError && (
                  <p id={`edit-error-${field}`} className="field-error" role="alert">
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
            <button type="button" onClick={onClose} className="btn-ghost">
              Anuluj
            </button>
            <button type="submit" className="btn-primary">
              Zapisz zmiany
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
