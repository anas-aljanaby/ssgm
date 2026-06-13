# Page Activation Prompt (Stage 3 of 3 — design → build → ACTIVATE)

> **What you (the human) do here:** The agent wires page **X**'s static frontend to a real backend — DB table, Zod schema, Hono routes, TanStack hooks — replacing mock data with persisted data. **Confirm create / edit / delete persist across a refresh, then scan for any still-static component — each one must appear in the agent's "Deferred Activation Register" with a reason and a next step; if it's static and not listed, activation isn't done.** Otherwise this stage is mechanical: you're verifying data flows, not re-judging design.

---

## What this stage is

You take a page that is already a complete, interactive **static** frontend (built in Stage 2 from `PAGE_SPECS/<page>.md`) and give it real persistence. You do **not** redesign anything, change the structure, or touch the visual design. The frontend's mock-data shapes were deliberately built to match what the backend should return — your job is to make that real and swap the mock for live hooks with minimal frontend change.

If the page still has structural problems or bad UX, stop — that's a DESIGN/BUILD problem, not an activation problem. Don't paper over it with backend work.

## Context

Bilingual (Arabic/English) non-profit ERP. Frontend: React 19 + TanStack Query + i18next. Backend: Hono + Drizzle + Postgres. Shared Zod schemas in `packages/shared`. API client: `apps/web/src/lib/api.ts` (`get/post/patch/delete`). Auth: Supabase, token on the `api` client.

## Reference implementations (the gold standard — copy these)

- **Donor module:** hook `apps/web/src/hooks/useDonors.ts`; route `apps/api/src/routes/donors.ts`; schema entries `individual_donors`, `donations`, `donor_tasks`, `donor_interactions`, `donor_documents` in `apps/api/src/db/schema.ts`; Zod `packages/shared/src/schemas/donor.ts`.
- **Financials module:** hooks `useTransactions.ts`, `useDonations.ts`, etc.; route `apps/api/src/routes/financials.ts`.

Match these exactly for auth middleware, org scoping, JSON shaping, hook structure, and optimistic updates.

---

## Process

### Phase A — Data audit

Before writing backend code, map the page's data. For each component, classify every field:

| Category | Description |
|----------|-------------|
| **Manual Entry** | User types/selects it; stored on this entity. |
| **Computed** | Derived from this entity's own data. |
| **Cross-Module Reference** | Comes from another module's API. |
| **Static/Config** | System constants, enums, category lists. |
| **Unresolvable Dependency** | Depends on a module with no backend yet — cannot activate this pass. |

Then check what already exists: DB table in `schema.ts`? route in `apps/api/src/routes/`? hook in `apps/web/src/hooks/`? Zod schema in `packages/shared/src/schemas/`? Output this as a short table before building.

**The completeness contract — every component on this page ends in exactly one of two states. There is no third "static with no explanation" state, and that is the single most important rule of this stage:**

- **(A) Activated** — you MUST wire it to real data. Two kinds of component fall here:
  - **Own-entity fields** (**Manual Entry** or **Computed**) — persist to this page's DB table; if user-editable, they are actually editable in the UI (edit toggle / modal / inline) and the change survives a refresh.
  - **Cross-module references whose source module is already built** — wire them (read-only) to that module's existing API/hook. **A dependency on another page does NOT automatically mean defer.** Before deferring any cross-module reference, check whether the referenced module already has a live table/route/hook. If it does, activating it *is your job this pass* — pull the real data; do not leave it on mock.

  A Manual-Entry field that renders but can't be edited and saved, or a cross-module field whose source already exists but is still showing mock data, is a **failure of this stage**.

- **(B) Deferred** — only when the dependency **genuinely does not exist yet**: a cross-module reference whose source module has no backend, or an **Unresolvable Dependency**. Keep its mock value, mark it in code with `// DEFERRED: needs <X> — see Deferred Activation Register`, and record it in the register below. Do **not** wire a form to a nonexistent endpoint. **Surface it visually with a clear "Coming soon" tag** (translated via `t()`, both `ar`/`en`) on the component — prominent enough that the human immediately sees the component isn't live, but placed so the component itself **stays fully visible and reviewable underneath** (a badge/ribbon or banner, not a blanking overlay or a replaced placeholder box). The human must still be able to see and approve the UI it will eventually have.

