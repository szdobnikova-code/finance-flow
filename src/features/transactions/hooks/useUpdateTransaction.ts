import { type InfiniteData, useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/api/queryKeys.ts";
import { api } from "@/lib/api.ts";
import type { Transaction, TransactionPage } from "@/types/finance";

interface MutationContext {
  previousData: Array<[readonly unknown[], InfiniteData<TransactionPage> | undefined]>;
}
type UpdatePayload = { id: string } & Partial<Transaction>;

export const useUpdateTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation<Transaction, Error, UpdatePayload, MutationContext>({
    mutationFn: ({ id, ...data }) => api.patch<Transaction>(`/transactions/${id}`, data),

    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.transactions.all });

      const previousData = queryClient.getQueriesData<InfiniteData<TransactionPage>>({
        queryKey: queryKeys.transactions.infinite,
      });

      const updatedAt = new Date().toISOString();

      queryClient.setQueriesData<InfiniteData<TransactionPage>>(
        { queryKey: queryKeys.transactions.infinite },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              data: page.data.map((t) =>
                t.id === input.id ? { ...t, ...input, updatedAt } : t,
              ),
            })),
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
