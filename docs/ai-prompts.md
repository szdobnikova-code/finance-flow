# AI-Assisted Development

This project was built with Claude (via Claude Code) as the primary AI assistant. This document is a curated reference of the prompting patterns that produced the strongest results — not a chronological log, but a selection of decisions where AI collaboration meaningfully shaped the outcome.

Each entry shows the prompt I used, the measurable outcome, and the lesson I took away. The goal is to document a working AI workflow, not to demonstrate volume.

---

## 1. Architectural decision — choosing between two routers

**Context:** Picking React Router vs TanStack Router at the start of the project. Both are reasonable choices in the abstract; the question was which fit *this* project.

**Prompt:**

```
I'm building a Personal Finance Dashboard as a frontend-heavy React application.

Stack:
- React 19 + TypeScript
- Vite, TanStack Query, Tailwind + shadcn/ui
- MSW (mock backend)
- Data-heavy UI (10k+ items, filtering, charts)

Project goals:
- Strong performance story (Lighthouse metrics, virtualization, memoization)
- Clean, production-like architecture (Senior-level, not overengineered)
- 2–3 weeks total build time
- Portfolio-quality code, not a reusable library

Compare React Router vs TanStack Router for THIS project (not in general).

Focus on:
1. Developer experience in a small-to-medium SPA
2. Type safety — does it actually add value here?
3. Integration with TanStack Query — real synergy or marketing?
4. Boilerplate / cognitive overhead
5. Performance implications (realistically)
6. Learning curve vs ROI for a portfolio project
7. Risk of overengineering

Then:
- Give a clear recommendation (pick ONE)
- Explain WHY the other option is worse in THIS context
- Mention what would change your recommendation (edge cases)

Avoid generic statements like "both are good" — I want a decisive answer with trade-offs.
```

**Outcome:** Claude recommended React Router v7. Key reasoning: TanStack Router's headline features (typed search params, typed loaders) scale with route count and URL-state complexity — with 4 routes and filters living in TanStack Query keys, the setup cost buys guarantees the project doesn't need. The router preloading story is also rounding error next to the actual performance wins (virtualization, lazy chart loading).

The response also listed three concrete conditions that would flip the recommendation: 20+ routes, filters lifted to URL as source of truth, or SSR in scope. None applied.

**Lesson:** Forcing a decisive answer with explicit trade-offs produces a more useful response than asking "which is better". Listing the conditions that would flip the recommendation is what made this prompt useful months later when scope questions came up — I had a documented threshold to check against.

---

## 2. Complex refactor with measured impact — eliminating MSW + faker from production

**Context:** MSW and faker were bundled into the main runtime, inflating production bundle size. Needed to keep MSW working on the live demo (Vercel) while removing it entirely from a real production build, and replace runtime faker with build-time fixtures.

**Prompt:**

```
Refactor MSW and faker out of the production runtime bundle.

Context:
- Vite + React + TS project. MSW is the only "backend" — the Vercel demo needs it.
- MSW + faker are bundled into the main app, inflating it.
- Goal: keep MSW working on the demo, but (1) load it as a separate async chunk that
  doesn't block initial render, and (2) eliminate faker from the runtime bundle by
  pre-generating fixtures at build time.

Tasks:

1. Gate MSW behind an env var (not import.meta.env.MODE):
   - Add VITE_ENABLE_MSW to .env.development and .env.example.
   - In src/main.tsx, wrap MSW startup in an async function that:
     - Returns early if import.meta.env.VITE_ENABLE_MSW !== 'true'
     - Uses dynamic import: const { worker } = await import('./msw/browser')
     - Only renders the React app after the promise resolves
   - Verify no top-level static imports of './msw/*' remain in src/ (grep).

2. Add a build script for production-equivalent bundle without MSW:
   - "build": "vite build" (no MSW)
   - "build:demo": "VITE_ENABLE_MSW=true vite build" (for Vercel)
   - Update vercel.json to use build:demo.

3. Pre-generate fixtures at build time to eliminate faker from runtime:
   - Create scripts/generate-fixtures.ts that uses @faker-js/faker to generate
     10,000 transactions, categories, and budgets matching src/types/.
   - Write to public/fixtures/*.json.
   - Add prebuild script: "prebuild": "tsx scripts/generate-fixtures.ts"
   - Update MSW handlers to fetch /fixtures/*.json instead of calling faker.
   - Move @faker-js/faker to devDependencies.
   - Verify faker is no longer imported under src/ (grep).

4. Verification:
   - npm run build → dist/ contains no MSW or faker code (check with rollup-plugin-visualizer).
   - npm run build:demo → MSW is in a separate async chunk, not the main entry.
   - npm run dev still works with mocked data.
   - npm run preview after build:demo still works.

Don't touch:
- Handler logic (only change data source from faker → JSON fetch).
- Component code, test files.

Output a summary at the end with bundle size before/after for both build and build:demo.
```

