import { cn } from "@/lib/utils.ts";

type BudgetProgressBarProps = {
  spent: number;
  limit: number;
};

const colorByStatus = {
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
} as const;

const textColorByStatus = {
  success: "text-emerald-600 dark:text-emerald-400",
  warning: "text-amber-600 dark:text-amber-400",
  danger: "text-red-600 dark:text-red-400",
} as const;

export function BudgetProgressBar({ spent, limit }: BudgetProgressBarProps) {
  const percentage = limit > 0 ? Math.round((spent / limit) * 100) : 0;
  const status = percentage < 70 ? "success" : percentage < 90 ? "warning" : "danger";

  return (
    <div className="flex min-w-[160px] flex-col gap-1.5">
      <div className="flex items-end justify-between text-xs font-medium">
        <span className="text-foreground">
          ${spent.toLocaleString()}
          <span className="text-muted-foreground ml-1 font-normal">
            / ${limit.toLocaleString()}
          </span>
        </span>
        <span className={cn(textColorByStatus[status])}>{percentage}%</span>
      </div>
      <div
        className="bg-muted h-2 w-full overflow-hidden rounded-full"
        role="progressbar"
        aria-valuenow={spent}
        aria-valuemin={0}
        aria-valuemax={limit}
      >
        <div
          className={cn("h-full transition-all duration-500 ease-in-out", colorByStatus[status])}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
}
