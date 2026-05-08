import type { ReactNode } from "react";

import { type Column, DataTable } from "@/components/DataTable.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { cn } from "@/lib/utils.ts";

type DataTableCardProps<T extends { id: string | number }> = {
  data: T[];
  columns: Column<T>[];
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: ReactNode;
  emptyMessage?: ReactNode;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  className?: string;
};

export function DataTableCard<T extends { id: string | number }>({
  data,
  columns,
  isLoading = false,
  isError = false,
  errorMessage = "Failed to load data.",
  emptyMessage = "No items yet.",
  onEdit,
  onDelete,
  className,
}: DataTableCardProps<T>) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900",
        className,
      )}
    >
      {isLoading ? (
        <TableSkeleton />
      ) : isError ? (
        <div className="p-8 text-center text-sm text-red-600 dark:text-red-400">{errorMessage}</div>
      ) : data.length === 0 ? (
        <div className="p-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
          {emptyMessage}
        </div>
      ) : (
        <DataTable
          data={data}
          columns={columns}
          onEdit={onEdit ?? (() => {})}
          onDelete={onDelete ?? (() => {})}
        />
      )}
    </div>
  );
}

export function TableSkeleton() {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-9 w-full" />
      ))}
    </div>
  );
}