**Outcome:**

| Metric | Before | After |
|---|---|---|
| Sync-parsed entry JS (gz) | 336.25 KB | 41.29 KB (**−87.7%**) |
| First-visit `/budgets` or `/categories` (gz) | 579.67 KB | ~199.7 KB (**−65.5%**) |
| Demo MSW chunk (gz) | 243.42 KB | 88.46 KB (**−63.7%**) |
| Production MSW chunk | present | removed |
| Modules transformed | 3,860 | 3,544 |

Production build no longer ships MSW or faker. Demo build defers MSW to an async chunk that loads after first paint instead of blocking it.

**Lesson:** Verification steps inside the prompt (the `grep` checks, the bundle visualizer check) caught real issues during execution. Without them, Claude would have stopped at "code compiles" and missed that handlers needed to become `async`. Asking for measured before/after numbers in the prompt also forced an explicit verification pass instead of "I think this is better."

---

## 3. Self-correction — fixing a methodology mistake

**Context:** When generating "after" Lighthouse measurements, I initially used `npm run build` instead of `npm run build:demo`. Claude faithfully executed that — but the standard production build doesn't include MSW, so it served an empty page. The captured metrics were meaningless. This is the corrected version that explicitly forbade the wrong build.

**Prompt (corrected version):**

```
Capture post-optimization Lighthouse metrics and create a comparison document.

CRITICAL: This project has a separate demo build with MSW for realistic mock data.
All Lighthouse measurements MUST be against the demo build, NOT the standard
production build (which has no mock data and shows empty/broken state).

Build commands (use these, not `npm run build`):
- Build: npm run build:demo
- Preview: npm run preview (serves on http://localhost:4173)

The script "build:demo" is already defined as:
"build:demo": "VITE_ENABLE_MSW=true npm run build"

1. Lighthouse run script

Create scripts/run-lighthouse-after.sh that:
- Builds the DEMO app: npm run build:demo — NOT npm run build
- Serves it with vite preview
- Waits for server ready (curl check until 200)
- Runs Lighthouse against /dashboard, /transactions, /budgets
- Saves JSON to docs/performance-after/
- Uses --preset=desktop and mobile separately (6 reports total)
- Each route 3 times for median (--n=3)

The script should include a comment at top:
# IMPORTANT: This script measures against demo build (with MSW).
# Standard production build does not include MSW and will produce
# invalid measurements (empty page, no data).

2. Comparison document

Add at top of performance-comparison.md a "Methodology" section explaining
demo build is used, MSW provides 10k transactions, 3 runs per route, median
reported. Then before/after table per route per metric.

Constraints:
- All commands must explicitly reference demo build, never standard build.
```

**Outcome:** Correct measurements captured. Final results (median of 3, desktop):

| Route | Performance | LCP | TBT |
|---|---|---|---|
| /dashboard | 54 → **99** | 10,200ms → **669ms** (−93.4%) | 90 → 95 ms |
| /transactions | 54 → **99** | 10,200ms → **796ms** (−92.2%) | 120 → **0 ms** |
| /budgets | n/a → **100** | n/a → 660 ms | n/a → 0 ms |

