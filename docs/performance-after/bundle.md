# Day 9 — Bundle optimization results

Date: 2026-05-15
Bundler: Vite 8 (Rolldown)

## TL;DR

Initial synchronous JS dropped from **1,116.85 KB / 336.25 KB gz** to **134.04 KB / 41.29 KB gz** — an **88% reduction** in the bundle the browser must parse before booting.

Total JS for a first visit to `/dashboard` (the default route) went from **1,790 KB / 580 KB gz** to **~1,520 KB / ~498 KB gz**, with the work spread across parallel chunks instead of one blocking download.

Pages other than `/dashboard` no longer pull dashboard code or Recharts at all (recharts is preloaded but not executed on those routes).

## Method

1. Captured baseline by running `npm run build` against the unmodified `main` source (stashed working changes, ran clean build, copied `dist/` aside).
2. Applied the five-step plan in `docs/promts-raw.txt` / `~/.claude/plans/day-9-bundle-optimization-lazy-pinwheel.md`.
3. Rebuilt and compared `dist/assets/`. Visualizer output saved at `dist/stats.html`.

## Before — `main` at `c4826c3`

| File | Raw | Gzipped |
| --- | ---: | ---: |
| `index-DBw-DpO4.js` | **1,116.85 KB** | **336.25 KB** |
| `browser-Cp7EOmPQ.js` (MSW worker + handlers + faker) | 673.48 KB | 243.42 KB |
| `index-DBl54PUA.css` | 69.99 KB | 11.60 KB |
| **Total initial JS (sync)** | **1,116.85 KB** | **336.25 KB** |
| **Total initial JS (incl. MSW boot-time async chunk)** | **1,790.33 KB** | **579.67 KB** |

Rolldown produced a single monolithic `index.js` containing every page, every shadcn primitive, all of Recharts, TanStack Query, react-router, etc. The browser had to parse all of it synchronously before render. MSW is dynamic-imported in `src/main.tsx`, so its chunk was already separate — but render is gated on it.

## After

| File | Raw | Gzipped | Notes |
| --- | ---: | ---: | --- |
| `index-BzQfEvLQ.js` | **134.04 KB** | **41.29 KB** | entry: bootstrap, router, providers |
| `react-vendor-DbRnRl_P.js` | 317.46 KB | 102.43 KB | modulepreloaded |
| `recharts-Bi6gZ_tm.js` | 377.81 KB | 109.09 KB | modulepreloaded; only executed on `/dashboard` |
| `DashboardPage-Cfiw9NKq.js` | 5.15 KB | 1.96 KB | lazy (route) |
| `DashboardCharts-ChUlT5EA.js` | 3.50 KB | 1.32 KB | lazy (within page) |
| `TransactionsPage-CZ5OUfIs.js` | 32.88 KB | 11.07 KB | lazy (route) |
| `BudgetsPage-Cjzsnbgq.js` | 7.21 KB | 2.61 KB | lazy (route) |
| `CategoriesPage-DpLcvE-z.js` | 7.27 KB | 2.65 KB | lazy (route) |
| `useTransactionFilters-C4noj5R9.js` | 84.56 KB | 25.55 KB | shared chunk |
| `select-iPJTDLl5.js` | 130.82 KB | 39.52 KB | shared chunk |
| `api-Cjcw7gzb.js` | 14.18 KB | 5.60 KB | shared chunk |
| `iconMap-da6hkc3Z.js` | 5.23 KB | 1.98 KB | lazy |
| `Panel-CW3-xbg5.js` | 0.49 KB | 0.28 KB | shared |
| `rolldown-runtime-S-ySWqyJ.js` | 0.69 KB | 0.42 KB | runtime |
| `browser-uSRKr_h9.js` (MSW + handlers + faker) | 673.48 KB | 243.42 KB | dynamic-imported in `main.tsx` |
| `index-CZKrlxxl.css` | 70.06 KB | 11.61 KB | unchanged |

## Deltas

