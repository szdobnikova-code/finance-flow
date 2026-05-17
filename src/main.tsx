import "./index.css";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { NuqsAdapter } from "nuqs/adapters/react-router/v7";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App.tsx";

// Finance data changes often enough that we want freshness on focus, but not so
// often that we hammer the API on every render. 30s staleTime is the sweet spot:
// fast enough that a mutation in another tab is visible quickly, slow enough
// that re-mounting a component (e.g. closing a modal) does not trigger a refetch.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      retry: 1,
    },

    mutations: {
      retry: 1,
    },
  },
});

declare global {
  interface Window {
    __TANSTACK_QUERY_CLIENT__: import("@tanstack/query-core").QueryClient;
  }
}

// This code is for all users
window.__TANSTACK_QUERY_CLIENT__ = queryClient;

async function bootstrap() {
  if (import.meta.env.VITE_ENABLE_MSW === "true") {
    const { worker } = await import("@/api/msw/browser");
    await worker.start({ onUnhandledRequest: "bypass" });
  }

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <NuqsAdapter>
        <QueryClientProvider client={queryClient}>
          <App />
          <ReactQueryDevtools />
        </QueryClientProvider>
      </NuqsAdapter>
    </StrictMode>,
  );
}

bootstrap();
