# Performance baseline (Day 8)

Dataset size:
10000 generated transactions

Environment:

- React 19
- Vite
- TanStack Query
- Recharts
- Local dev build
- Chrome Lighthouse
- React DevTools Profiler

---

# Dashboard page

## Lighthouse

Performance score: 54

Metrics:

- FCP: 5.3s
- LCP: 10.2s
- TBT: 90ms
- CLS: 0.002
- Speed Index: 5.5s

## Local metrics

- LCP: 0.66s
- CLS: 0
- INP: 8ms

## React Profiler

Observed render:

7–8ms

Main renders:

- PieSectors
- CategoryLegend
- SummaryCard
- DateRangePicker

Conclusion:

Dashboard scales reasonably with 10k transactions.
Charts are not currently major bottleneck.

---

# Transactions page

## Lighthouse

Performance score: 54

Metrics:

- FCP: 5.3s
- LCP: 10.2s
- TBT: 120ms
- CLS: 0
- Speed Index: 5.4s

## Local metrics

- LCP: 3.54s
- CLS: 0
- INP: 8ms

## React Profiler

Observed renders:

12–16ms

Main renders:

- TransactionFilters
- MultiSelect
- SearchInput
- DateRangePicker

Conclusion:

Transactions page becomes bottleneck at 10k records.

Potential causes:

- filtering large arrays
- sorting large arrays
- full rerenders
- virtualization missing or ineffective

---

# Initial optimization targets (Week 2)

Priority 1:

Investigate transaction list virtualization.

Priority 2:

Memoize expensive filters.

Priority 3:

React Query cache tuning.

Current QueryClient:

```ts
staleTime: 0;
refetchOnMount: true;
```

Likely excessive refetching.

Priority 4:

Profile bundle size.

---

# Expected goals after optimization

Transactions:

LCP:
3.54s → <1.5s

Dashboard:

Maintain <1s

Lighthouse:

54 → >80

Render times:

12–16ms → <5ms
