import { formatCurrency } from "@/lib/utils.ts";

type ChartTooltipItem = {
  name?: string | number;
  value?: number | string;
};

type ChartTooltipProps = {
  active?: boolean;
  payload?: ChartTooltipItem[];
};

export function ChartTooltip({ active, payload }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  const item = payload[0];
  const value = Number(item.value);

  if (Number.isNaN(value)) return null;

  return (
    <div className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      {item.name && <p className="text-zinc-500 dark:text-zinc-400">{item.name}</p>}

      <p className="font-medium text-zinc-900 dark:text-zinc-100">{formatCurrency(value)}</p>
    </div>
  );
}
