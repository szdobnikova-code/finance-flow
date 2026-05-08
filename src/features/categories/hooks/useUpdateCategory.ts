import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/api/queryKeys.ts";
import { api } from "@/lib/api.ts";
import type { Category } from "@/types/finance";

interface MutationContext {
  previousData: Array<[readonly unknown[], Category[] | undefined]>;
}
type UpdatePayload = { id: number } & Partial<Category>;

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation<Category, Error, UpdatePayload, MutationContext>({
    mutationFn: async ({ id, ...data }) => {
      return await api.patch<Category>(`/categories/${id}`, data);
    },

    onMutate: async (updateCategory) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.categories.all });

      const previousData = queryClient.getQueriesData<Category[]>({
        queryKey: queryKeys.categories.all,
      });

      queryClient.setQueriesData<Category[]>({ queryKey: queryKeys.categories.all }, (old) =>
        old?.filter((c) => c.id !== updateCategory.id),
      );

      return { previousData };
    },

    onError: (_err, _updateCategory, context) => {
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
