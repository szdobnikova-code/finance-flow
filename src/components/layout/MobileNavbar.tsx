import { Menu } from "lucide-react";
import { useState } from "react";
import { NavLink } from "react-router-dom";

import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { navItems } from "@/config/navItems";
import { cn } from "@/lib/utils";

export default function MobileNavbar() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="bg-background h-9 w-9">
          <Menu className="h-4 w-4" />
          <span className="sr-only">Open navigation</span>
        </Button>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="h-svh max-h-svh border-r border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 [&>button]:right-6"
      >
        <SheetHeader className="border-b border-zinc-200 pb-3 dark:border-zinc-800">
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>

        <nav className="min-h-0 flex-1 overflow-y-auto py-3">
          <div className="flex flex-col gap-0.5">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setOpen(false)}
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
        </nav>

        <div className="shrink-0 border-t border-zinc-200 py-3 dark:border-zinc-800">
          <ThemeToggle />
        </div>
      </SheetContent>
    </Sheet>
  );
}
