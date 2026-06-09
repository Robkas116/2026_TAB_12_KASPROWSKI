interface DataTableProps {
  items: Record<string, unknown>[];
  onEdit: (item: unknown) => void;
  onDelete: (id: number) => void;
  onAddEquipmentToSet?: (setId: number) => void;
  onRemoveEquipmentFromSet?: (setId: number) => void;
}

export default function DataTable({ items, onEdit, onDelete, onAddEquipmentToSet, onRemoveEquipmentFromSet }: DataTableProps) {
  if (!items || items.length === 0) return null;

  const columns = Object.keys(items[0]);

  return (
    <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "var(--color-border)" }}>
      {/* Desktop table */}
      <table className="min-w-full text-left text-sm hidden md:table">
        <thead>
          <tr style={{ borderBottom: `1px solid var(--color-border)` }}>
            {columns.map((col) => (
              <th
                key={col}
                scope="col"
                className="px-4 py-3 text-xs font-semibold uppercase tracking-wider"
                style={{ color: "var(--color-text-muted)" }}
              >
                {col.replace(/_/g, " ")}
              </th>
            ))}
            <th
              scope="col"
              className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-right"
              style={{ color: "var(--color-text-muted)" }}
            >
              Akcje
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => {
            const rowId = item.id ? `row-${item.id}` : `row-${index}`;
            return (
              <tr
                key={rowId}
                className="transition-colors"
                style={{ borderBottom: `1px solid var(--color-border)` }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "var(--color-overlay)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                }}
              >
                {columns.map((col) => (
                  <td
                    key={`${rowId}-${col}`}
                    className="px-4 py-3 truncate max-w-[16rem]"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    {Array.isArray(item[col])
                      ? item[col].map((eq: Record<string, unknown>) => eq.name).join(", ")
                      : String(item[col] ?? "—")}
                  </td>
                ))}
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => onEdit(item)}
                      className="cursor-pointer inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all hover:-translate-y-px"
                      style={{
                        background: "var(--color-accent-glow)",
                        color: "var(--color-accent-soft)",
                      }}
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edytuj
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(item.id as number)}
                      className="cursor-pointer inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all hover:-translate-y-px"
                      style={{
                        background: "var(--color-error-soft)",
                        color: "var(--color-error)",
                      }}
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Usuń
                    </button>
                    {onAddEquipmentToSet && (
                      <button
                        type="button"
                        onClick={() => onAddEquipmentToSet(item.id as number)}
                        className="cursor-pointer inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all hover:-translate-y-px"
                        style={{
                          background: "rgba(59, 130, 246, 0.1)",
                          color: "rgb(59, 130, 246)",
                        }}
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        +Wyp
                      </button>
                    )}
                    {onRemoveEquipmentFromSet && (
                      <button
                        type="button"
                        onClick={() => onRemoveEquipmentFromSet(item.id as number)}
                        className="cursor-pointer inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all hover:-translate-y-px"
                        style={{
                          background: "rgba(251, 191, 36, 0.1)",
                          color: "rgb(251, 146, 60)",
                        }}
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                        -Wyp
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Mobile: card layout */}
      <div className="md:hidden divide-y" style={{ borderColor: "var(--color-border)" }}>
        {items.map((item, index) => {
          const rowId = item.id ? `card-${item.id}` : `card-${index}`;
          return (
            <div key={rowId} className="p-4 space-y-2">
              {columns.map((col) => (
                <div key={`${rowId}-${col}`} className="flex justify-between items-start gap-2">
                  <span className="text-xs font-medium uppercase shrink-0" style={{ color: "var(--color-text-muted)" }}>
                    {col.replace(/_/g, " ")}
                  </span>
                  <span className="text-sm text-right" style={{ color: "var(--color-text-secondary)" }}>
                    {Array.isArray(item[col])
                      ? item[col].map((eq: Record<string, unknown>) => eq.name).join(", ")
                      : String(item[col] ?? "—")}
                  </span>
                </div>
              ))}
              <div className="flex justify-end gap-1.5 pt-2">
                <button
                  type="button"
                  onClick={() => onEdit(item)}
                  className="cursor-pointer inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium"
                  style={{
                    background: "var(--color-accent-glow)",
                    color: "var(--color-accent-soft)",
                  }}
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edytuj
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(item.id as number)}
                  className="cursor-pointer inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium"
                  style={{
                    background: "var(--color-error-soft)",
                    color: "var(--color-error)",
                  }}
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Usuń
                </button>
                {onAddEquipmentToSet && (
                  <button
                    type="button"
                    onClick={() => onAddEquipmentToSet(item.id as number)}
                    className="cursor-pointer inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium"
                    style={{
                      background: "rgba(59, 130, 246, 0.1)",
                      color: "rgb(59, 130, 246)",
                    }}
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    +Wyp
                  </button>
                )}
                {onRemoveEquipmentFromSet && (
                  <button
                    type="button"
                    onClick={() => onRemoveEquipmentFromSet(item.id as number)}
                    className="cursor-pointer inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium"
                    style={{
                      background: "rgba(251, 191, 36, 0.1)",
                      color: "rgb(251, 146, 60)",
                    }}
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                    -Wyp
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
