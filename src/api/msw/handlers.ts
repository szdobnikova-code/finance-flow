import { http, HttpResponse } from "msw";

import { budgets, categories, transactions } from "@/api/mockData";
import type { ApiResponse, Budget, Category, Transaction } from "@/types/finance";

const ok = <T>(data: T): ApiResponse<T> => ({ ok: true, data });

export const handlers = [
  http.get("/transactions", () => {
    return HttpResponse.json<ApiResponse<Transaction[]>>(ok(transactions));
  }),

  http.get("/categories", () => {
    return HttpResponse.json<ApiResponse<Category[]>>(ok(categories));
  }),

  http.get("/budgets", () => {
    return HttpResponse.json<ApiResponse<Budget[]>>(ok(budgets));
  }),
];
