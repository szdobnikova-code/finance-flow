import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { queryKeys } from "@/api/queryKeys.ts";
import { ConfirmationDialog } from "@/components/ConfirmationDialog.tsx";
import { DataTableCard } from "@/components/DataTableCard.tsx";
import { PageHeader } from "@/components/PageHeaderWithAction.tsx";
import { createBudgetColumns } from "@/features/budgets/columns.tsx";
import { BudgetDialog } from "@/features/budgets/components/BudgetDialog.tsx";
import { useCreateBudget } from "@/features/budgets/hooks/useCreateBudget.ts";
import { useDeleteBudget } from "@/features/budgets/hooks/useDeleteBudget.ts";
import { useUpdateBudget } from "@/features/budgets/hooks/useUpdateBudget.ts";
import { api } from "@/lib/api.ts";
import type { Budget, BudgetInput, Category } from "@/types/finance.ts";

export default function BudgetsPage() {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);

  const createMutation = useCreateBudget();
  const updateMutation = useUpdateBudget();
  const deleteMutation = useDeleteBudget();

  const budgetsQuery = useQuery({
    queryKey: queryKeys.budgets.all,
    queryFn: () => api.get<Budget[]>("/budgets"),
  });

  const categoriesQuery = useQuery({
    queryKey: queryKeys.categories.all,
    queryFn: () => api.get<Category[]>("/categories"),
  });

  const isLoading = budgetsQuery.isLoading || categoriesQuery.isLoading;
  const isError = budgetsQuery.isError || categoriesQuery.isError;
  const transactions = budgetsQuery.data ?? [];
  const categories = categoriesQuery.data ?? [];

  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]));
  const columns = createBudgetColumns(categoryMap);

  const handleSubmit = (values: BudgetInput) => {
    if (selectedBudget) {
      updateMutation.mutate(
        { id: selectedBudget.id, ...values },
        {
          onSuccess: () => toast.success("Budget has been updated"),
          onError: (err) => toast.error(`Update failed: ${err.message}`),
        },
      );
    } else {
      createMutation.mutate(values, {
        onSuccess: () => toast.success("Budget has been created"),
        onError: (err) => toast.error(`Create failed: ${err.message}`),
      });
    }
    setEditDialogOpen(false);
    setSelectedBudget(null);
  };

  const handleDelete = () => {
    if (!selectedBudget) return;
    deleteMutation.mutate(selectedBudget.id, {
      onSuccess: () => toast.success("Budget has been deleted"),
      onError: (err) => toast.error(`Delete failed: ${err.message}`),
    });

    setDeleteDialogOpen(false);
    setSelectedBudget(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={"Budgets"}
        description={"View and manage budgets."}
        actionLabel="Add new"
        onAction={() => setEditDialogOpen(true)}
      />

      <DataTableCard
        data={transactions}
        columns={columns}
        isLoading={isLoading}
        isError={isError}
        emptyMessage="No budgets yet."
        errorMessage={"Failed to load budgets."}
        onEdit={(budget) => {
          setSelectedBudget(budget);
          setEditDialogOpen(true);
        }}
        onDelete={(budget) => {
          setSelectedBudget(budget);
          setDeleteDialogOpen(true);
        }}
      />

      <BudgetDialog
        budget={selectedBudget}
        open={editDialogOpen}
        onOpenChange={() => {
          setEditDialogOpen(false);
          setSelectedBudget(null);
        }}
        categories={categories}
        onSubmit={handleSubmit}
      />

      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={() => {
          setDeleteDialogOpen(false);
          setSelectedBudget(null);
        }}
        title="Delete budget?"
        description={"This will permanently delete this budget. This action cannot be undone."}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}
