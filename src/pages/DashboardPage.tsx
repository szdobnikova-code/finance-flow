import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
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

import { DateRangePicker } from "@/components/ui/date-range-picker";
import { CategoryLegendItem } from "@/features/dashboard/components/CategoryLegendItem.tsx";
import { ChartTooltip } from "@/features/dashboard/components/ChartTooltip.tsx";
import { Panel } from "@/features/dashboard/components/Panel.tsx";
import { SummaryCard } from "@/features/dashboard/components/SummaryCard.tsx";
import { useTransactionFilters } from "@/features/transactions/hooks/useTransactionFilters";
import { api } from "@/lib/api";
import { formatCurrency, formatCurrencyAxis } from "@/lib/utils.ts";
import type { Category, CategoryColor, Transaction } from "@/types/finance";

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

export default function DashboardPage() {
  const [filters, setFilters] = useTransactionFilters();

  useEffect(() => {
    if (!filters.from || !filters.to) {
      const to = new Date();
      const from = new Date();
      from.setMonth(from.getMonth() - 5);
      from.setDate(1);

      setFilters({
        from: from.toISOString().slice(0, 10),
        to: to.toISOString().slice(0, 10),
      });
    }
  }, [filters.from, filters.to, setFilters]);

  const transactionsQuery = useQuery({
    queryKey: ["transactions", filters],
    queryFn: () =>
      api.get<Transaction[]>(
        `/transactions?${new URLSearchParams(
          Object.entries(filters)
            .filter(([, v]) => !!v)
            .map(([k, v]) => [k, String(v)]),
        )}`,
      ),
  });

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.get<Category[]>("/categories"),
  });

  const transactions = transactionsQuery.data ?? [];
  const categories = categoriesQuery.data ?? [];

  const stats = useMemo(() => {
    const expenses = transactions.filter((transaction) => transaction.type === "expense");
    const income = transactions.filter((transaction) => transaction.type === "income");

    const totalSpent = expenses.reduce((sum, transaction) => sum + transaction.amount, 0);
    const totalIncome = income.reduce((sum, transaction) => sum + transaction.amount, 0);
    const netBalance = totalIncome - totalSpent;

    const categoryTotals = new Map<number, number>();

    for (const transaction of expenses) {
      categoryTotals.set(
        transaction.categoryId,
        (categoryTotals.get(transaction.categoryId) ?? 0) + transaction.amount,
      );
    }

    const expensesByCategory = [...categoryTotals.entries()]
      .map(([categoryId, amount]) => {
        const category = categories.find((c) => c.id === categoryId);
        return {
          categoryId,
          name: category?.name ?? "-",
          amount,
          color: category?.color ?? "emerald",
          icon: category?.icon,
          percentage: (amount / totalSpent) * 100,
        };
      })
      .sort((a, b) => b.amount - a.amount);

    const biggestCategory = expensesByCategory[0];

    const monthlyMap = new Map<string, { month: string; income: number; expenses: number }>();

    for (const transaction of transactions) {
      const date = new Date(transaction.date);
      const month = date.toLocaleDateString("en-GB", { month: "short", year: "numeric" });

      const exising = monthlyMap.get(month) ?? { month, income: 0, expenses: 0 };

      if (transaction.type === "income") {
        exising.income += transaction.amount;
      } else {
        exising.expenses += transaction.amount;
      }

      monthlyMap.set(month, exising);
    }

    const monthly = [...monthlyMap.values()]
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
      .map((item) => ({
        month: item.month,
        amount: item.expenses,
      }));

    return {
      totalSpent,
      totalIncome,
      netBalance,
      expensesByCategory,
      topCategories: expensesByCategory.slice(0, 5),
      biggestCategory,
      monthly,
    };
  }, [transactions, categories]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Overview of your finances.</p>
        </div>

        <DateRangePicker
          from={filters.from ?? undefined}
          to={filters.to ?? undefined}
          onRangeChange={setFilters}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Total spent" value={formatCurrency(stats.totalSpent)} tone="expense" />
        <SummaryCard label="Total income" value={formatCurrency(stats.totalIncome)} tone="income" />
        <SummaryCard
          label="Net balance"
          value={formatCurrency(stats.netBalance)}
          tone={stats.netBalance >= 0 ? "income" : "expense"}
        />
        <SummaryCard
          label="Biggest category"
          value={stats.biggestCategory?.name ?? "—"}
          description={
            stats.biggestCategory ? formatCurrency(stats.biggestCategory.amount) : "No expenses"
          }
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <Panel title="Expenses by category">
          <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.expensesByCategory.map((item) => ({
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
              {stats.expensesByCategory.map((item) => (
                <CategoryLegendItem key={item.categoryId} item={item} />
              ))}
            </div>
          </div>
        </Panel>

        <Panel title={"Top 5 categories"}>
          <div className="h-[250px]">
            <ResponsiveContainer height="100%" width="100%">
              <BarChart
                data={stats.topCategories}
                margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
              >
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />

                <XAxis dataKey="name" tick={{ fill: "var(--text-secondary)", fontSize: 12 }} />

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
            <LineChart data={stats.monthly}>
              <CartesianGrid stroke="var(--border)" vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fill: "var(--text-secondary)" }} />
              <YAxis tickFormatter={formatCurrencyAxis} />
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
    </div>
  );
}