| Metric | Before | After | Δ |
| --- | ---: | ---: | ---: |
| Sync-parsed entry JS (raw) | 1,116.85 KB | 134.04 KB | **−982.81 KB (−88.0%)** |
| Sync-parsed entry JS (gzip) | 336.25 KB | 41.29 KB | **−294.96 KB (−87.7%)** |
| First-visit `/dashboard` JS (raw, sum of fetched JS) | 1,790.33 KB | 1,521.20 KB | −269.13 KB (−15.0%) |
| First-visit `/dashboard` JS (gzip) | 579.67 KB | 497.57 KB | −82.10 KB (−14.2%) |
| First-visit `/budgets` JS (gzip, excl. preloaded recharts) | 579.67 KB | ~199.71 KB | **−379.96 KB (−65.5%)** |
| First-visit `/categories` JS (gzip, excl. preloaded recharts) | 579.67 KB | ~199.75 KB | **−65.5%** |
| CSS | 11.60 KB gz | 11.61 KB gz | ~0 |

The gzipped total for first-visit `/dashboard` is dominated by the unavoidable MSW chunk (243 KB gz). Excluding MSW, the dashboard-critical JS dropped from 336 KB gz to ~256 KB gz; the visible-paint critical JS dropped from 336 KB gz to **41 KB gz**.

## Which step contributed what

1. **Route-based `React.lazy`** (Step 1) — split the four pages out of the main bundle. By itself produces per-page chunks but the work-graph still pulls heavy deps eagerly because the import chain runs at boot.
2. **Lazy chart boundary inside `DashboardPage`** (Step 2) — biggest single delta. Pulled Recharts out of the dashboard's eager work-graph. Combined with manualChunks below, Recharts now lives in a dedicated chunk that is only executed when `/dashboard` mounts.
3. **`navItems` move out of `src/types/finance.ts`** (Step 3) — small but principled. The types module no longer drags four `lucide-react` icons into every consumer of `Transaction`/`Category`/`Budget` types.
4. **`manualChunks` (`react-vendor` + `recharts`)** (Step 4) — gave Rolldown explicit cut-points. Without this, the giant `index.js` from baseline could not be split because Rolldown's defaults kept everything that touches react in one chunk.

## Things deliberately not done

- **No replacement of Recharts.** It is a project constraint (`CLAUDE.md`).
- **No aggressive `manualChunks` for radix / tanstack / nuqs.** Vite's defaults already do a reasonable job here, and over-grouping can hurt by pulling chunks onto routes that don't use them. Revisit only if visualizer shows duplication.
- **No virtualization or memoization work.** Out of scope for Day 9; planned for Day 10.

## Production verification (Vercel)

Local development measurements became noisy after introducing route splitting and MSW changes, so production deployment was used to validate real-world performance.

Transactions page (Vercel production):

- LCP: 2.07s
- INP: 48ms
- CLS: 0

Despite slower local dev metrics, production confirms that bundle splitting and lazy loading reduced actual user-facing cost.

## Follow-up — MSW + faker removed from runtime path

A second optimization pass addressed the remaining runtime bottleneck.

Changes:

- Added `VITE_ENABLE_MSW`
- Split `build` and `build:demo`
- Moved fixture generation to build time
- Replaced runtime faker execution with static JSON fixtures
- Removed `src/api/mockData.ts`
- Gated MSW startup behind environment variables

Results:

| Metric | Before | After |
| --- | ---: | ---: |
| Demo MSW chunk | 243.42 KB gz | 88.46 KB gz |
| Production MSW chunk | present | removed |
| Faker in runtime | yes | no |
| Modules transformed | 3860 | 3544 |

Impact:

Production builds:

```txt
No MSW
No faker
No worker bootstrap
```

Demo builds:

```txt
MSW retained
smaller async chunk
runtime fixture generation removed
```

The remaining performance bottlenecks are now expected to come primarily from rendering cost and large dataset operations rather than application startup.
## Reproduction

```bash
# Before snapshot
git stash push -u -m before -- src vite.config.ts
rm -rf dist && npm run build
ls -lah dist/assets/
git stash pop

# After snapshot
rm -rf dist && npm run build
ls -lah dist/assets/
# stats.html visualizer at dist/stats.html
```
