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

export type Category = {
  id: number;
  name: string;
  color: string;
  icon: string;
  type: TransactionType;
};

export type Budget = {
  id: string;
  categoryId: number;
  limit: number;
  spent: number;
  period: "monthly";
  createdAt: string;
  updatedAt: string;
};

export type DateRange = {
  from: string;
  to: string;
};
