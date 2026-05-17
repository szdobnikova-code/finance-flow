import type { Column } from "@/components/DataTable.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { BudgetProgressBar } from "@/features/budgets/BudgetProgressBar.tsx";
import type { Budget, Category } from "@/types/finance.ts";

export function createBudgetColumns(categoryMap: Record<number, Category>): Column<Budget>[] {
  return [
    {
      key: "categoryId",
      header: "Category",
      sortable: true,
      render: (value) => {
        const category = categoryMap[value as number];
        return <Badge variant="secondary">{category?.name ?? "Unknown"}</Badge>;
      },
    },
    {
      key: "period",
      header: "Period",
      sortable: true,
    },
    {
      key: "spent",
      header: "Spent/Limit",
      sortable: true,
      render: (_value, row) => <BudgetProgressBar spent={row.spent} limit={row.limit} />,
    },
  ];
}
