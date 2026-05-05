export const queryKeys = {
  transactions: {
    all: ["transactions"] as const,
    list: (filters: Record<string, unknown>) => ["transactions", filters] as const,
  },
  categories: {
    all: ["categories"] as const,
  },
  budgets: {
    all: ["budgets"] as const,
  },
};
