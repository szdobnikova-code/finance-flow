import { Suspense } from "react";
import { Outlet } from "react-router-dom";

import MobileNavbar from "@/components/layout/MobileNavbar";
import Navbar from "@/components/layout/Navbar";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";

function PageFallback() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
      <Skeleton className="h-[260px] w-full" />
    </div>
  );
}

export default function AppShell() {
  return (
    <div className="flex min-h-svh bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <div className="hidden lg:block">
        <Navbar />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-zinc-200 px-4 lg:hidden dark:border-zinc-800">
          <div className="text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
            Personal Finance Dashboard
          </div>

          <MobileNavbar />
        </header>

        <main className="min-w-0 flex-1">
          <div className="w-full px-4 py-6 sm:px-6 md:px-10 md:py-10">
            <Suspense fallback={<PageFallback />}>
              <Outlet />
            </Suspense>
          </div>
        </main>
      </div>

      <Toaster position="top-center" duration={5000} />
    </div>
  );
}
