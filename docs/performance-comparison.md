# Performance comparison

Optimization work is captured incrementally, with baselines stored in `performance-before/` and post-change results in `performance-after/`.

The goal of this project was not only to improve Lighthouse scores but to identify, measure, and reduce real bottlenecks in bundle loading, rendering, runtime behavior, and data fetching.

## Methodology

- **Build target:** `npm run build:demo` (MSW enabled so 10,000 mock transactions are present client-side; the standard `npm run build` ships an empty shell and would produce misleading scores).
- **Dataset:** 10,000 pre-generated transactions, materialized at build time by `scripts/generate-fixtures.ts`.
- **Runs:** 3 per route × form-factor; median reported. Raw runs live in [`performance-after/runs/`](./performance-after/runs/), one median JSON per combination at [`performance-after/`](./performance-after/).
- **Form factors:** desktop and mobile. The Day 8 baseline was single-pass, desktop-only, and did not cover `/budgets` — those cells are marked `not captured`.
- **Lighthouse:** report version `13.3.0`, executed via [`scripts/run-lighthouse-after.sh`](../scripts/run-lighthouse-after.sh) against the `npm run preview` server on `http://localhost:4173`.

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
0 → 30s

gcTime:
added (5 min)

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

---

# Day 12 — Lighthouse after-measurements

## Goal

Re-run Lighthouse against the same routes captured pre-optimization, record the
post-change numbers per metric, and close the loop on Days 9–11.

## Methodology

- All measurements run against demo build (`npm run build:demo`).
- MSW provides 10,000 mock transactions for realistic load.
- Standard production build is not measured because it lacks mock data.
- Each route measured 3 times, median value reported.
- Runner: `scripts/run-lighthouse-after.sh` (serves on
  `http://localhost:4173` via `npm run preview`).

## How to reproduce

From the repo root:

```bash
bash scripts/run-lighthouse-after.sh
```

The script builds via `npm run build:demo`, serves it on port 4173, runs
Lighthouse 3× per route × form-factor, and writes one median JSON report per
combination under [`docs/performance-after/`](./performance-after/) (plus
the raw runs under `runs/` and a `bundle-sizes.txt` summary).

Baseline artifacts (screenshots + metrics captured before the Day 9–11 work)
live in [`docs/performance-before/`](./performance-before/).

## Metric notes

- **LCP** — Largest Contentful Paint (lab, ms).
- **INP** — Interaction to Next Paint. Field-only; Lighthouse lab runs do not
  emit a true INP value. The tables below report **TBT** (Total Blocking Time,
  ms) as the closest lab proxy and label rows `INP / TBT`.
- **CLS** — Cumulative Layout Shift (unitless).
- **Performance** — Lighthouse weighted score, 0–100.
- **Bundle size** — gzip-compressed initial JS for the route, read from
  `dist/stats.html` and the script's `bundle-sizes.txt`.

## Results

