import { http, HttpResponse } from "msw";

import { budgets, categories, transactions } from "@/api/mockData";
import type {
  ApiResponse,
  Budget,
  BudgetInput,
  Category,
  CategoryInput,
  Transaction,
  TransactionInput,
} from "@/types/finance";

const ok = <T>(data: T): ApiResponse<T> => ({ ok: true, data });

const fail = <T>(error: string): ApiResponse<T> => ({ ok: false, error });

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

  http.post("/transactions", async ({ request }) => {
    const body = (await request.json()) as TransactionInput;
    const now = new Date().toISOString();

    const transaction: Transaction = {
      id: crypto.randomUUID(),
      ...body,
      createdAt: now,
      updatedAt: now,
    };

    transactions.unshift(transaction);

    return HttpResponse.json<ApiResponse<Transaction>>(ok(transaction));
  }),

  http.patch("/transactions/:id", async ({ params, request }) => {
    const id = String(params.id);
    const body = (await request.json()) as Partial<TransactionInput>;

    const index = transactions.findIndex((transaction) => transaction.id === id);

    if (index === -1) {
      return HttpResponse.json<ApiResponse<Transaction>>(
        fail<Transaction>("Transaction not found"),
        { status: 404 },
      );
    }

    const updated: Transaction = {
      ...transactions[index],
      ...body,
      updatedAt: new Date().toISOString(),
    };

    transactions[index] = updated;

    return HttpResponse.json<ApiResponse<Transaction>>(ok(updated));
  }),

  http.delete("/transactions/:id", ({ params }) => {
    const id = String(params.id);
    const index = transactions.findIndex((transaction) => transaction.id === id);

    if (index === -1) {
      return HttpResponse.json<ApiResponse<Transaction>>(
        fail<Transaction>("Transaction not found"),
        { status: 404 },
      );
    }

    const [deleted] = transactions.splice(index, 1);

    return HttpResponse.json<ApiResponse<Transaction>>(ok(deleted));
  }),

  http.get("/categories", () => {
    return HttpResponse.json<ApiResponse<Category[]>>(ok(categories));
  }),

  http.post("/categories", async ({ request }) => {
    const body = (await request.json()) as CategoryInput;

    const category: Category = {
      id: categories.length > 0 ? Math.max(...categories.map((c) => c.id)) + 1 : 1,
      ...body,
    };

    categories.unshift(category);

    return HttpResponse.json<ApiResponse<Category>>(ok(category), { status: 201 });
  }),

  http.patch("/categories/:id", async ({ params, request }) => {
    const id = Number(params.id);
    const body = (await request.json()) as Partial<CategoryInput>;

    const index = categories.findIndex((c) => c.id === id);

    if (index === -1) return HttpResponse.json(fail("Category not found"), { status: 404 });

    const updated: Category = { ...categories[index], ...body, id };

    categories[index] = updated;

    return HttpResponse.json<ApiResponse<Category>>(ok(updated));
  }),

  http.delete("/categories/:id", ({ params }) => {
    const id = Number(params.id);
    const index = categories.findIndex((c) => c.id === id);

    if (index === -1)
      return HttpResponse.json<ApiResponse<Category>>(fail("Category not found"), { status: 404 });

    const [deleted] = categories.splice(index, 1);

    return HttpResponse.json<ApiResponse<Category>>(ok(deleted));
  }),

  http.get("/budgets", () => {
    return HttpResponse.json<ApiResponse<Budget[]>>(ok(budgets));
  }),

  http.post("/budgets", async ({ request }) => {
    const body = (await request.json()) as BudgetInput;

    const budget: Budget = {
      id: crypto.randomUUID(),
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    budgets.unshift(budget);

    return HttpResponse.json<ApiResponse<Budget>>(ok(budget), { status: 201 });
  }),

  http.patch("/budgets/:id", async ({ params, request }) => {
    const id = String(params.id);
    const body = (await request.json()) as Partial<BudgetInput>;

    const index = budgets.findIndex((b) => b.id === id);

    if (index === -1)
      return HttpResponse.json<ApiResponse<Budget>>(fail("Budget not found"), { status: 404 });

    const updated: Budget = {
      ...budgets[index],
      ...body,
      updatedAt: new Date().toISOString(),
    };

    budgets[index] = updated;
    return HttpResponse.json<ApiResponse<Budget>>(ok(updated));
  }),

  http.delete("/budgets/:id", ({ params }) => {
    const id = String(params.id);
    const index = budgets.findIndex((b) => b.id === id);

    if (index === -1) return HttpResponse.json(fail("Budget not found"), { status: 404 });

    const [deleted] = budgets.splice(index, 1);

    return HttpResponse.json<ApiResponse<Budget>>(ok(deleted));
  }),
];
