# Performance comparison

Optimization work is captured per-day, with the baseline in `performance-before/` and post-change results in `performance-after/`.

---

## Day 9 — Bundle + runtime optimization

Goal:

Reduce initial JS payload, move heavy code off the synchronous boot path, and remove mock/runtime overhead from production builds.

See:

- `performance-after/bundle.md`
- `performance-after/runtime.md` (optional if you split docs)

---

### Headline results

| Metric | Before | After | Δ |
| --- | ---: | ---: | ---: |
| Sync-parsed entry JS (gz) | 336.25 KB | 41.29 KB | **−87.7%** |
| First-visit `/dashboard` JS (gz) | 579.67 KB | 497.57 KB | −14.2% |
| First-visit `/budgets` or `/categories` JS (gz) | 579.67 KB | ~199.7 KB | **−65.5%** |
| Demo MSW chunk (gz) | 243.42 KB | 88.46 KB | **−63.7%** |
| Production MSW chunk | present | removed | eliminated |
| Faker in runtime bundle | yes | no | eliminated |
| Modules transformed | 3860 | 3544 | −316 |

---

### Biggest qualitative wins

Pages other than `/dashboard` no longer parse:

- Recharts
- dashboard code
- unrelated route code

Production builds no longer load:

- MSW
- faker
- runtime fixture generation

Mock data generation moved from browser runtime → build step.

---

### Changes shipped

#### Bundle optimization

- Added `React.lazy` for all routes
- Added `Suspense` boundaries
- Lazy-loaded dashboard charts
- Split dashboard chart code from page code
- Added minimal `manualChunks`
- Moved runtime `navItems` out of shared types

#### Runtime optimization

- Added `VITE_ENABLE_MSW`
- Introduced separate:

```txt
npm run build
npm run build:demo
```

- Gated MSW startup behind env variable
- Removed unconditional worker bootstrap
- Replaced runtime faker generation with pre-generated JSON fixtures
- Added build-time fixture generation script
- Updated Vercel demo build flow
- Deleted `mockData.ts`

---

### Bundle evolution

Before:

```txt
index.js
336 KB gz

browser.js (MSW + faker)
243 KB gz

Total critical path:
~580 KB gz
```

After (production build):

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

After (`build:demo`):

```txt
index.js
41 KB gz

browser.js
88 KB gz

Critical path:
~129 KB gz
```

---

### Verification

Confirmed:

✓ `npm run build` excludes MSW entirely  
✓ `npm run build:demo` keeps mocks functional  
✓ `npm run preview` works  
✓ Vercel demo still works  
✓ No runtime faker imports remain  
✓ No static MSW imports remain in app bootstrap

---

### Remaining optimization targets

Out of scope for Day 9:

- transaction virtualization
- memoization
- expensive filters
- React Query cache strategy
- rerender optimization
- React 19 hooks adoption

These become the next performance milestone.

---

### Outcome

Day 9 reduced bundle and runtime overhead enough that future bottlenecks are expected to come primarily from rendering and data processing rather than application startup.
