import type { ReactNode } from "react";
import { useMemo, useState } from "react";

import { cn } from "@/lib/utils";

export type Column<T> = {
  key: keyof T;
  header: string;
  render?: (value: T[keyof T], row: T) => ReactNode;
  sortable?: boolean;
};

type SortState<T> = { key: keyof T; direction: "asc" | "desc" } | null;

type DataTableProps<T> = {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (row: T) => void;
};

export function DataTable<T extends { id: string }>({
  data,
  columns,
  onRowClick,
}: DataTableProps<T>) {
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

  const handleSort = (key: keyof T) => {
    setSort((prev) => {
      if (!prev || prev.key !== key) return { key, direction: "asc" };
      if (prev.direction === "asc") return { key, direction: "desc" };
      return null;
    });
  };

  return (
    <table className="w-full border-collapse">
      <thead>
        <tr>
          {columns.map((col) => {
            const isSorted = sort?.key === col.key;
            return (
              <th
                key={String(col.key)}
                onClick={col.sortable ? () => handleSort(col.key) : undefined}
                className={cn(
                  "border-b border-zinc-200 px-4 py-3 text-left text-xs text-zinc-500 uppercase dark:border-zinc-800 dark:text-zinc-400",
                  col.sortable && "cursor-pointer select-none",
                )}
              >
                {col.header}
                {isSorted && <span className="ml-1">{sort.direction === "asc" ? "↑" : "↓"}</span>}
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody>
        {sorted.map((row) => (
          <tr
            key={row.id}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
            className={cn(
              "border-b border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800",
              onRowClick && "cursor-pointer",
            )}
          >
            {columns.map((col) => {
              const value = row[col.key];
              return (
                <td key={String(col.key)} className="px-4 py-3 text-sm">
                  {col.render ? col.render(value, row) : String(value)}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
