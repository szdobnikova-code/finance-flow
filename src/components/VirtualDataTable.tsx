import { useVirtualizer } from "@tanstack/react-virtual";
import { Pencil, Trash2 } from "lucide-react";
import { type ReactNode, useCallback, useRef } from "react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button.tsx";
import { cn } from "@/lib/utils";

export type Column<T> = {
  key: keyof T;
  header: string;
  render?: (value: T[keyof T], row: T) => ReactNode;
  sortable?: boolean;
  shrink?: boolean;
};

type SortState<T> = { key: keyof T; direction: "asc" | "desc" } | null;

type VirtualDataTableProps<T extends { id: string | number }> = {
  data: T[];
  columns: Column<T>[];
  onEdit: (row: T) => void;
  onDelete: (row: T) => void;
};

export function VirtualDataTable<T extends { id: string | number }>({
  data,
  columns,
  onEdit,
  onDelete,
}: VirtualDataTableProps<T>) {
  const [sort, setSort] = useState<SortState<T>>(null);

  const sorted = useMemo(() => {
    if (!sort) return data;
    const { key, direction } = sort;
    const sign = direction === "asc" ? 1 : -1;
    return [...data].sort((a, b) => {
      const av = a[key] as unknown;
      const bv = b[key] as unknown;
      if (typeof av === "number" && typeof bv === "number") {
        return (av - bv) * sign;
      }
      return String(av).localeCompare(String(bv)) * sign;
    });
  }, [data, sort]);

  const handleSort = useCallback((key: keyof T) => {
    setSort((prev) => {
      if (!prev || prev.key !== key) return { key, direction: "asc" };
      if (prev.direction === "asc") return { key, direction: "desc" };
      return null;
    });
  }, []);

  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: sorted.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 56,
    overscan: 5,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();

  const paddingTop = virtualRows.length > 0 ? virtualRows[0].start : 0;

  const paddingBottom =
    virtualRows.length > 0
      ? rowVirtualizer.getTotalSize() - virtualRows[virtualRows.length - 1].end
      : 0;

  return (
    <div ref={parentRef} className="max-h-[700px] overflow-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            {columns.map((col) => {
              const isSorted = sort?.key === col.key;
              const ariaSort = isSorted
                ? sort.direction === "asc"
                  ? "ascending"
                  : "descending"
                : col.sortable
                  ? "none"
                  : undefined;
              return (
                <th
                  key={String(col.key)}
                  role={col.sortable ? "button" : undefined}
                  tabIndex={col.sortable ? 0 : undefined}
                  aria-sort={ariaSort}
                  onClick={col.sortable ? () => handleSort(col.key) : undefined}
                  onKeyDown={
                    col.sortable
                      ? (e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleSort(col.key);
                          }
                        }
                      : undefined
                  }
                  className={cn(
                    "border-b border-zinc-200 px-4 py-3 text-left text-xs text-zinc-500 uppercase dark:border-zinc-800 dark:text-zinc-400",
                    col.sortable &&
                      "focus-visible:ring-ring cursor-pointer select-none focus-visible:rounded focus-visible:ring-2 focus-visible:outline-none",
                    col.shrink && "w-0 whitespace-nowrap",
                  )}
                >
                  {col.header}
                  {isSorted && <span className="ml-1">{sort.direction === "asc" ? "↑" : "↓"}</span>}
                </th>
              );
            })}
            <th className="w-0 border-b border-zinc-200 px-4 py-3 text-right text-xs font-medium tracking-wider text-zinc-500 uppercase dark:border-zinc-800 dark:text-zinc-400">
              Actions
            </th>
          </tr>
        </thead>
        <tbody
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            position: "relative",
          }}
        >
          {paddingTop > 0 && (
            <tr>
              <td colSpan={columns.length + 1} style={{ height: paddingTop, padding: 0 }} />
            </tr>
          )}

          {virtualRows.map((virtualRow) => {
            const row = sorted[virtualRow.index];

            return (
              <tr
                key={row.id}
                className="cursor-pointer border-b border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800"
              >
                {columns.map((col) => {
                  const value = row[col.key];
                  return (
                    <td
                      key={String(col.key)}
                      className={cn("px-4 py-3 text-sm", col.shrink && "w-0 whitespace-nowrap")}
                    >
                      {col.render ? col.render(value, row) : String(value)}
                    </td>
                  );
                })}
                <td
                  className="w-0 px-4 py-3 text-right"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="flex justify-end gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                      onClick={() => onEdit(row)}
                      aria-label="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-zinc-500 hover:bg-red-50 hover:text-red-600 dark:text-zinc-400 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                      onClick={() => onDelete(row)}
                      aria-label="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}

          {paddingBottom > 0 && (
            <tr>
              <td colSpan={columns.length + 1} style={{ height: paddingBottom, padding: 0 }} />
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
