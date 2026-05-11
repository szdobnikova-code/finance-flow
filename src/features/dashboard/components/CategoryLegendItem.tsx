import { COLOR_BG_SOFT, COLOR_TEXT } from "@/features/categories/colorMap.ts";
import { ICON_MAP } from "@/features/categories/iconMap.ts";
import { cn, formatCurrency } from "@/lib/utils.ts";
import type { CategoryColor } from "@/types/finance.ts";

export function CategoryLegendItem({
  item,
}: {
  item: {
    name: string;
    amount: number;
    percentage: number;
    color: CategoryColor;
    icon?: keyof typeof ICON_MAP;
  };
}) {
  const Icon = item.icon ? ICON_MAP[item.icon] : null;

  return (
    <div className="flex items-center gap-3">
      <div
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-md",
          COLOR_BG_SOFT[item.color],
          COLOR_TEXT[item.color],
        )}
      >
        {Icon ? <Icon className="h-4 w-4" /> : null}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">{item.name}</p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{item.percentage.toFixed(1)}%</p>
      </div>

      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
        {formatCurrency(item.amount)}
      </p>
    </div>
  );
}