**Decision rule for every "relies on another page" component:** is that other page's data layer ready (table + route + hook exist)? **Yes → bucket A, wire it now. No → bucket B, defer and register it.** Don't defer out of convenience, and don't fabricate an endpoint to force activation.

You may not leave a component static "because you didn't get to it." If it's bucket A, finish it. If it's bucket B, register it. Silence is not allowed.

**Deferred Activation Register.** For every bucket-B component, record a row: **what it shows · why it's blocked · which page/module should own the data · what concretely must be built there to activate it** (e.g. a table + route, or just a new field on an existing entity). This is the actionable handoff that turns a dead static panel into a tracked next step — it tells the human exactly where to go and what to do to light it up later.

### Phase B — Database schema

If the page's primary entity has no table, add one to `apps/api/src/db/schema.ts`:
- **Every table MUST have `org_id`** (FK to `organizations.id`) **and `custom_fields jsonb` defaulting to `{}`** — no exceptions.
- `created_at timestamp` default `now()`; `uuid` PKs with `defaultRandom()`.
- Bilingual text as `name_en` + `name_ar`. Money as `numeric(12,2)` / `numeric(14,2)`.
- Apply with `npm run db:push` from `apps/api/`.

### Phase C — Shared Zod schemas

Add create/update schemas in `packages/shared/src/schemas/`, export from `packages/shared/src/index.ts`:

```typescript
export const createXSchema = z.object({ name_en: z.string().min(1), name_ar: z.string().optional().default('') /* ... */ });
export const updateXSchema = createXSchema.partial();
```

### Phase D — API routes

Create/extend a route in `apps/api/src/routes/`, modeled on `donors.ts`: `authMiddleware`, derive `org_id` from membership, scope **every** query with `eq(table.org_id, orgId)`, validate bodies with the shared Zod schemas, return clean JSON (numeric→number, timestamps→ISO). Endpoints: `GET /`, `GET /:id`, `POST /`, `PATCH /:id`, `DELETE /:id`. Mount the router in the main Hono app.

### Phase E — Hooks + wiring

Create a TanStack Query hook in `apps/web/src/hooks/` modeled on `useDonors.ts` (query + create/update/delete mutations invalidating the query key). Then in the page:
- Replace the mock import/state with the hook: `const { data = [], isLoading } = useX();`
- Wire each modal's `onSubmit` to the matching mutation; close on success.
- Add loading (skeleton/spinner) and empty states; toast on mutation error (`useToast`), error banner on query failure.
- Detail-view save buttons call `updateMutation.mutate()` with a saving state; invalidate on success.

Because BUILD shaped the mock data to match the backend, these should be near drop-in swaps. Keep already-live cross-module references live; don't break them.

---

## Verification

1. **Build:** `npm run build:web` — zero errors.
2. **Frontend:** `npm run dev:web` — page loads, no console errors, both languages and dark mode fine.
3. **Data flow:** `npm run dev:api` — create shows in the list, edit persists, delete removes, and **a page refresh still shows the data** (it's in the DB, not local state).
4. **No-orphan sweep:** walk the rendered page top to bottom. Every component must be either (A) **fed by real data** — editable-and-persisting if it's a user field, or correctly pulling from another module's live API if it's a read-only cross-module reference — or (B) carrying a `// DEFERRED` marker with a matching Deferred Activation Register row. If you find a component on mock data that is neither wired nor deferred — including a cross-module field whose source module *does* exist — it is unfinished. Go back and put it in the right bucket. List the result component-by-component so the human can see nothing was skipped.

## Deliverable

In chat:
- The data audit table.
- **Activated components** — each bucket-A component, confirming it persists and (if editable) is editable in the UI.
- **Deferred Activation Register** — each bucket-B component as: shows · blocked by · target page/module · what to build there to activate it.
- Files changed/created (one line each); new DB tables; new API endpoints.
- Confirmation the build passes, data persists across refresh, and the no-orphan sweep found zero unaccounted static components.

## What the human reviews here (point them at this)

> Run the app, create a record, edit it, delete one, then **refresh the page** — the data should survive. Then scan the page for anything static: **every such component must appear in the Deferred Activation Register with a reason and a next step.** If something is static *and* not in the register, activation isn't done — send it back. The register is also your to-do list for what to build on other pages to light those panels up later. Skim the new DB table for `org_id` + `custom_fields`. Design and UX were already signed off earlier.
