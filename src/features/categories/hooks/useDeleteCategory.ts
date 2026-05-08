import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/api/queryKeys.ts";
import { api } from "@/lib/api.ts";
import type { Category } from "@/types/finance";

interface MutationContext {
  previousData: Array<[readonly unknown[], Category[] | undefined]>;
}

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, number, MutationContext>({
    mutationFn: async (id) => {
      await api.delete<number>(`/categories/${id}`);
    },

    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.categories.all });

      const previousData = queryClient.getQueriesData<Category[]>({
        queryKey: queryKeys.categories.all,
      });

      queryClient.setQueriesData<Category[]>({ queryKey: queryKeys.categories.all }, (old) =>
        old?.filter((c) => c.id !== deletedId),
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
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
    },
  });
};
