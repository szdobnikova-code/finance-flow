import { type InfiniteData, useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/api/queryKeys.ts";
import { api } from "@/lib/api.ts";
import type { TransactionPage } from "@/types/finance";

interface MutationContext {
  previousData: Array<[readonly unknown[], InfiniteData<TransactionPage> | undefined]>;
}

export const useDeleteTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string, MutationContext>({
    mutationFn: async (id: string) => {
      await api.delete<string>(`/transactions/${id}`);
    },

    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.transactions.all });

      const previousData = queryClient.getQueriesData<InfiniteData<TransactionPage>>({
        queryKey: queryKeys.transactions.infinite,
      });

      queryClient.setQueriesData<InfiniteData<TransactionPage>>(
        { queryKey: queryKeys.transactions.infinite },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              data: page.data.filter((t) => t.id !== deletedId),
            })),
          };
        },
      );

      return { previousData };
    },

    onError: (_err, _deletedId, context) => {
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
