import { useQuery } from "@tanstack/react-query";
import { lazy, Suspense, useEffect, useMemo } from "react";

import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Skeleton } from "@/components/ui/skeleton";
import { Panel } from "@/features/dashboard/components/Panel.tsx";
import { SummaryCard } from "@/features/dashboard/components/SummaryCard.tsx";
import { useTransactionFilters } from "@/features/transactions/hooks/useTransactionFilters";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils.ts";
import type { Category, Transaction } from "@/types/finance";

const DashboardCharts = lazy(
  () => import("@/features/dashboard/components/DashboardCharts.tsx"),
);

function ChartsFallback() {
  return (
    <>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <Panel title="Expenses by category">
          <Skeleton className="h-[240px] w-full" />
        </Panel>
        <Panel title="Top 5 categories">
          <Skeleton className="h-[250px] w-full" />
        </Panel>
      </div>
      <Panel title="Monthly expenses">
        <Skeleton className="h-[260px] w-full" />
      </Panel>
    </>
  );
}

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
  const isLoading = transactionsQuery.isLoading || categoriesQuery.isLoading;
  const isError = transactionsQuery.isError || categoriesQuery.isError;

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

  const header = (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Overview of your finances.</p>
      </div>

      <div className="w-full sm:w-auto">
        <DateRangePicker
          from={filters.from ?? undefined}
          to={filters.to ?? undefined}
          onRangeChange={setFilters}
        />
      </div>
    </div>
  );

  if (isError) {
    return (
      <div className="space-y-6">
        {header}
        <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center text-sm text-red-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-red-400">
          Failed to load dashboard data.
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        {header}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <Skeleton className="h-3 w-20" />
              <Skeleton className="mt-3 h-6 w-28" />
              <Skeleton className="mt-2 h-3 w-16" />
            </div>
          ))}
        </div>
        <ChartsFallback />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {header}

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

      <Suspense fallback={<ChartsFallback />}>
        <DashboardCharts
          expensesByCategory={stats.expensesByCategory}
          topCategories={stats.topCategories}
          monthly={stats.monthly}
        />
      </Suspense>
    </div>
  );
}
