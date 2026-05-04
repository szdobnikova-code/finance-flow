import { http, HttpResponse } from "msw";

import { budgets, categories, transactions } from "@/api/mockData";
import type { ApiResponse, Budget, Category, Transaction } from "@/types/finance";

const ok = <T>(data: T): ApiResponse<T> => ({ ok: true, data });

export const handlers = [
  http.get("/transactions", ({ request }) => {
    const url = new URL(request.url);

    const search = url.searchParams.get("search")?.toLowerCase();
    const categoriesRaw = url.searchParams.get("categories");
    const categoriesParam = categoriesRaw ? categoriesRaw.split(",") : [];
    const minAmount = url.searchParams.get("minAmount");
    const maxAmount = url.searchParams.get("maxAmount");
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");

    let filtered = [...transactions];

    if (search) {
      filtered = filtered.filter((t) => t.description.toLowerCase().includes(search));
    }
    if (categoriesParam?.length) {
      filtered = filtered.filter((t) => categoriesParam.includes(t.categoryId.toString()));
    }
    if (minAmount) {
      filtered = filtered.filter((t) => t.amount >= Number(minAmount));
    }
    if (maxAmount) {
      filtered = filtered.filter((t) => t.amount <= Number(maxAmount));
    }
    if (from && to) {
      const startDate = new Date(from);
      const endDate = new Date(to);
      filtered = filtered.filter((t) => {
        const d = new Date(t.date);
        return d >= startDate && d <= endDate;
      });
    }

    return HttpResponse.json<ApiResponse<Transaction[]>>(ok(filtered));
  }),

  http.get("/categories", () => {
    return HttpResponse.json<ApiResponse<Category[]>>(ok(categories));
  }),

  http.get("/budgets", () => {
    return HttpResponse.json<ApiResponse<Budget[]>>(ok(budgets));
  }),
];
