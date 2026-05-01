# Personal Finance Dashboard — Technical Specification

## 1. Overview

Personal Finance Dashboard is a single-page web application for tracking financial transactions, budgets, and spending insights. The application focuses on performance optimization, data-heavy UI, and modern React architecture.

This project is a frontend-only application using a mock API (MSW) to simulate real-world backend behavior.

## 2. Goals

### Primary Goals

- Handle 10,000+ transactions with smooth UI performance
- Demonstrate measurable performance improvements (Lighthouse metrics)
- Showcase modern React ecosystem:
  - Vite
  - React 19
  - TanStack Query
  - Zustand
- Provide a production-quality UI suitable for portfolio/demo

### Non-Goals

- No real backend or database
- No authentication system
- No multi-user support
- No real financial integrations

## 3. System Architecture

### High-Level Architecture

```
Client (React SPA)
   |
   | → TanStack Query (server state)
   |
   | → MSW (mock API layer)
   |
   | → Local state (Zustand)
```

### Key Principles

- Server state and client state are strictly separated
- UI is component-driven
- Data fetching is centralized via TanStack Query
- Performance optimizations are explicit and measurable

## 4. Tech Stack

### Core

- React 19
- TypeScript (strict mode)
- Vite

### UI

- Tailwind CSS
- shadcn/ui (Radix primitives)
- Lucide React

### State & Data

- TanStack Query — server state
- Zustand — UI state

### Forms & Validation

- react-hook-form
- Zod

### Charts

- Recharts (lazy-loaded)

### Testing

- Vitest (unit)
- React Testing Library
- Playwright (E2E)

### Tooling

- ESLint + Prettier
- Lighthouse CI

### Mock API

- MSW (Mock Service Worker)

## 5. Data Model

### Transaction

```ts
type Transaction = {
  id: string;
  amount: number;
  category: string;
  date: string;
  description: string;
  type: 'income' | 'expense';
  createdAt: string;
  updatedAt: string;
};
```

### Category

```ts
type Category = {
  id: string;
  name: string;
  color: string;
  icon: string;
};
```

### Budget

```ts
type Budget = {
  id: string;
  categoryId: string;
  limit: number;
  period: 'monthly';
};
```

## 6. API Design (Mocked via MSW)

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

### Response Format

```ts
type ApiResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };
```

## 7. State Management

### Server State (TanStack Query)

- Transactions
- Categories
- Budgets

Key patterns:

- Query keys: `['transactions', filters]`
- Caching via `staleTime`
- Optimistic updates for mutations

### Client State (Zustand)

UI state:

- modals
- filters (if not in URL)
- theme

## 8. Routing

Routes:

- `/dashboard`
- `/transactions`
- `/categories`
- `/budgets`

Router:

- React Router or TanStack Router

## 9. Key Features

### Transactions

- List with filtering:
  - category
  - date range
  - amount range
  - search
- Sorting (date, amount)
- CRUD operations

### Dashboard

- Summary cards:
  - total income
  - total expenses
  - balance
- Charts:
  - category distribution (pie)
  - monthly trend (line)
  - top categories (bar)

### Budgets

- Budget list per category
- Progress tracking
- Color-coded thresholds

## 10. Performance Strategy

### Baseline Scenario

- Dataset: 10,000 transactions
- Known bottlenecks:
  - large list rendering
  - heavy filtering
  - chart bundle size

### Optimization Techniques

**Rendering**

- Virtualization (TanStack Virtual)
- `React.memo` for list items

**Data**

- Memoized selectors
- Query caching (`staleTime`, `select`)

**Bundle**

- Code splitting (`React.lazy`)
- Dynamic import of Recharts

**UX**

- Debounced search
- Pagination / infinite scroll

## 11. Performance Metrics

Measured with Lighthouse:

- LCP (Largest Contentful Paint)
- INP (Interaction to Next Paint)
- CLS (Cumulative Layout Shift)
- Bundle size
- Performance score

Results documented in:

- `docs/performance-before/`
- `docs/performance-after/`
- `docs/performance-comparison.md`

## 12. Error Handling

- API errors handled via `ApiResponse`
- UI error states:
  - error banners
  - retry actions
- React Error Boundary for runtime crashes

## 13. Accessibility

Minimum requirements:

- Semantic HTML
- Keyboard navigation
- Visible focus states
- Accessible form labels
- WCAG AA color contrast

## 14. Testing Strategy

### Unit Tests

- Key components (e.g., `BudgetProgressBar`)

### Integration

- Form validation (react-hook-form + Zod)

### E2E (Playwright)

- Add transaction
- Delete transaction
- Navigation flow

## 15. Deployment

- Hosting: Vercel
- CI/CD: GitHub Actions
- Preview deployments per PR

## 16. Project Structure

```
src/
  api/
  components/
    ui/
    transactions/
    budgets/
    charts/
  hooks/
  lib/
  pages/
  store/
  types/
```

## 17. Trade-offs

- MSW instead of real backend → faster development, no infra overhead
- Client-side filtering → simpler architecture, less realistic scaling
- No authentication → focus on core UI and performance
- Recharts instead of lower-level charting → faster implementation, larger bundle

## 18. Future Improvements

- CSV import/export
- Recurring transactions
- Multi-currency support
- Server-side pagination
- Real backend integration