**Lesson:** Project-specific conventions (here: that `build:demo` exists separately from `build`) need to be stated explicitly and repeatedly in the prompt. Claude isn't going to infer "this project has a demo build" from the file tree on its own — and the cost of letting it default to `npm run build` was throwing away a full Lighthouse run. Now I lead with `CRITICAL:` notes for any project-specific tooling that diverges from standard conventions.

---

## 4. CI/CD setup — Lighthouse CI with calibrated thresholds

**Context:** Setting up automated Lighthouse runs on every PR, with budgets that catch regressions without being so tight they fail constantly on GitHub's shared runners.

**Prompt:**

```
Set up automated Lighthouse CI on GitHub Actions with performance budgets
and PR comments.

CRITICAL: CI must build and serve the DEMO version (with MSW). Standard
production build serves empty page.

Files to create:
- .github/workflows/lighthouse-ci.yml
- .lighthouserc.json
- README.md (performance badge section)

1. Workflow:
- Triggers on pull_request and push to main
- Node 20, cache npm
- Build: npm run build:demo (NOT npm run build) — add a comment in the
  YAML explaining why
- Serve, wait for ready
- @lhci/cli autorun against /dashboard, /transactions, /budgets
- Post results as PR comment via temporary-public-storage

2. .lighthouserc.json with assertions:
- categories:performance >= 0.9 (error)
- LCP <= 2000ms (error)
- INP <= 200ms (error)
- CLS <= 0.1 (error)
- TBT <= 300ms (warn)
- uses-text-compression, render-blocking-resources (warn)

Adjust thresholds based on Day 12 measurements. Don't set tighter than
current performance — that creates failing CI from day one.

3. README section: badge, current scores, link to comparison doc,
methodology note.

Constraints:
- All workflow build commands use build:demo, never build.
- temporary-public-storage upload (works on PR from forks, no secrets).
```

**Outcome:** Workflow live, PR comments working, methodology documented. First run failed on GitHub's runner because real-world CI thresholds proved stricter than expected — shared runner CPU produced Performance score 0.73 vs 99 locally. I tuned the assertions in a follow-up commit:

