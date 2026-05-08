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

    onMutate: async (newTransaction) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.transactions.all });

      const previousData = queryClient.getQueriesData<Transaction[]>({
        queryKey: queryKeys.transactions.all,
      });

      queryClient.setQueriesData<Transaction[]>({ queryKey: queryKeys.transactions.all }, (old) => {
        const optimisticTx: Transaction = {
          ...newTransaction,
          id: "temp-id-" + Date.now(), // Placeholder ID
          createdAt: new Date().toDateString(),
          updatedAt: new Date().toDateString(),
        };
        return old ? [optimisticTx, ...old] : [optimisticTx];
      });

      return { previousData };
    },

    onError: (_err, _deletedId, context) => {
      if (!context) return;
      context.previousData.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
    },
  });
};
