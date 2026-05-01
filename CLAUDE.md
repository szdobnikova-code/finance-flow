# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project context

`finance-flow` is a portfolio-grade Personal Finance Dashboard SPA. The full design contract lives in [SPEC.md](./SPEC.md) — treat it as the source of truth for data model, routes, endpoints, features, and the performance story (10k transactions, virtualization, code-splitting, Lighthouse before/after in `docs/`). When the spec and existing code disagree, the spec wins unless the user says otherwise.

The repo is in **early scaffolding**: dependencies are installed and shadcn is wired up, but `src/App.tsx` is still the Vite starter and most of the directories described in the spec (`api/`, `hooks/`, `pages/`, `store/`, `types/`) are empty. New work should follow the spec's architecture rather than extending the placeholder starter UI.

## Commands

- `npm run dev` — Vite dev server
- `npm run build` — type-checks (`tsc -b`) then builds; the build will fail on TS errors, so it doubles as a typecheck gate
- `npm run lint` — ESLint over the repo
- `npm run preview` — preview the production build

There is **no `test` script yet** even though Vitest, RTL, and jsdom are installed. When you add the first test, also add `"test": "vitest"` (and likely `"test:run": "vitest run"`) to `package.json`. Playwright is named in the spec but is not yet a dependency — install and configure it when E2E work actually begins.

## Architecture

The app is frontend-only with a strict separation between server and client state:

- **Server state → TanStack Query** for transactions, categories, budgets. Query keys follow `['transactions', filters]`. Mutations should use optimistic updates; lists rely on `staleTime` + `select` for memoized projections.
- **Client/UI state → Zustand** for modals, theme, and any filters not promoted to the URL.
- **Mock backend → MSW** implements the endpoints in SPEC §6. There is no real API; do not introduce one without updating the spec.
- **Routing → React Router v7** (`react-router-dom` is installed) over the four routes in SPEC §8.
- **Forms → react-hook-form + Zod resolvers** (`@hookform/resolvers` is installed).
- **Charts → Recharts, lazy-loaded** via `React.lazy` / dynamic import to keep it out of the initial bundle.
- **Virtualization → `@tanstack/react-virtual`** for the transactions list (the 10k-row scenario is the headline perf demo).

Target structure under `src/` (per SPEC §16): `api/`, `components/{ui,transactions,budgets,charts}/`, `hooks/`, `lib/`, `pages/`, `store/`, `types/`. Keep new files inside this layout.

## Conventions

- **Path alias**: `@/*` maps to `src/*` (configured in both `tsconfig.json` and `vite.config.ts`). Prefer `@/...` imports over long relatives.
- **TypeScript is strict** with `noUnusedLocals`, `noUnusedParameters`, and `verbatimModuleSyntax` on. Use `import type { ... }` for type-only imports — bare `import` of a type will fail to build.
- **shadcn/ui** is configured with style `radix-nova`, base color `neutral`, CSS variables, and Lucide icons (`components.json`). Generate components with the shadcn CLI into `src/components/ui/` rather than hand-rolling Radix primitives. The `cn()` helper lives at `@/lib/utils`.
- **Tailwind v4** is used via the `@tailwindcss/vite` plugin (no `tailwind.config.js`); design tokens are CSS variables in `src/index.css`.
- **API responses** use the discriminated `ApiResponse<T> = { ok: true; data: T } | { ok: false; error: string }` shape from SPEC §6 — keep the MSW handlers and client wrappers consistent with this.

## Performance discipline

Performance is the point of this project, not an afterthought. Before reaching for a shortcut that defeats the demo (e.g., paginating server-side to dodge the 10k-row render, eagerly importing Recharts, skipping memoization on list rows), check SPEC §10–11 and prefer the documented technique. Lighthouse runs land in `docs/performance-before/` and `docs/performance-after/` with a comparison in `docs/performance-comparison.md` — preserve that structure when adding measurements.