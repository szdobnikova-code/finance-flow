import { useQuery } from "@tanstack/react-query";

import { DataTable } from "@/components/DataTable";
import { Skeleton } from "@/components/ui/skeleton";
import { createTransactionColumns } from "@/features/transactions/columns";
import { api } from "@/lib/api";
import type { Category, Transaction } from "@/types/finance";

export default function TransactionsPage() {
  const transactionsQuery = useQuery({
    queryKey: ["transactions"],
    queryFn: () => api.get<Transaction[]>("/transactions"),
  });
  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.get<Category[]>("/categories"),
  });

  const isLoading = transactionsQuery.isLoading || categoriesQuery.isLoading;
  const isError = transactionsQuery.isError || categoriesQuery.isError;
  const transactions = transactionsQuery.data ?? [];
  const categories = categoriesQuery.data ?? [];

  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]));
  const columns = createTransactionColumns(categoryMap);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Transactions</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          View and manage your transactions.
        </p>
      </div>

      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
        {isLoading ? (
          <TableSkeleton />
        ) : isError ? (
          <div className="p-8 text-center text-sm text-red-600 dark:text-red-400">
            Failed to load transactions.
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
            No transactions yet.
          </div>
        ) : (
          <DataTable data={transactions} columns={columns} onRowClick={(row) => console.log(row)} />
        )}
      </div>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="p-4 space-y-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-9 w-full" />
      ))}
    </div>
  );
}
