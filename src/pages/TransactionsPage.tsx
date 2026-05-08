import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { queryKeys } from "@/api/queryKeys.ts";
import { ConfirmationDialog } from "@/components/ConfirmationDialog.tsx";
import { DataTableCard } from "@/components/DataTableCard.tsx";
import { PageHeader } from "@/components/PageHeaderWithAction.tsx";
import { createTransactionColumns } from "@/features/transactions/columns";
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
    queryKey: queryKeys.transactions.list(filters),
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
    queryKey: queryKeys.categories.all,
    queryFn: () => api.get<Category[]>("/categories"),
  });

  const isLoading = transactionsQuery.isLoading || categoriesQuery.isLoading;
  const isError = transactionsQuery.isError || categoriesQuery.isError;
  const transactions = transactionsQuery.data ?? [];
  const categories = categoriesQuery.data ?? [];

  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]));
  const columns = createTransactionColumns(categoryMap);

  const handleSubmit = (values: TransactionInput) => {
    if (selectedTransaction) {
      updateMutation.mutate(
        { id: selectedTransaction.id, ...values },
        {
          onSuccess: () => toast.success("Transaction has been updated"),
          onError: (err) => toast.error(`Update failed: ${err.message}`),
        },
      );
    } else {
      createMutation.mutate(values, {
        onSuccess: () => toast.success("Transaction has been created"),
        onError: (err) => toast.error(`Create failed: ${err.message}`),
      });
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
      <PageHeader
        title="Transactions"
        description="View and manage your transactions."
        actionLabel="Add new"
        onAction={() => setEditDialogOpen(true)}
      />

      <TransactionFilters categories={categories} />

      <DataTableCard
        data={transactions}
        columns={columns}
        isLoading={isLoading}
        isError={isError}
        emptyMessage="No transactions yet."
        errorMessage={"Failed to load transactions."}
        onEdit={(transaction) => {
          setSelectedTransaction(transaction);
          setEditDialogOpen(true);
        }}
        onDelete={(transaction) => {
          setSelectedTransaction(transaction);
          setDeleteDialogOpen(true);
        }}
      />

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
