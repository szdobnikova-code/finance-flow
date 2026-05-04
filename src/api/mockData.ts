import { faker } from "@faker-js/faker";

import type { Budget, Category, Transaction } from "@/types/finance";

export const categories: Category[] = [
  { id: 1, name: "Salary", color: "emerald", icon: "wallet", type: "income" },
  { id: 2, name: "Groceries", color: "violet", icon: "shopping-cart", type: "expense" },
  { id: 3, name: "Transport", color: "blue", icon: "car", type: "expense" },
  { id: 4, name: "Rent", color: "red", icon: "home", type: "expense" },
];

export const transactions: Transaction[] = Array.from({ length: 1000 }, () => {
  const category = faker.helpers.arrayElement(categories);
  const now = new Date().toISOString();

  return {
    id: faker.string.uuid(),
    amount: Number(faker.finance.amount({ min: 5, max: 5000, dec: 2 })),
    type: category.type,
    categoryId: category.id,
    date: faker.date.recent({ days: 180 }).toISOString(),
    description: faker.finance.transactionDescription(),
    createdAt: now,
    updatedAt: now,
  };
});

export const budgets: Budget[] = categories
  .filter((category) => category.type === "expense")
  .map((category) => ({
    id: faker.string.uuid(),
    categoryId: category.id,
    limit: Number(faker.finance.amount({ min: 300, max: 3000, dec: 0 })),
    spent: Number(faker.finance.amount({ min: 100, max: 2500, dec: 0 })),
    period: "monthly",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
