import type { Column } from "@/components/DataTable.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { cn } from "@/lib/utils.ts";
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
      render: (_value, row) => {
        const { spent, limit } = row;
        const percentage = Math.round((spent / limit) * 100);

        const status = percentage < 70 ? "success" : percentage < 90 ? "warning" : "danger";

        const colors = {
          success: "bg-emerald-500",
          warning: "bg-amber-500",
          danger: "bg-red-500",
        };

        const textColors = {
          success: "text-emerald-600 dark:text-emerald-400",
          warning: "text-amber-600 dark:text-amber-400",
          danger: "text-red-600 dark:text-red-400",
        };

        return (
          <div className="flex min-w-[160px] flex-col gap-1.5">
            <div className="flex items-end justify-between text-xs font-medium">
              <span className="text-foreground">
                ${spent.toLocaleString()}
                <span className="text-muted-foreground ml-1 font-normal">
                  / ${limit.toLocaleString()}
                </span>
              </span>
              <span className={cn(textColors[status])}>{percentage}%</span>
            </div>
            <div
              className="bg-muted h-2 w-full overflow-hidden rounded-full"
              role="progressbar"
              aria-valuenow={spent}
              aria-valuemin={0}
              aria-valuemax={limit}
            >
              <div
                className={cn("h-full transition-all duration-500 ease-in-out", colors[status])}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
          </div>
        );
      },
    },
  ];
}
