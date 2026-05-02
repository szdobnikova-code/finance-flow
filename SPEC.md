        # Personal Finance Dashboard — Specification

Internal working document. Source of truth for data model, routes, endpoints, features, and the performance story. When this spec and existing code disagree, the spec wins unless explicitly overridden.

## 1. Overview

Single-page web application for tracking financial transactions, budgets, and spending insights. Frontend-only, uses MSW to mock the API. The point of the project is performance optimization, modern React 19 + TypeScript stack, and a data-heavy UI that scales to 10k+ records.

## 2. Goals

### Primary

- Handle 10,000+ transactions with smooth UI performance
- Demonstrate measurable performance improvements (Lighthouse before/after)
- Showcase TypeScript generics via reusable `DataTable<T>` and other primitives
- Production-quality UI suitable for portfolio/demo

### Non-Goals

- No real backend or database
- No authentication
- No multi-user support
- No real financial integrations

## 3. Architecture

### High-level

```
Client (React SPA)
   │
   ├─ TanStack Query → server state, caching, mutations
   ├─ nuqs           → URL state (filters, sort, view)
   ├─ useState       → local component state (modals, hover, form)
   └─ MSW            → mock API layer
```

### Principles

- State is split by concern: server / URL / local. No global UI store by default.
- Filters always live in the URL — shareable, survive refresh, work with browser back/forward.
- UI is component-driven. Generic `DataTable<T>` is the primary tabular primitive.
- Performance optimizations are explicit, measured, and applied only where needed.

## 4. Tech Stack

### Core

- React 19 (`react-is` override required for Recharts compatibility)
- TypeScript (strict mode)
- Vite

### UI

- Tailwind CSS v4 (via `@tailwindcss/vite`)
- shadcn/ui (Radix primitives, style `radix-nova`, base color `neutral`)
- Lucide React

### State & Data

- TanStack Query — server state
- nuqs — URL search params for filters
- `useState` — local component state
- Zustand — installed but unused by default; only added if a real global UI state need emerges

### Forms

- react-hook-form + Zod (`@hookform/resolvers`)

### Charts

- Recharts (lazy-loaded via `React.lazy`)

### Routing

- React Router v7 (`react-router-dom`)

### Virtualization

- `@tanstack/react-virtual` (only for the 10k-row transactions list)

### Testing

- Vitest + React Testing Library (unit)
- Playwright (E2E — to be added later)

### Tooling

- ESLint + Prettier
- Lighthouse CI (GitHub Actions, runs on PRs)

### Mock API

- MSW (Mock Service Worker)

### Deployment

- Vercel (with preview deployments per PR)

## 5. Data Model

```ts
type Transaction = {
  id: string;
  amount: number;
  category: string;
  date: string;
  description: string;
  type: "income" | "expense";
  createdAt: string;
  updatedAt: string;
};

type Category = {
  id: string;
  name: string;
  color: string;
  icon: string;
};

type Budget = {
  id: string;
  categoryId: string;
  limit: number;
  period: "monthly";
};
```

## 6. API (Mocked via MSW)

### Endpoints

```
GET    /transactions
POST   /transactions
PATCH  /transactions/:id
DELETE /transactions/:id

GET    /categories
POST   /categories

GET    /budgets
POST   /budgets
```

### Response shape

```ts
type ApiResponse<T> = { ok: true; data: T } | { ok: false; error: string };
```

Use this discriminated union consistently in MSW handlers and client wrappers.

## 7. State Management

### Server state — TanStack Query

- Transactions, categories, budgets
- Query keys include filter values: `['transactions', filters]`
- `staleTime` and `select` for memoized projections
- Optimistic updates for mutations
- Selective invalidation on related changes

### URL state — nuqs

Stored in URL search params:

- Filter values: category (multi-select), date range, amount min/max, search text
- Sort: field and direction
- View selection where applicable

Rationale: filters survive refresh, work with browser back/forward, produce shareable URLs.

### Local component state — `useState`

- Modal open/close (lives in the component owning the modal trigger)
- Form state (via react-hook-form)
- Transient UI: hover, focus

### Theme

Tailwind `dark:` classes; preference persisted to `localStorage` directly. No store needed.

## 8. Routing

Four routes, all under React Router v7:

- `/dashboard` — landing with summary cards and charts
- `/transactions` — full transaction list with filters
- `/categories` — category management
- `/budgets` — budget tracking with progress

## 9. Features

### Transactions

