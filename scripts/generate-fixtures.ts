import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { faker } from "@faker-js/faker";

import type { Budget, Category, Transaction } from "../src/types/finance.ts";

faker.seed(20260515);

const categories: Category[] = [
  { id: 1, name: "Salary", color: "emerald", icon: "wallet", type: "income" },
  { id: 2, name: "Groceries", color: "violet", icon: "shopping-cart", type: "expense" },
  { id: 3, name: "Transport", color: "blue", icon: "car", type: "expense" },
  { id: 4, name: "Rent", color: "red", icon: "home", type: "expense" },
  { id: 5, name: "Entertainment", color: "pink", icon: "film", type: "expense" },
  { id: 6, name: "Food", color: "orange", icon: "coffee", type: "expense" },
];

const now = new Date().toISOString();

const transactions: Transaction[] = Array.from({ length: 10000 }, () => {
  const category = faker.helpers.arrayElement(categories);
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

const budgets: Budget[] = categories
  .filter((category) => category.type === "expense")
  .map((category) => ({
    id: faker.string.uuid(),
    categoryId: category.id,
    limit: Number(faker.finance.amount({ min: 300, max: 3000, dec: 0 })),
    spent: Number(faker.finance.amount({ min: 100, max: 2500, dec: 0 })),
    period: "monthly",
    createdAt: now,
    updatedAt: now,
  }));

const outDir = join(process.cwd(), "public", "fixtures");
await mkdir(outDir, { recursive: true });
await Promise.all([
  writeFile(join(outDir, "transactions.json"), JSON.stringify(transactions)),
  writeFile(join(outDir, "categories.json"), JSON.stringify(categories)),
  writeFile(join(outDir, "budgets.json"), JSON.stringify(budgets)),
]);

console.log(
  `Wrote fixtures: ${transactions.length} transactions, ${categories.length} categories, ${budgets.length} budgets → ${outDir}`,
);
