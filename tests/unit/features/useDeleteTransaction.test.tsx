// Protects: optimistic delete is the most user-visible mutation contract in
// the app — the row disappears instantly and rolls back on failure. If
// rollback breaks, a network error leaves the UI claiming the transaction was
// deleted while the server still has it. If onSettled invalidation breaks,
// the cache drifts out of sync with the server until a hard refresh.

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { queryKeys } from "@/api/queryKeys.ts";
import { useDeleteTransaction } from "@/features/transactions/hooks/useDeleteTransaction.ts";
import type { Transaction, TransactionPage } from "@/types/finance.ts";

vi.mock("@/lib/api.ts", () => ({
  api: {
    delete: vi.fn(),
  },
}));

const { api } = await import("@/lib/api.ts");
const mockedDelete = vi.mocked(api.delete);

function makeTx(id: string): Transaction {
  return {
    id,
    amount: 10,
    type: "expense",
    categoryId: 1,
    date: "2026-05-01",
    description: `tx-${id}`,
    createdAt: "2026-05-01T00:00:00Z",
    updatedAt: "2026-05-01T00:00:00Z",
  };
}

function seedClient() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const initialPage: TransactionPage = {
    data: [makeTx("a"), makeTx("b"), makeTx("c")],
    nextCursor: null,
  };
  queryClient.setQueryData(queryKeys.transactions.infinite, {
    pages: [initialPage],
    pageParams: [null],
  });
  return queryClient;
}

function wrapper(queryClient: QueryClient) {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("useDeleteTransaction", () => {
  beforeEach(() => {
    mockedDelete.mockReset();
  });

  it("removes the transaction from the infinite query cache on success", async () => {
    mockedDelete.mockResolvedValueOnce("ok");
    const queryClient = seedClient();
    const { result } = renderHook(() => useDeleteTransaction(), {
      wrapper: wrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync("b");
    });

    const cached = queryClient.getQueryData<{ pages: TransactionPage[] }>(
      queryKeys.transactions.infinite,
    );
    const ids = cached?.pages.flatMap((p) => p.data.map((t) => t.id));
    expect(ids).toEqual(["a", "c"]);
  });

  it("rolls the cache back to the previous state when the API call fails", async () => {
    mockedDelete.mockRejectedValueOnce(new Error("network down"));
    const queryClient = seedClient();
    const snapshot = queryClient.getQueryData(queryKeys.transactions.infinite);

    const { result } = renderHook(() => useDeleteTransaction(), {
      wrapper: wrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync("b").catch(() => {});
    });
    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(queryClient.getQueryData(queryKeys.transactions.infinite)).toEqual(snapshot);
  });

  it("invalidates transactions and budgets queries on settle", async () => {
    mockedDelete.mockResolvedValueOnce("ok");
    const queryClient = seedClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useDeleteTransaction(), {
      wrapper: wrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync("a");
    });

    const invalidatedKeys = invalidateSpy.mock.calls.map((call) => call[0]?.queryKey);
    expect(invalidatedKeys).toContainEqual(queryKeys.transactions.all);
    expect(invalidatedKeys).toContainEqual(queryKeys.budgets.all);
  });
});
