import type { Column } from "@/components/DataTable";
import { Badge } from "@/components/ui/badge";
import { COLOR_BG_SOFT, COLOR_TEXT } from "@/features/categories/colorMap.ts";
import { ICON_MAP } from "@/features/categories/iconMap.ts";
import { cn } from "@/lib/utils.ts";
import type { Category, CategoryIcon } from "@/types/finance";

export function createCategoryColumns(): Column<Category>[] {
  return [
    {
      key: "icon",
      header: "Icon",
      sortable: true,
      shrink: true,
      render: (icon, row) => {
        const Icon = ICON_MAP[icon as CategoryIcon];
        if (!Icon) return null;
        return (
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-md",
              COLOR_BG_SOFT[row.color],
            )}
          >
            <Icon className={cn("h-4 w-4", COLOR_TEXT[row.color])} />
          </div>
        );
      },
    },
    {
      key: "name",
      header: "Name",
      sortable: true,
    },
    {
      key: "type",
      header: "Type",
      render: (type) => (
        <Badge variant={type === "income" ? "default" : "secondary"}>
          {type === "income" ? "Income" : "Expense"}
        </Badge>
      ),
    },
  ];
}
