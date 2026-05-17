export type ApiResponse<T> = { ok: true; data: T } | { ok: false; error: string };

export type TransactionType = "income" | "expense";

export type Transaction = {
  id: string;
  amount: number;
  type: TransactionType;
  categoryId: number;
  date: string;
  description: string;
  createdAt: string;
  updatedAt: string;
};

export type TransactionInput = Omit<Transaction, "id" | "createdAt" | "updatedAt">;

export type TransactionPage = {
  data: Transaction[];
  nextCursor: string | null;
};

export const CATEGORY_ICONS = [
  "wallet",
  "shopping-cart",
  "car",
  "home",
  "utensils",
  "coffee",
  "briefcase",
  "graduation-cap",
  "heart",
  "dumbbell",
  "plane",
  "gift",
  "music",
  "film",
  "shopping-bag",
  "receipt",
] as const;

export const CATEGORY_COLORS = [
  "emerald",
  "violet",
  "blue",
  "red",
  "amber",
  "pink",
  "cyan",
  "orange",
] as const;

export type CategoryIcon = (typeof CATEGORY_ICONS)[number];
export type CategoryColor = (typeof CATEGORY_COLORS)[number];

export type Category = {
  id: number;
  name: string;
  color: CategoryColor;
  icon: CategoryIcon;
  type: TransactionType;
};

export type CategoryInput = Omit<Category, "id">;

export type Budget = {
  id: string;
  categoryId: number;
  limit: number;
  spent: number;
  period: "monthly";
  createdAt: string;
  updatedAt: string;
};

export type BudgetInput = Omit<Budget, "id" | "createdAt" | "updatedAt">;
