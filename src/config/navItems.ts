import { LayoutDashboard, ListOrdered, PiggyBank, Tags } from "lucide-react";

export const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/transactions", label: "Transactions", icon: ListOrdered },
  { to: "/budgets", label: "Budgets", icon: PiggyBank },
  { to: "/categories", label: "Categories", icon: Tags },
] as const;
