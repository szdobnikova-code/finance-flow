import { cn } from "@/lib/utils.ts";

export function SummaryCard({
  label,
  value,
  description,
  tone,
}: {
  label: string;
  value: string;
  description?: string;
  tone?: "income" | "expense";
}) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-xs font-medium tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
        {label}
      </p>
      <p
        className={cn(
          "mt-2 text-xl font-semibold text-zinc-900 dark:text-zinc-100",
          tone === "income" && "text-emerald-600 dark:text-emerald-500",
          tone === "expense" && "text-red-600 dark:text-red-500",
        )}
      >
        {value}
      </p>
      {description && (
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{description}</p>
      )}
    </div>
  );
}
