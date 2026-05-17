import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/api/queryKeys.ts";
import { api } from "@/lib/api.ts";
import type { Budget } from "@/types/finance.ts";

interface MutationContext {
  previousData: Array<[readonly unknown[], Budget[] | undefined]>;
}
type UpdatePayload = { id: string } & Partial<Budget>;

export const useUpdateBudget = () => {
  const queryClient = useQueryClient();

  return useMutation<Budget, Error, UpdatePayload, MutationContext>({
    mutationFn: async ({ id, ...data }) => {
      return await api.patch<Budget>(`/budgets/${id}`, data);
    },

    onMutate: async (updatedBudget) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.budgets.all });

      const previousData = queryClient.getQueriesData<Budget[]>({
        queryKey: queryKeys.budgets.all,
      });

      queryClient.setQueriesData<Budget[]>({ queryKey: queryKeys.budgets.all }, (old) =>
        old?.map((budget) =>
          budget.id === updatedBudget.id
            ? {
                ...budget,
                ...updatedBudget,
              }
            : budget,
        ),
      );

      return { previousData };
    },

    onError: (_err, _updatedBudget, context) => {
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
