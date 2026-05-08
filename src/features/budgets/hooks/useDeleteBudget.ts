import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/api/queryKeys.ts";
import { api } from "@/lib/api.ts";
import type { Budget } from "@/types/finance.ts";

interface MutationContext {
  previousData: Array<[readonly unknown[], Budget[] | undefined]>;
}

export const useDeleteBudget = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string, MutationContext>({
    mutationFn: async (id: string) => {
      await api.delete<string>(`/budgets/${id}`);
    },

    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.budgets.all });

      const previousData = queryClient.getQueriesData<Budget[]>({
        queryKey: queryKeys.budgets.all,
      });

      queryClient.setQueriesData<Budget[]>({ queryKey: queryKeys.budgets.all }, (old) =>
        old?.filter((b) => b.id !== deletedId),
      );

      return { previousData };
    },

    onError: (_err, _deletedId, context) => {
      if (!context) return;
      context.previousData.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.budgets.all });
    },
  });
};
