export type TransactionType = "income" | "expense";

export type Transaction = {
    id: string;
    amount: number;
    type: TransactionType;
    categoryId: string;
    date: string;
    description: string;
    createdAt: string;
    updatedAt: string;
};

export type Category = {
    id: string;
    name: string;
    color: string;
    icon: string;
    type: TransactionType;
};

export type Budget = {
    id: string;
    categoryId: string;
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
