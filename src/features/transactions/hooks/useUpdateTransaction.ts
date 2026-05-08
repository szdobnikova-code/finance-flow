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

    onMutate: async (updatedTransaction) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.transactions.all });

      const previousData = queryClient.getQueriesData<Transaction[]>({
        queryKey: queryKeys.transactions.all,
      });

      queryClient.setQueriesData<Transaction[]>({ queryKey: queryKeys.transactions.all }, (old) =>
        old?.filter((t) => t.id !== updatedTransaction.id),
      );

      return { previousData };
    },

    onError: (_err, _updatePayload, context) => {
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
