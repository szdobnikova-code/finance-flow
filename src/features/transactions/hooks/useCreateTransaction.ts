import { type InfiniteData, useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/api/queryKeys.ts";
import { api } from "@/lib/api.ts";
import type { Transaction, TransactionInput, TransactionPage } from "@/types/finance";

interface MutationContext {
  previousData: Array<[readonly unknown[], InfiniteData<TransactionPage> | undefined]>;
}

export const useCreateTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation<Transaction, Error, TransactionInput, MutationContext>({
    mutationFn: (input) => api.post<Transaction>(`/transactions/`, input),

    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.transactions.all });

      const previousData = queryClient.getQueriesData<InfiniteData<TransactionPage>>({
        queryKey: queryKeys.transactions.infinite,
      });

      const now = new Date().toISOString();
      const optimistic: Transaction = {
        ...input,
        id: `temp-${crypto.randomUUID()}`,
        createdAt: now,
        updatedAt: now,
      };

      queryClient.setQueriesData<InfiniteData<TransactionPage>>(
        { queryKey: queryKeys.transactions.infinite },
        (old) => {
          if (!old) return old;
          const [firstPage, ...rest] = old.pages;
          if (!firstPage) return old;
          return {
            ...old,
            pages: [{ ...firstPage, data: [optimistic, ...firstPage.data] }, ...rest],
          };
        },
      );

      return { previousData };
    },

    onError: (_err, _input, context) => {
      if (!context) return;
      context.previousData.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.budgets.all });
    },
  });
};
