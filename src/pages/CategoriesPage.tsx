import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { queryKeys } from "@/api/queryKeys.ts";
import { ConfirmationDialog } from "@/components/ConfirmationDialog.tsx";
import { DataTableCard } from "@/components/DataTableCard.tsx";
import { PageHeader } from "@/components/PageHeaderWithAction.tsx";
import { createCategoryColumns } from "@/features/categories/columns.tsx";
import { CategoryDialog } from "@/features/categories/components/CategoryDialog.tsx";
import { useCreateCategory } from "@/features/categories/hooks/useCreateCategory.ts";
import { useDeleteCategory } from "@/features/categories/hooks/useDeleteCategory.ts";
import { useUpdateCategory } from "@/features/categories/hooks/useUpdateCategory.ts";
import { api } from "@/lib/api.ts";
import type { Category, CategoryInput } from "@/types/finance.ts";

export default function CategoriesPage() {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();

  const categoriesQuery = useQuery({
    queryKey: queryKeys.categories.all,
    queryFn: () => api.get<Category[]>("/categories"),
  });

  const isLoading = categoriesQuery.isLoading;
  const isError = categoriesQuery.isError;
  const categories = categoriesQuery.data ?? [];

  const columns = createCategoryColumns();

  const handleSubmit = (values: CategoryInput) => {
    if (selectedCategory) {
      updateMutation.mutate(
        { id: selectedCategory.id, ...values },
        {
          onSuccess: () => toast.success("Category has been updated"),
          onError: (err) => toast.error(`Update failed: ${err.message}`),
        },
      );
    } else {
      createMutation.mutate(values, {
        onSuccess: () => toast.success("Category has been created"),
        onError: (err) => toast.error(`Create failed: ${err.message}`),
      });
    }

    setEditDialogOpen(false);
    setSelectedCategory(null);
  };

  const handleDelete = () => {
    if (!selectedCategory) return;
    deleteMutation.mutate(selectedCategory.id, {
      onSuccess: () => toast.success(`Category ${selectedCategory.name} has been deleted`),
      onError: (err) => toast.error(`Failed: ${err.message}`),
    });

    setDeleteDialogOpen(false);
    setSelectedCategory(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categories"
        description="View and manage categories of your finances."
        actionLabel="Add new"
        onAction={() => setEditDialogOpen(true)}
      />

      <DataTableCard
        data={categories}
        columns={columns}
        isLoading={isLoading}
        isError={isError}
        emptyMessage="No categories yet."
        errorMessage={"Failed to load categories."}
        onEdit={(category) => {
          setSelectedCategory(category);
          setEditDialogOpen(true);
        }}
        onDelete={(category) => {
          setSelectedCategory(category);
          setDeleteDialogOpen(true);
        }}
      />

      <CategoryDialog
        open={editDialogOpen}
        onOpenChange={() => {
          setEditDialogOpen(false);
          setSelectedCategory(null);
        }}
        category={selectedCategory}
        onSubmit={handleSubmit}
      />

      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={() => {
          setDeleteDialogOpen(false);
          setSelectedCategory(null);
        }}
        title="Delete category?"
        description={
          <>
            This will permanently delete{" "}
            <span className="font-medium text-zinc-100">
              {selectedCategory?.name || "this category"}
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
