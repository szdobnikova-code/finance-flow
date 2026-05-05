import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/api/queryKeys.ts";
import { api } from "@/lib/api.ts";
import type { Transaction, TransactionInput } from "@/types/finance";

interface MutationContext {
  previousData: Array<[readonly unknown[], Transaction[] | undefined]>;
}

export const useCreateTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation<Transaction, Error, TransactionInput, MutationContext>({
    mutationFn: async (newTransaction) => {
      return await api.post<Transaction>(`/transactions/`, newTransaction);
    },

    // Runs BEFORE mutationFn — apply optimistic update
    onMutate: async (newTransaction) => {
      // 1. Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: queryKeys.transactions.all });

      // 2. Snapshot ALL transactions queries (with all filter combinations)
      // getQueriesData returns array of [queryKey, data] tuples
      const previousData = queryClient.getQueriesData<Transaction[]>({
        queryKey: queryKeys.transactions.all,
      });

      // 3. Optimistically update ALL matching queries
      queryClient.setQueriesData<Transaction[]>({ queryKey: queryKeys.transactions.all }, (old) => {
        const optimisticTx: Transaction = {
          ...newTransaction,
          id: "temp-id-" + Date.now(), // Placeholder ID
          createdAt: new Date().toDateString(),
          updatedAt: new Date().toDateString(),
        };
        return old ? [optimisticTx, ...old] : [optimisticTx];
      });

      // 4. Return snapshot for rollback in onError
      return { previousData };
    },

    // Runs if mutationFn throws — restore from snapshot
    onError: (_err, _deletedId, context) => {
      if (!context) return;
      context.previousData.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
    },

    // Runs after success OR error — refetch to ensure consistency with server
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
    },
  });
};
