export const queryKeys = {
  transactions: {
    all: ["transactions"] as const,
    list: (filters: Record<string, unknown>) => ["transactions", "list", filters] as const,
    infinite: ["transactions", "infinite"] as const,
    infiniteList: (filters: Record<string, unknown>) =>
      ["transactions", "infinite", filters] as const,
  },
  categories: {
    all: ["categories"] as const,
  },
  budgets: {
    all: ["budgets"] as const,
  },
};
