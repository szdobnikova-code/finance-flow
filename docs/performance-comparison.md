# Performance comparison

Optimization work is captured incrementally, with baselines stored in `performance-before/` and post-change results in `performance-after/`.

The goal of this project was not only to improve Lighthouse scores but to identify, measure, and reduce real bottlenecks in bundle loading, rendering, runtime behavior, and data fetching.

---

# Day 9 — Bundle + runtime optimization

## Goal

Reduce initial JS payload, move heavy code off the synchronous boot path, and remove mock/runtime overhead from production builds.

---

## Headline results

| Metric                                          | Before    | After     | Δ             |
| ------------------------------------------------| ----------| ----------| ------------- |
| Sync-parsed entry JS (gz)                       | 336.25 KB | 41.29 KB  | **−87.7%**    |
| First-visit `/dashboard` JS (gz)                | 579.67 KB | 497.57 KB | −14.2%        |
| First-visit `/budgets` or `/categories` JS (gz) | 579.67 KB | ~199.7 KB | **−65.5%**    |
| Demo MSW chunk (gz)                             | 243.42 KB | 88.46 KB  | **−63.7%**    |
| Production MSW chunk                            | present   | removed   | eliminated    |
| Faker in runtime bundle                         | yes       | no        | eliminated    |
| Modules transformed                             | 3860      | 3544      | −316          |

---

## Key outcome

Production builds removed:

- MSW
- faker
- runtime fixture generation
- unnecessary synchronous route code

Critical JS path reduced from:

```txt
~580 KB gz
↓
~41 KB gz
```

for production builds.

---

## Changes shipped

### Bundle optimization

- Added `React.lazy` for routes
- Added `Suspense` boundaries
- Lazy-loaded dashboard charts
- Split chart code from dashboard page code
- Added minimal `manualChunks`
- Moved runtime `navItems` out of shared types

### Runtime optimization

Added separate build targets:

```txt
npm run build
npm run build:demo
```

Introduced:

- `VITE_ENABLE_MSW`
- conditional MSW bootstrap
- build-time fixture generation
- pre-generated JSON mocks

Removed:

- unconditional worker startup
- runtime faker generation
- `mockData.ts`

---

## Verification

Confirmed:

✓ `npm run build` excludes MSW entirely  
✓ `npm run build:demo` keeps mocks functional  
✓ `npm run preview` works  
✓ Vercel demo remains functional  
✓ No runtime faker imports remain  
✓ No static MSW imports remain in app bootstrap

---

## Outcome

Bundle startup ceased to be the dominant performance cost.

Subsequent profiling showed rendering and data processing as the next optimization targets.

---

# Day 10 — Render optimization

## Goal

Reduce render cost for large datasets and verify optimization impact using React DevTools Profiler.

Focus areas:

- virtualization
- rerender behavior
- filter updates
- search updates
- scroll performance

---

## Changes shipped

Implemented:

- TanStack Virtual for transaction lists
- reduced virtualization `overscan`
- memoized stable column definitions
- stabilized sort handlers with `useCallback`
- verified debounce behavior
- profiled filters, scrolling and table renders

---

## Render profiling results

| Metric | Before | After | Δ |
|--------|--------:|------:|--:|
| VirtualDataTable render | ~68 ms | ~56 ms | **−17.6%** |
| Scroll commits | higher spikes | lower spikes | improved |
| Excessive row rerenders | observed | none significant | reduced |
| Search update cost | low | low | stable |
| Filter update cost | ~17 ms | ~17 ms | unchanged |

---

## Observations

### Virtualized table

Before:

- larger commit spikes
- more visible work during scroll

After:

- reduced render duration
- smoother continuous scrolling
- fewer expensive commits

No visible frame drops observed during continuous scroll profiling.

---

### Filters

Expected rerenders occurred for:

- `TransactionFilters`
- `MultiSelect`
- `DateRangePicker`
- `SearchInput`

No abnormal rerender chains detected.

Filter updates remained within acceptable cost (~17 ms).

---

### Search

Observed:

- debounce prevented excessive updates
- no repeated query bursts
- low render cost (~1–2 ms)

---

## Optimization decisions intentionally NOT taken

Rejected:

- aggressive `React.memo`
- memoizing every handler
- extracting row components prematurely
- blanket `useMemo`

Reason:

Profiler evidence showed diminishing returns.

---

## Verification

Confirmed:

✓ virtualization reduces visible DOM work  
✓ scrolling remains smooth with large datasets  
✓ filters trigger expected rerenders only  
✓ debounce prevents unnecessary updates  
✓ no major bottlenecks remain in table rendering

---

## Outcome

After Day 9 reduced startup costs, rendering became the dominant optimization target.

Day 10 lowered render cost enough that future bottlenecks are more likely to come from:

- query invalidation strategy
- cache configuration
- data fetching patterns
- expensive transformations

rather than DOM size or synchronous rendering.

---

# Day 11 — Query cache optimization

## Goal

Reduce unnecessary network activity, improve cache reuse between route transitions, and stabilize optimistic updates.

---

## Changes shipped

Query configuration:

```txt
staleTime:
0 → 5 min

gcTime:
added (30 min)

refetchOnMount:
true → false
```

Implemented:

- added `gcTime`
- disabled aggressive remount refetching
- tuned cache lifecycle
- fixed query param serialization (`0` values preserved)
- corrected optimistic update logic
- fixed incorrect query keys in budget updates

---

## Optimistic update fixes

Fixed update mutations that incorrectly removed entities from cache.

Before:

```ts
old?.filter(item => item.id !== updated.id)
```

After:

```ts
old?.map(item =>
  item.id === updated.id
    ? { ...item, ...updated }
    : item
)
```

Applied to:

- transactions
- categories
- budgets

Additional fix:

```txt
queryKeys.transactions.all ❌
queryKeys.budgets.all ✅
```

for budget mutations.

---

## Observed behavior

Before:

```txt
Navigate away
↓
Return to page
↓
Repeated request
↓
Loading state shown
```

After:

```txt
Navigate away
↓
Return to page (< staleTime)
↓
Cached response reused
↓
No hard loading state
```

---

## Verification

React Query Devtools confirmed expected cache lifecycle behavior.

Observed:

```txt
Transactions page opened
↓
Query status: success
Observers: 1

Navigate away
↓
Observers: 0
Query remains cached

Return to page
↓
Observers: 1
Cached data reused
No loading spinner
```

Additional checks:

✓ 10,000 transaction records persisted in cache  
✓ inactive queries remained available  
✓ cached responses reused across navigation  
✓ repeated route changes did not trigger visible loading states  
✓ no excessive background fetching observed

Devtools snapshot showed:

```txt
Transactions:
Observers: 1
Status: success
Fetching: 0
Cached data: 10,000 rows
```

---

## Outcome

Cache tuning reduced unnecessary network activity while preserving responsive UI updates.

Perceived navigation performance improved because recently visited pages reused cached data instead of triggering immediate refetches.

After Day 11, major remaining bottlenecks are more likely to come from:

- expensive derived calculations
- pagination strategy
- large filtered datasets
- remaining query invalidation patterns

rather than repeated network requests.

---

# Remaining optimization targets

Potential future work:

- pagination vs infinite scroll
- selective query invalidation
- background refetch tuning
- expensive derived calculations
- cache strategy refinement
- Lighthouse after-measurements

These become the focus of Day 12+.

---

# Measurement environment

Measurements captured using:

- React DevTools Profiler
- Chrome DevTools Performance
- TanStack Query Devtools
- local production preview build (`npm run preview`)
- datasets up to 10,000 transactions
- same browser/device during before/after comparisons
