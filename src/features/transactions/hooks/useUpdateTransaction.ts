import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/api/queryKeys.ts";
import { api } from "@/lib/api.ts";
import type { Transaction } from "@/types/finance";

interface MutationContext {
  previousData: Array<[readonly unknown[], Transaction[] | undefined]>;
}
type UpdatePayload = { id: string } & Partial<Transaction>;

export const useUpdateTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation<Transaction, Error, UpdatePayload, MutationContext>({
    mutationFn: async ({ id, ...data }) => {
      return await api.patch<Transaction>(`/transactions/${id}`, data);
    },

    // Runs BEFORE mutationFn — apply optimistic update
    onMutate: async (updatedTransaction) => {
      // 1. Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: queryKeys.transactions.all });

      // 2. Snapshot ALL transactions queries (with all filter combinations)
      // getQueriesData returns array of [queryKey, data] tuples
      const previousData = queryClient.getQueriesData<Transaction[]>({
        queryKey: queryKeys.transactions.all,
      });

      // 3. Optimistically update ALL matching queries
      queryClient.setQueriesData<Transaction[]>({ queryKey: queryKeys.transactions.all }, (old) =>
        old?.filter((t) => t.id !== updatedTransaction.id),
      );

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