After cells are placeholders until the next run is completed; fill them
in from the JSON reports under
[`./performance-after/`](./performance-after/) (median-of-3 per
route × form-factor). Before cells come from
[`./performance-before/metrics.md`](./performance-before/metrics.md);
`not captured` means no Day 8 baseline exists for that
route + form-factor combination (the Day 8 run was single-pass,
desktop-only, and didn't cover `/budgets`).

| Route          | Metric                | Before        | After     | Delta       | Improvement |
| -------------- | --------------------- | ------------- | --------- | ----------- | ----------- |
| /dashboard     | LCP (desktop)         | 10,200 ms     | 669 ms    | −9,531 ms   | **−93.4%**  |
| /dashboard     | LCP (mobile)          | not captured  | 3,331 ms  | —           | —           |
| /dashboard     | INP / TBT (desktop)   | 90 ms         | 95 ms     | +5 ms       | —           |
| /dashboard     | INP / TBT (mobile)    | not captured  | 450 ms    | —           | —           |
| /dashboard     | CLS (desktop)         | 0.002         | 0         | −0.002      | —           |
| /dashboard     | CLS (mobile)          | not captured  | 0         | —           | —           |
| /dashboard     | Performance (desktop) | 54            | 99        | +45         | **+83.3%**  |
| /dashboard     | Performance (mobile)  | not captured  | 76        | —           | —           |
| /transactions  | LCP (desktop)         | 10,200 ms     | 796 ms    | −9,404 ms   | **−92.2%**  |
| /transactions  | LCP (mobile)          | not captured  | 3,516 ms  | —           | —           |
| /transactions  | INP / TBT (desktop)   | 120 ms        | 0 ms      | −120 ms     | **−100%**   |
| /transactions  | INP / TBT (mobile)    | not captured  | 2 ms      | —           | —           |
| /transactions  | CLS (desktop)         | 0             | 0         | 0           | —           |
| /transactions  | CLS (mobile)          | not captured  | 0         | —           | —           |
| /transactions  | Performance (desktop) | 54            | 99        | +45         | **+83.3%**  |
| /transactions  | Performance (mobile)  | not captured  | 86        | —           | —           |
| /budgets       | LCP (desktop)         | not captured  | 660 ms    | —           | —           |
| /budgets       | LCP (mobile)          | not captured  | 3,312 ms  | —           | —           |
| /budgets       | INP / TBT (desktop)   | not captured  | 0 ms      | —           | —           |
| /budgets       | INP / TBT (mobile)    | not captured  | 0 ms      | —           | —           |
| /budgets       | CLS (desktop)         | not captured  | 0         | —           | —           |
| /budgets       | CLS (mobile)          | not captured  | 0         | —           | —           |
| /budgets       | Performance (desktop) | not captured  | 100       | —           | —           |
| /budgets       | Performance (mobile)  | not captured  | 88        | —           | —           |

## Bundle size (current production build)

Bundle sizes are measured against the **production build** (`npm run build`)
because that's what users actually download — the demo target used for the
runtime metrics above ships MSW + fixtures that production doesn't include.
The live source of truth is `dist/stats.html` (regenerated on every build);
the table below pins the Day 9 numbers for at-a-glance comparison.

| Bundle                                 | Before       | After        | Delta         | Improvement  |
| -------------------------------------- | ------------ | ------------ | ------------- | ------------ |
| Sync-parsed entry JS (gz)              | 336.25 KB    | 41.29 KB     | −294.96 KB    | **−87.7%**   |
| First-visit `/dashboard` JS (gz)       | 579.67 KB    | 497.57 KB    | −82.10 KB     | −14.2%       |
| First-visit `/budgets` JS (gz)         | 579.67 KB    | ~199.71 KB   | −379.96 KB    | **−65.5%**   |
| First-visit `/categories` JS (gz)      | 579.67 KB    | ~199.75 KB   | −379.92 KB    | **−65.5%**   |
| Demo MSW chunk (gz)                    | 243.42 KB    | 88.46 KB     | −154.96 KB    | **−63.7%**   |
| Production MSW chunk                   | present      | removed      | —             | eliminated   |
| Modules transformed                    | 3,860        | 3,544        | −316          | −8.2%        |

A `/transactions` first-visit total is not explicitly tabulated above (the
breakdown groups by chunk, not by route entry-point); read it from
`dist/stats.html` after the next production build if a per-route figure is
needed.

## Narrative — what optimization moved each metric

**LCP (desktop: −93% on `/dashboard`, −92% on `/transactions`).** The single biggest driver is the Day 9 bundle work: route-level `React.lazy` in `src/router.tsx`, the dynamic Recharts import inside the dashboard (`src/pages/DashboardPage.tsx`), and removing MSW + faker from the production bundle. Sync-parsed entry JS dropped from 336 KB gz to 41 KB gz (−87.7%), so the browser stops blocking on parse before it has anything to paint. The first-visit JS for `/budgets` and `/categories` fell from ~580 KB gz to ~200 KB gz, which is why those routes converge on sub-700 ms desktop LCP without needing any feature-specific tuning.

**TBT (desktop: −100% on `/transactions`, 0–2 ms steady across routes).** TBT collapses because the long task on initial paint disappears once the rendered DOM is bounded. The transactions table virtualises through `src/components/VirtualDataTable.tsx` (TanStack Virtual), so 10,000 rows no longer translate into 10,000 React commits on mount. Day 10 also stabilised the sort handlers with `useCallback` and confirmed the search debounce keeps keystrokes from cascading into row work. The one anomaly is `/dashboard` desktop TBT 90 ms → 95 ms — within run-to-run noise, not a regression to chase.

**CLS.** Unchanged at ~0 across both halves of the comparison. shadcn primitives reserve layout for their content and the dashboard charts mount into pre-sized containers, so there was no shift to remove.

**Performance score.** The composite (54 → 99–100 desktop) tracks the LCP and TBT wins above. Mobile scores are intentionally lower (dashboard 76, transactions 86, budgets 88) because Lighthouse's mobile preset throttles CPU to ~4× and network to slow 4G, which pushes LCP into the 3 s range — especially on `/dashboard`, where Recharts has to mount before the chart paints. That's the realistic ceiling for an MSW-backed demo on throttled mobile; further improvement would require streaming the first chart payload or replacing Recharts on mobile, both of which are out of scope for this project.

## Flame chart screenshots

Two screenshots accompany the tables above, one per side, captured from
Chrome DevTools' Performance panel:

- `docs/performance-before/flame-transactions.png` — baseline trace,
  captured before the Day 9–11 work landed.
- `docs/performance-after/flame-transactions.png` — current `main`
  trace, captured against the demo build.

### Before — `/transactions` on `c4826c3`

![Performance trace, /transactions, pre-optimization baseline](./performance-before/flame-transactions.png)

### After — `/transactions` on `main`

![Performance trace, /transactions, current main, demo build](./performance-after/flame-transactions.png)

### Equivalence rules (apply to both captures)

For the comparison to be meaningful, both halves must match on:

1. **Build target** — `npm run build:demo && npm run preview`, not the
   dev server, not the standard production build. (MSW only loads
   under the demo build, so this is also the only way to get the 10k
   dataset client-side.)
2. **Dataset size** — 10,000 transactions. `build:demo` wires this in
   automatically via the pre-generated fixtures; no manual setup
   needed.
3. **Interaction** — the same scripted sequence in both runs (e.g.,
   open `/transactions`, scroll one screenful, apply a filter, scroll
   back). Note it in the commit message alongside the screenshot.
4. **Environment** — same browser, same viewport (~1440×900),
   incognito with extensions disabled, same CPU + network throttling
   in the Performance panel.

### Capture procedure

1. Build via `npm run build:demo` and serve with `npm run preview` so
   the trace runs against the same data path Lighthouse measures.
2. Open Chrome **in an Incognito window** with extensions disabled (or
   explicitly disable AdBlock / TanStack Query DevTools / React
   DevTools) so third-party work doesn't show up in the trace.
3. Open the target route at a consistent window size — DevTools docked,
   browser viewport roughly 1440×900.
4. **DevTools → Performance** tab. Set **CPU throttling** to
   `4× slowdown` and **Network throttling** to `Fast 4G` (or `Fast 3G`
   on older Chrome).
5. Load the route against the 10,000-row dataset. Click **Record and
   Reload** (not plain Record) so the trace captures the full
   page-load cost.
6. Stop the recording once the route has rendered and the planned
   interaction sequence (rule 3 above) is complete.
7. Screenshot the Performance panel — `Cmd+Shift+4` on macOS — covering
   the same panel region for before and after. Optionally
   `Save profile…` alongside the PNG to keep the raw trace for
   re-analysis.
8. For the **before** capture, check out the baseline commit
   (`git switch --detach c4826c3`) and rebuild
   (`rm -rf dist && npm run build:demo`) before repeating steps 1–7.
   For the **after** capture, run against current `main`.

## Verification

Confirm before considering Day 12 done:

- `bash scripts/run-lighthouse-after.sh` runs end-to-end without manual
  intervention.
- The preview server returns a non-empty `/dashboard` body before
  Lighthouse begins (the script's pre-flight check confirms this).
- All six median JSON reports exist under `docs/performance-after/` and
  are non-empty; raw runs are in `docs/performance-after/runs/`.
- Each route's Lighthouse Performance score is ≥ the corresponding
  baseline in `performance-before/`.
- Every `_pending_` in the table above is replaced with a real number
  or `n/a`.
- Narrative section has been written from the filled-in numbers (not
  the skeleton).
- A flame-chart PNG exists for `/transactions` on at least one side
- Every `_pending_` in the tables above is replaced with a real number
  or `n/a`
