import { useInfiniteQuery } from "@tanstack/react-query";

import { queryKeys } from "@/api/queryKeys";
import { api } from "@/lib/api";
import type { TransactionPage } from "@/types/finance";

const PAGE_SIZE = 50;

export const useInfiniteTransactions = (filters: Record<string, unknown>) => {
  return useInfiniteQuery<TransactionPage, Error>({
    queryKey: queryKeys.transactions.infiniteList(filters),
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams(
        Object.entries(filters)
          .filter(([, v]) => v !== undefined && v !== null && v !== "")
          .map(([k, v]) => [k, String(v)]),
      );
      params.set("limit", String(PAGE_SIZE));
      if (typeof pageParam === "string") params.set("cursor", pageParam);
      return api.get<TransactionPage>(`/transactions?${params}`);
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
};
