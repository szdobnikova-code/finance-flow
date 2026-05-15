import { lazy } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";

import AppShell from "@/components/layout/AppShell";

const DashboardPage = lazy(() => import("@/pages/DashboardPage.tsx"));
const TransactionsPage = lazy(() => import("@/pages/TransactionsPage.tsx"));
const BudgetsPage = lazy(() => import("@/pages/BudgetsPage.tsx"));
const CategoriesPage = lazy(() => import("@/pages/CategoriesPage.tsx"));

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
