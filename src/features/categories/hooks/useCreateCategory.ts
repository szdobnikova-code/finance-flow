import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/api/queryKeys.ts";
import { api } from "@/lib/api.ts";
import type { Category, CategoryInput } from "@/types/finance";

interface MutationContext {
  previousData: Array<[readonly unknown[], Category[] | undefined]>;
}

export const useCreateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation<Category, Error, CategoryInput, MutationContext>({
    mutationFn: async (newCategory) => {
      return await api.post<Category>(`/categories/`, newCategory);
    },

    onMutate: async (newCategory) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.categories.all });

      const previousData = queryClient.getQueriesData<Category[]>({
        queryKey: queryKeys.categories.all,
      });

      queryClient.setQueriesData<Category[]>({ queryKey: queryKeys.categories.all }, (old) => {
        const optimisticCat: Category = {
          id: -Date.now(),
          ...newCategory,
        };
        return old ? [optimisticCat, ...old] : [optimisticCat];
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
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
    },
  });
};
