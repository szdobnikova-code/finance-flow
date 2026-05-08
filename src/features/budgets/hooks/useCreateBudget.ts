import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/api/queryKeys.ts";
import { api } from "@/lib/api.ts";
import type { Budget, BudgetInput } from "@/types/finance.ts";

interface MutationContext {
  previousData: Array<[readonly unknown[], Budget[] | undefined]>;
}

export const useCreateBudget = () => {
  const queryClient = useQueryClient();

  return useMutation<Budget, Error, BudgetInput, MutationContext>({
    mutationFn: async (newBudget) => {
      return await api.post<Budget>(`/budgets/`, newBudget);
    },

    onMutate: async (newBudget) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.budgets.all });

      const previousData = queryClient.getQueriesData<Budget[]>({
        queryKey: queryKeys.budgets.all,
      });

      queryClient.setQueriesData<Budget[]>({ queryKey: queryKeys.budgets.all }, (old) => {
        const optimisticBudg: Budget = {
          ...newBudget,
          id: "temp-id-" + Date.now(),
          createdAt: new Date().toDateString(),
          updatedAt: new Date().toDateString(),
        };
        return old ? [optimisticBudg, ...old] : [optimisticBudg];
      });

      return { previousData };
    },

    onError: (_err, _newBudget, context) => {
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
