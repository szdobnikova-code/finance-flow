import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  Pie,
  PieChart,
  Rectangle,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { CategoryLegendItem } from "@/features/dashboard/components/CategoryLegendItem.tsx";
import { ChartTooltip } from "@/features/dashboard/components/ChartTooltip.tsx";
import { Panel } from "@/features/dashboard/components/Panel.tsx";
import { formatCurrencyAxis } from "@/lib/utils.ts";
import type { CategoryColor, CategoryIcon } from "@/types/finance";

const CATEGORY_HEX: Record<CategoryColor, string> = {
  emerald: "#10b981",
  violet: "#8b5cf6",
  blue: "#3b82f6",
  red: "#ef4444",
  amber: "#f59e0b",
  pink: "#ec4899",
  cyan: "#06b6d4",
  orange: "#f97316",
};

export type ExpenseByCategory = {
  categoryId: number;
  name: string;
  amount: number;
  color: CategoryColor;
  icon?: CategoryIcon;
  percentage: number;
};

export type MonthlyPoint = {
  month: string;
  amount: number;
};

type DashboardChartsProps = {
  expensesByCategory: ExpenseByCategory[];
  topCategories: ExpenseByCategory[];
  monthly: MonthlyPoint[];
};

export default function DashboardCharts({
  expensesByCategory,
  topCategories,
  monthly,
}: DashboardChartsProps) {
  return (
    <>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <Panel title="Expenses by category">
          <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expensesByCategory.map((item) => ({
                      ...item,
                      fill: CATEGORY_HEX[item.color],
                      name: item.name,
                    }))}
                    dataKey="amount"
                    nameKey="name"
                    outerRadius={100}
                    stroke="var(--card)"
                  />
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3 self-center">
              {expensesByCategory.map((item) => (
                <CategoryLegendItem key={item.categoryId} item={item} />
              ))}
            </div>
          </div>
        </Panel>

        <Panel title={"Top 5 categories"}>
          <div className="h-[250px]">
            <ResponsiveContainer height="100%" width="100%">
              <BarChart data={topCategories} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />

                <XAxis
                  dataKey="name"
                  interval={0}
                  tick={{ fill: "var(--text-secondary)", fontSize: 11 }}
                />

                <YAxis
                  tick={{ fill: "var(--text-secondary)", fontSize: 12 }}
                  tickFormatter={formatCurrencyAxis}
                />

                <Tooltip cursor={false} content={<ChartTooltip />} />

                <Bar
                  dataKey="amount"
                  radius={[6, 6, 0, 0]}
                  shape={(props) => {
                    const { payload } = props;

                    return (
                      <Rectangle {...props} fill={CATEGORY_HEX[payload.color as CategoryColor]} />
                    );
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <Panel title="Monthly expenses">
        <div className="h-[260px]">
          <ResponsiveContainer>
            <LineChart data={monthly}>
              <CartesianGrid stroke="var(--border)" vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fill: "var(--text-secondary)", fontSize: 11 }} />
              <YAxis
                tickFormatter={formatCurrencyAxis}
                tick={{ fill: "var(--text-secondary)", fontSize: 12 }}
              />
              <Tooltip cursor={false} content={<ChartTooltip />} />
              <Line
                type="monotone"
                dataKey="amount"
                stroke="var(--color-expense)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Panel>
    </>
  );
}