- Generic `DataTable<T>` component (typed via generics) used here and on categories/budgets pages
- Columns config:
  ```ts
  type Column<T> = {
    key: keyof T;
    header: string;
    render?: (value: T[keyof T], row: T) => React.ReactNode;
    sortable?: boolean;
  };
  ```
- Sortable columns (click header)
- Filtering: category (multi-select), date range, amount min/max, search (debounced 300ms)
- Filter state synced to URL via nuqs
- Active filter chips above the table
- CRUD via modal forms (react-hook-form + Zod)
- Empty and loading states
- Virtualization (TanStack Virtual) added in the performance phase, not before

### Dashboard

- Summary cards: total income, total expenses, balance, largest category
- Charts: category distribution (pie), monthly trend (line), top categories (bar)
- Date range selector in header
- Recharts loaded dynamically (out of the initial bundle)

### Categories

- DataTable with category-specific columns (name, color swatch, icon)
- CRUD forms

### Budgets

- DataTable with budget-specific columns
- Progress bar for each (spent / limit) as a custom render
- Color thresholds: green < 70%, yellow 70–90%, red > 90%
- CRUD forms

## 10. Performance Strategy

### Baseline

- Dataset: 10,000 transactions
- Known bottlenecks:
  - Large list rendering
  - Heavy filtering and sorting
  - Chart bundle size on initial load

### Techniques

**Rendering**

- Virtualization (TanStack Virtual) for lists > 100 items
- `React.memo` on list rows with custom equality where appropriate

**Data**

- Memoized selectors via TanStack Query `select`
- `useMemo` for filter/aggregation computations

**Bundle**

- Code splitting per route (`React.lazy`)
- Recharts dynamic import (~150kb saved on initial load)

**UX**

- Debounced search (300ms)
- Pagination or infinite scroll for very large views

### Discipline

Optimizations are applied during the dedicated performance phase. Baseline first (Lighthouse + React DevTools Profiler), then targeted change, then measure delta.

## 11. Performance Metrics

Measured with Lighthouse:

- LCP (Largest Contentful Paint)
- INP (Interaction to Next Paint)
- CLS (Cumulative Layout Shift)
- Bundle size
- Performance score

Documented in:

- `docs/performance-before/`
- `docs/performance-after/`
- `docs/performance-comparison.md`

## 12. Error Handling

- API errors handled via the `ApiResponse` discriminated union
- UI states: error banners, retry actions, empty/loading states for all async operations
- React Error Boundary for runtime crashes

## 13. Accessibility

- Semantic HTML
- Keyboard navigation
- Visible focus states
- Accessible form labels (via react-hook-form + native label association)
- WCAG AA color contrast
- shadcn/ui primitives provide baseline a11y — preserved, not overridden

## 14. Testing Strategy

### Unit (Vitest + RTL)

- Critical components (e.g. `DataTable`, `BudgetProgressBar`)
- Utility functions (formatters, filter logic)

### Integration

- Form validation (react-hook-form + Zod)

### E2E (Playwright)

- Add transaction
- Delete transaction
- Filter transactions and verify URL updates
- Navigation flow

Coverage is targeted, not exhaustive. Goal: protect critical paths and demonstrate testing skills, not 100%.

## 15. Project Structure

```
src/
  api/
    msw/                 # MSW handlers and shared helpers
    queryKeys.ts         # TanStack Query key registry
  components/
    ui/                  # shadcn primitives (CLI-generated)
    layout/              # app shell, navigation, chrome
    DataTable.tsx        # generic typed table
  features/
    transactions/
    budgets/
    categories/
    dashboard/           # charts live here, not in a top-level charts/
  hooks/                 # cross-feature only
  lib/                   # pure utilities (cn lives here)
  pages/                 # route components
  store/                 # Zustand stores — may stay empty
  types/                 # shared TS types

tests/
  unit/                  # not co-located in src/
```

## 16. Trade-offs

- **MSW instead of real backend** — faster development, no infra overhead; frontend stays backend-agnostic
- **Client-side filtering** — simpler architecture, less realistic scaling; acceptable at project scope
- **No authentication** — focus on UI and performance
- **No global UI state library by default** — avoids premature complexity; added only on real need
- **Recharts over D3/Visx** — faster implementation, larger bundle (mitigated via lazy loading)
- **React Router v7 over TanStack Router** — already installed; v7 type-safety is sufficient for project scope

## 17. Future Improvements

- CSV import/export
- Recurring transactions
- Multi-currency support
- Server-side pagination
- Real backend integration
- Service Worker for offline-first behavior
