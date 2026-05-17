# Performance comparison

Optimization work is captured incrementally, with baselines stored in `performance-before/` and post-change results in `performance-after/`.

The goal of this project was not only to improve Lighthouse scores but to identify, measure, and reduce real bottlenecks in bundle loading, rendering, and runtime behavior.

---

## Day 9 — Bundle + runtime optimization

### Goal

Reduce initial JS payload, move heavy code off the synchronous boot path, and remove mock/runtime overhead from production builds.

See:

- `performance-after/bundle.md`
- `performance-after/runtime.md`

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

## Biggest qualitative wins

Pages other than `/dashboard` no longer parse:

- Recharts
- dashboard code
- unrelated route code

Production builds no longer load:

- MSW
- faker
- runtime fixture generation

Mock data generation moved from:

```txt
browser runtime
↓
build step
```

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

Updated:

- Vercel deployment flow
- demo build behavior

---

## Bundle evolution

### Before

```txt
index.js
336 KB gz

browser.js (MSW + faker)
243 KB gz

Critical path:
~580 KB gz
```

### After (production build)

```txt
index.js
41 KB gz

MSW:
absent

faker:
absent

Critical path:
~41 KB gz
```

### After (`build:demo`)

```txt
index.js
41 KB gz

browser.js
88 KB gz

Critical path:
~129 KB gz
```

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

### Goal

Reduce render cost for large datasets and verify optimization impact using React DevTools Profiler.

Focus areas:

- virtualization
- rerender behavior
- filter updates
- search input updates
- scroll performance

---

## Changes shipped

Implemented:

- TanStack Virtual for transaction lists
- reduced virtualization `overscan`
- memoized stable column definitions
- stabilized sort handlers with `useCallback`
- verified debounce behavior for search input
- profiled filters, scrolling and table renders

Tested scenarios:

1. Continuous scroll through large dataset
2. Search input updates
3. Filter changes
4. Sorting changes

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

React Profiler showed:

### Virtualized table

Before optimization:

- larger commit spikes
- more visible work during scroll

After optimization:

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

Search debounce behaved correctly:

Expected:

```txt
typing
↓
pause
↓
single update
```

Observed:

- no excessive commits
- no repeated query bursts
- low render cost (~1–2 ms)

---

## Optimization decisions intentionally NOT taken

Rejected:

- aggressive `React.memo`
- memoizing every handler
- extracting row components prematurely
- blanket `useMemo` usage

Reason:

Profiler evidence showed diminishing returns.

Optimization was limited to changes with measurable impact.

---

## Verification

Confirmed:

✓ virtualization reduces visible DOM work  
✓ scrolling remains smooth with large datasets  
✓ filters trigger expected rerenders only  
✓ search debounce prevents unnecessary updates  
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

## Measurement environment

Measurements captured using:

- React DevTools Profiler
- Chrome DevTools Performance
- local production preview build (`npm run preview`)
- virtualized dataset with large transaction counts
- same hardware/browser during before/after comparison

---

## Remaining optimization targets

Next milestones:

- React Query `staleTime`
- React Query `gcTime`
- selective invalidation
- background refetch behavior
- pagination vs infinite scroll
- expensive derived calculations
- cache strategy tuning

These become the focus of Day 11.
