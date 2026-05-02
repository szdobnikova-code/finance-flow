import type { Column } from "@/components/DataTable";
import { Badge } from "@/components/ui/badge";
import type { Category, Transaction } from "@/types/finance";

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  year: "numeric",
  month: "short",
  day: "numeric",
});

const currencyFormatter = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "USD",
});

export function createTransactionColumns(
  categoryMap: Record<string, Category>,
): Column<Transaction>[] {
  return [
    {
      key: "date",
      header: "Date",
      sortable: true,
      render: (value) => (
        <span className="whitespace-nowrap">{dateFormatter.format(new Date(value as string))}</span>
      ),
    },
    {
      key: "description",
      header: "Description",
      sortable: true,
    },
    {
      key: "categoryId",
      header: "Category",
      sortable: true,
      render: (value) => {
        const category = categoryMap[value as string];
        return <Badge variant="secondary">{category?.name ?? "Unknown"}</Badge>;
      },
    },
    {
      key: "amount",
      header: "Amount",
      sortable: true,
      render: (value, row) => {
        const isIncome = row.type === "income";
        return (
          <span
            className={
              isIncome ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
            }
          >
            {isIncome ? "+" : "−"}
            {currencyFormatter.format(value as number)}
          </span>
        );
      },
    },
  ];
}