- `categories:performance` 0.9 → 0.85
- `largest-contentful-paint` 2000 → 4000
- `total-blocking-time` 300 → 600 (warn)
- `interaction-to-next-paint` audit disabled (Lighthouse static run doesn't measure INP)

The commit message documented the rationale: *"CI assertions catch regressions, not absolute performance numbers. Local Lighthouse measurements reflect real user conditions; GitHub runner CPU does not."*

**Lesson:** "Don't set tighter than current performance" was the right instinct in the prompt, but Claude calibrated to *local* measurements, not CI runner measurements. The first failing CI run was the missing feedback loop. Next time I'd ask Claude to either run a probe job first to capture CI-specific baseline, or explicitly use looser starting thresholds with a "tighten later" note. Calibration to the actual measurement environment matters more than the absolute number.

---

## 5. Structured feature work — data layer optimization

**Context:** Day 11 of the plan: configure TanStack Query defaults, add cursor-based pagination, fix selective invalidation, ensure optimistic updates work with the new infinite-query shape. Four related concerns in one prompt, each with constraints.

**Prompt:**

```
Optimize TanStack Query data layer for the transactions feature.

Files (likely to touch):
- src/api/queryKeys.ts
- src/features/transactions/hooks/useTransactions.ts
- src/features/transactions/hooks/useCreateTransaction.ts
- src/features/transactions/hooks/useUpdateTransaction.ts
- src/features/transactions/hooks/useDeleteTransaction.ts
- src/main.tsx (QueryClient config)
- src/api/msw/handlers.ts (if pagination needed)

1. QueryClient defaults in src/main.tsx:
- staleTime: 30_000 (30s — data feels fresh, no refetch on remount)
- gcTime: 5 * 60_000 (5min — keep unmounted cache briefly)
- refetchOnWindowFocus: true (only if stale)
- refetchOnReconnect: true
- retry: 1

Document the rationale in a comment.

2. Pagination — cursor-based via useInfiniteQuery:
- MSW handler accepts cursor and limit query params
- Returns { data, nextCursor } shape
- useTransactions → useInfiniteTransactions
- Initial load: 50 items per page
- TanStack Virtual already installed for the rendered list

3. Selective invalidation:
- After create/update/delete transaction → invalidate transactions list
  AND budgets (because Budget.spent derives from transactions), NOT categories

4. Optimistic updates with InfiniteQuery shape:
- setQueriesData callbacks must mutate the pages array correctly
- Snapshot for rollback uses the full InfiniteData shape

Constraints:
- Don't change UI layout
- No new dependencies
- Strict TypeScript (no any)
```

**Outcome:** Cursor-based pagination shipped via new `useInfiniteTransactions`, with `transactions.infinite` and `transactions.infiniteList(filters)` added to `queryKeys` so the paginated cache stayed separate from the dashboard's flat-list query. Mutations now also invalidate `budgets.all`. Settled values: `staleTime: 30s`, `refetchOnWindowFocus: true` — framed in the commit message as "fast enough that another tab's mutation shows up promptly, slow enough that remounting a component does not trigger a refetch."

Claude also caught and fixed a real pre-existing bug while in the file: `useUpdate*` hooks were using `filter` instead of `map` in the optimistic update, effectively removing the row from cache on edit. The budget hook was also targeting the wrong query key (`transactions.all` instead of `budgets.all`).

Downstream impact (visible in Day 12 Lighthouse): TBT on `/transactions` 120ms → 0ms, mostly from pagination cutting on-mount work.

**Lesson:** Structuring a complex change as numbered sections with explicit "files likely to touch" gave Claude enough scaffolding to not lose the thread mid-task. The bug fix in `useUpdate*` was a bonus — when Claude is already in the file with full context, it surfaces adjacent issues. Worth scoping prompts to a feature area rather than splitting them into many small ones, when the work is genuinely related.

---

## Other patterns used (not detailed here)

- **Polish & UX review (Day 7):** comprehensive responsive audit with explicit "don't redesign, don't rewrite working features" constraints. Useful pattern: list what changes are allowed before listing what to fix.
- **Targeted tests:** instructed Claude to skip shadcn primitives, library code, snapshot tests, and "renders without crashing" — focused on critical paths (optimistic mutation rollback, filter URL round-trip, progress bar color thresholds). Resulted in 21 focused tests, not coverage padding.
- **Bundle visualization setup (Day 9):** wiring `rollup-plugin-visualizer` plus manual chunks for `react-vendor` and `recharts`, with the prompt asking for before/after measurements built in.

## What I learned about working with Claude on this project

1. **Decisive prompts beat exploratory ones.** "Compare X and Y, pick one, justify why the other is worse" outperformed "what should I use?" every time.
2. **Verification steps belong in the prompt.** Asking Claude to `grep` for what should be absent, or to capture before/after numbers, catches the difference between "code compiles" and "the change actually worked."
3. **Project-specific conventions must be explicit.** Claude won't infer `build:demo` from filenames. A `CRITICAL:` line stating the convention saved a full Lighthouse run from being thrown away after I learned this the hard way.
4. **Claude surfaces adjacent bugs.** Scoping prompts to a feature area (not a single file) means real issues in related code get caught. The `useUpdate*` filter-vs-map bug was found this way, not by my own review.
5. **Calibrate thresholds to the measurement environment.** Local performance and CI performance are different problems. The first failing Lighthouse CI run was the missing feedback loop — now I plan for a probe pass before locking budgets.

The collaboration pattern that worked best: I owned the *what* and the *why*; Claude owned the *how* and the verification. When I reversed that — let Claude choose the strategy, then evaluated the output — results were less useful.
