import { useEffect, useRef } from "react";

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName?: string;
  isDeleting?: boolean;
}

export default function DeleteModal({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  isDeleting = false,
}: DeleteModalProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    cancelRef.current?.focus();

    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isDeleting) onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, isDeleting, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }}>
      <div className="absolute inset-0" onClick={isDeleting ? undefined : onClose} aria-hidden="true" />

      <div 
          className="rounded-2xl w-full max-w-md p-6 relative z-10 shadow-2xl max-h-[90vh] overflow-y-auto"
          style={{ backgroundColor: "var(--color-background, #111827)" }}
      >
        {/* Danger icon */}
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full"
          style={{ background: "var(--color-error-soft)" }}
        >
          <svg className="h-7 w-7" style={{ color: "var(--color-error)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>

        <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--color-text-primary)" }}>
          Potwierdź usunięcie
        </h3>
        <p className="mb-1" style={{ color: "var(--color-text-secondary)" }}>
          Czy na pewno chcesz usunąć{" "}
          <span className="font-semibold" style={{ color: "var(--color-text-primary)" }}>
            {itemName || "ten element"}
          </span>
          ?
        </p>
        <p className="text-xs mb-6" style={{ color: "var(--color-text-muted)" }}>
          Tej operacji nie można cofnąć.
        </p>

        <div className=" cursor-pointer flex justify-center gap-3">
          <button
            ref={cancelRef}
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="cursor-pointer btn-ghost"
          >
            Anuluj
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="cursor-pointer btn-danger"
          >
            {isDeleting ? (
              <>
                <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Usuwanie...
              </>
            ) : (
              "Tak, usuń"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
