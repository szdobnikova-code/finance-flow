import { createBrowserRouter, Navigate } from "react-router-dom";

import AppShell from "@/components/layout/AppShell";
import BudgetsPage from "@/pages/BudgetsPage.tsx";
import CategoriesPage from "@/pages/CategoriesPage.tsx";
import DashboardPage from "@/pages/DashboardPage.tsx";
import TransactionsPage from "@/pages/TransactionsPage.tsx";

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { path: "/", element: <Navigate to="/dashboard" replace /> },
      { path: "/dashboard", element: <DashboardPage /> },
      { path: "/transactions", element: <TransactionsPage /> },
      { path: "/budgets", element: <BudgetsPage /> },
      { path: "/categories", element: <CategoriesPage /> },
    ],
  },
]);
