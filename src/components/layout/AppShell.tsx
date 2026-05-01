import { Outlet } from "react-router-dom";

import Navbar from "@/components/layout/Navbar";

export default function AppShell() {
  return (
    <div className="flex min-h-svh bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <Navbar />

      <main className="min-w-0 flex-1">
        <div className="w-full max-w-5xl px-10 py-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
