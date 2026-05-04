import { LayoutDashboard, ListOrdered, PiggyBank, Tags } from "lucide-react";
import { NavLink } from "react-router-dom";

import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/transactions", label: "Transactions", icon: ListOrdered },
  { to: "/budgets", label: "Budgets", icon: PiggyBank },
  { to: "/categories", label: "Categories", icon: Tags },
] as const;

export default function Navbar() {
  return (
    <nav className="sticky top-0 hidden h-screen w-[280px] shrink-0 flex-col border-r border-zinc-200 bg-zinc-100/70 md:flex dark:border-zinc-800 dark:bg-zinc-900/60">
      <div className="border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
        <h1 className="max-w-[180px] text-[13px] leading-5 font-semibold tracking-wide text-zinc-800 uppercase dark:text-zinc-200">
          Personal Finance Dashboard
        </h1>
      </div>

      <div className="flex flex-1 flex-col gap-0.5 px-3 py-3">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "flex h-8 items-center gap-2 rounded-md px-2.5 text-[13px] font-medium transition-colors",
                isActive
                  ? "bg-zinc-200/70 text-zinc-950 dark:bg-zinc-800/70 dark:text-zinc-50"
                  : "text-zinc-600 hover:bg-zinc-200/50 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-100",
              )
            }
          >
            <Icon className="size-4 shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>

      <div className="border-t border-zinc-200 px-3 py-3 dark:border-zinc-800">
        <ThemeToggle />
      </div>
    </nav>
  );
}
