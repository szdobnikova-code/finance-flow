import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ConfirmationDialog } from "@/components/ConfirmationDialog.tsx";
import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/ui/button.tsx";
import { Skeleton } from "@/components/ui/skeleton";
import { createTransactionColumns } from "@/features/transactions/columns";
import { TransactionActions } from "@/features/transactions/components/TransactionActions.tsx";
import { TransactionDialog } from "@/features/transactions/components/TransactionDialog.tsx";
import { TransactionFilters } from "@/features/transactions/components/TransactionFilters.tsx";
import { useCreateTransaction } from "@/features/transactions/hooks/useCreateTransaction.ts";
import { useDeleteTransaction } from "@/features/transactions/hooks/useDeleteTransaction.ts";
import { useTransactionFilters } from "@/features/transactions/hooks/useTransactionFilters";
import { useUpdateTransaction } from "@/features/transactions/hooks/useUpdateTransaction.ts";
import { api } from "@/lib/api";
import type { Category, Transaction, TransactionInput } from "@/types/finance";

export default function TransactionsPage() {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  const [filters] = useTransactionFilters();
  const createMutation = useCreateTransaction();
  const updateMutation = useUpdateTransaction();
  const deleteMutation = useDeleteTransaction();

  const transactionsQuery = useQuery({
    queryKey: ["transactions", filters],
    queryFn: () =>
      api.get<Transaction[]>(
        `/transactions?${new URLSearchParams(
          Object.entries(filters)
            .filter(([, v]) => !!v)
            .map(([k, v]) => [k, String(v)]),
        )}`,
      ),
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

  const handleCreate = (newTransaction: TransactionInput) => {
    createMutation.mutate(newTransaction, {
      onSuccess: () => toast.success("Transaction has been created"),
      onError: (err) => toast.error(`Create failed: ${err.message}`),
    });
  };

  const handleUpdate = (id: string, values: Partial<Transaction>) => {
    updateMutation.mutate(
      { id, ...values },
      {
        onSuccess: () => toast.success("Transaction has been updated"),
        onError: (err) => toast.error(`Update failed: ${err.message}`),
      },
    );
  };

  const handleSubmit = (values: TransactionInput) => {
    if (selectedTransaction) {
      handleUpdate(selectedTransaction.id, values);
    } else {
      handleCreate(values);
    }

    setEditDialogOpen(false);
    setSelectedTransaction(null);
  };

  const handleDelete = () => {
    if (!selectedTransaction) return;
    deleteMutation.mutate(selectedTransaction.id, {
      onSuccess: () =>
        toast.success(`Transaction ${selectedTransaction.description} has been deleted`),
      onError: (err) => toast.error(`Failed: ${err.message}`),
    });

    setDeleteDialogOpen(false);
    setSelectedTransaction(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Transactions</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            View and manage your transactions.
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => setEditDialogOpen(true)}
          className="h-8 gap-1.5 rounded-md bg-zinc-900 px-3 text-xs font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          <Plus className="h-3.5 w-3.5" />
          Add new
        </Button>
      </div>

      <TransactionFilters categories={categories} />

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
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
          <DataTable
            data={transactions}
            columns={columns}
            actions={(transaction) => (
              <TransactionActions
                transaction={transaction}
                onEdit={(tx) => {
                  setSelectedTransaction(tx);
                  setEditDialogOpen(true);
                }}
                onDelete={(tx) => {
                  setSelectedTransaction(tx);
                  setDeleteDialogOpen(true);
                }}
              />
            )}
          />
        )}
      </div>

      <TransactionDialog
        transaction={selectedTransaction}
        open={editDialogOpen}
        onOpenChange={() => {
          setEditDialogOpen(false);
          setSelectedTransaction(null);
        }}
        categories={categories}
        onSubmit={handleSubmit}
      />

      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={() => {
          setDeleteDialogOpen(false);
          setSelectedTransaction(null);
        }}
        title="Delete transaction?"
        description={
          <>
            This will permanently delete{" "}
            <span className="font-medium text-zinc-100">
              {selectedTransaction?.description || "this transaction"}
            </span>
            . This action cannot be undone.
          </>
        }
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-9 w-full" />
      ))}
    </div>
  );
}
