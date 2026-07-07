# GMS Engineering Todo Backlog

This is a concise, append-only backlog.  
Each item includes: ticker, title, short summary, and likely relevant code locations.

## Security

- [X] **SEC-001 — Remove frontend auth backdoor**
  - Short summary: Login flow appears to allow a hardcoded credential shortcut that can bypass normal Supabase authentication. Replace with environment-gated dev-only behavior or remove entirely.
  - Relevant code: `apps/web/src/contexts/AuthContext.tsx`, `apps/web/src/components/pages/LoginPage.tsx`
- [X] **SEC-002 — Stop storing/exposing plaintext staff demo passwords**
  - Short summary: Staff-related API and mapping logic appears to persist and return sensitive password-like values. Remove persistence/response exposure and migrate existing data safely.
  - Relevant code: `apps/api/src/routes/staff.ts`, `apps/api/src/db/schema.ts`
- [X] **SEC-003 — Harden file uploads**
  - Short summary: Upload handlers need strict validation (size, MIME/type allowlist, filename/path sanitization, and storage policy) to reduce DoS and malicious content risks.
  - Relevant code: `apps/api/src/routes/donors.ts`, `apps/api/src/routes/financials.ts`, `apps/api/src/routes/implementingPartners.ts`, `apps/api/src/routes/institutionalDonors.ts`, `apps/api/src/index.ts`
- [X] **SEC-004 — Enforce module RBAC on all backend routes**
  - Short summary: Apply `requirePermission(module, 'read')` on GET handlers and `requirePermission(module, 'write')` on POST/PATCH/DELETE across all business route files (including `bousala.ts`).
  - Relevant code: `apps/api/src/routes/donors.ts`, `apps/api/src/routes/projects.ts`, `apps/api/src/routes/financials.ts`, `apps/api/src/routes/beneficiaries.ts`, `apps/api/src/routes/bousala.ts`, `apps/api/src/routes/stakeholders.ts`, `apps/api/src/routes/implementingPartners.ts`, `apps/api/src/routes/institutionalDonors.ts`
- [X] **SEC-005 — Reduce internal error disclosure in API responses**
  - Short summary: Global error responses should avoid returning raw internal exception details to clients; keep detailed info in server logs only. Consider a safe client-facing error class for intentional messages.
  - Relevant code: `apps/api/src/index.ts`
- [ ] **SEC-006 — Secure static file serving for uploads**
  - Short summary: `/uploads/*` should not be publicly readable; require auth (or signed URLs / proxied download) and verify the linked document's `org_id` matches the requester's org before serving.
  - Relevant code: `apps/api/src/index.ts`, `apps/api/src/routes/donors.ts`, `apps/api/src/routes/financials.ts`, `apps/api/src/db/schema.ts`

## Reliability

- [ ] **REL-001 — Make multi-step writes/deletes transactional**
  - Short summary: Complex flows touching multiple rows/files should be wrapped in transactions (and compensating cleanup where needed) to avoid partial failure states.
  - Relevant code: `apps/api/src/routes/donors.ts`, `apps/api/src/routes/financials.ts`, `apps/api/src/routes/implementingPartners.ts`, `apps/api/src/routes/institutionalDonors.ts`, `apps/api/src/lib/deleteOrgData.ts`
- [X] **REL-002 — Handle non-JSON/empty successful API responses**
  - Short summary: Shared frontend API client should safely handle `204` and empty-body success responses instead of always calling `res.json()`.
  - Relevant code: `apps/web/src/lib/api.ts`
- [X] **REL-003 — Standardize auth-gating for frontend queries**
  - Short summary: Apply consistent `enabled: !authLoading && !!user` (or session-token check) across all hooks in `apps/web/src/hooks/` to prevent unauthorized API calls.
  - Relevant code: `apps/web/src/hooks/useDonors.ts`, `apps/web/src/hooks/useFinancialOverview.ts`, `apps/web/src/hooks/useProjects.ts`, `apps/web/src/hooks/`
- [ ] **REL-004 — Tighten date/input validation contracts**
  - Short summary: Shared schemas should validate date-like fields more strictly to avoid invalid runtime coercion and inconsistent API behavior.
  - Relevant code: `packages/shared/src/schemas/donor.ts`, `packages/shared/src/schemas/financials.ts`, `apps/api/src/routes/donors.ts`, `apps/api/src/routes/financials.ts`
- [ ] **REL-005 — Add database indexes on hot query columns**
  - Short summary: Add Drizzle migration with indexes on `org_id` (domain tables), `memberships(user_id, org_id)`, common FK columns (`donor_id`, `project_id`), and `financial_transactions.status`.
  - Relevant code: `apps/api/src/db/schema.ts`, `apps/api/src/db/migrations/`
- [ ] **REL-006 — Convert text FK fields to UUID references**
  - Short summary: Migrate `donor_id`, `project_id`, and `beneficiary_id` in financial tables from `text` to `uuid` with proper `.references()` and `onDelete` rules matching app delete behavior.
  - Relevant code: `apps/api/src/db/schema.ts`, `apps/api/src/db/migrations/`, `apps/api/src/routes/financials.ts`
- [ ] **REL-007 — Standardize route-level error handling**
  - Short summary: Add reusable try/catch wrapper or middleware for route handlers; map Drizzle/Postgres errors to 409 (constraints) and 404 (not found) instead of generic 500s.
  - Relevant code: `apps/api/src/middleware/`, `apps/api/src/routes/`
- [X] **REL-008 — Fix Bousala validation to use safeParse**
  - Short summary: Replace `.parse()` with `.safeParse()` in Bousala routes and return 400 with validation issues on failure, matching donors/projects/financials pattern.
  - Relevant code: `apps/api/src/routes/bousala.ts`, `packages/shared/src/schemas/bousala.ts`
- [X] **REL-009 — Handle invalid JSON request bodies**
  - Short summary: Catch `c.req.json()` parse failures and return 400 with a clear message instead of an unhandled 500.
  - Relevant code: `apps/api/src/index.ts`, `apps/api/src/middleware/`
- [ ] **REL-010 — Add 401 handling with token refresh in API client**
  - Short summary: On 401, attempt Supabase token refresh and retry the request; if refresh fails, clear auth state and redirect to login via `AuthContext`.
  - Relevant code: `apps/web/src/lib/api.ts`, `apps/web/src/contexts/AuthContext.tsx`

## Frontend

- [ ] **FE-001 — Wire orphaned financial tabs**
  - Short summary: Register and render `BudgetsTab`, `GrantsFundsTab`, `PledgesTab`, `DonationsTab`, and `ReportsTab` in `FinancialsPage`; add any missing i18n keys.
  - Relevant code: `apps/web/src/components/pages/FinancialsPage.tsx`, `apps/web/public/locales/en/financials.json`, `apps/web/public/locales/ar/financials.json`
- [ ] **FE-002 — Replace MOCK_PROJECTS with real API data**
  - Short summary: Remove `MOCK_PROJECTS` / `BENEFICIARY_MOCK_PROJECTS` usage and wire `useProjects()` in Bousala, institutional donors, and beneficiaries modules.
  - Relevant code: `apps/web/src/App.tsx`, `apps/web/src/components/pages/donors_institutional/GrantsTab.tsx`, `apps/web/src/components/pages/donors_institutional/PartnershipOpportunitiesTab.tsx`, `apps/web/src/components/pages/beneficiaries/BeneficiariesModule.tsx`
- [ ] **FE-003 — Replace implementing partners mock data**
  - Short summary: Wire `DocumentsTab`, `PerformanceTab`, and `ProjectsTab` to real hooks (`usePartnerDocuments`, `usePartnerEvaluations`, `useProjects`); remove `partnerStaticData.ts` once unused.
  - Relevant code: `apps/web/src/components/pages/implementing_partners/tabs/DocumentsTab.tsx`, `apps/web/src/components/pages/implementing_partners/tabs/PerformanceTab.tsx`, `apps/web/src/components/pages/implementing_partners/tabs/ProjectsTab.tsx`, `apps/web/src/components/pages/implementing_partners/partnerStaticData.ts`

## Access & Product Behavior

- [ ] **ACC-001 — Fix unauthorized dashboard fallback behavior**
  - Short summary: Module route guard can render dashboard in cases where user should be redirected; align fallback behavior with strict accessibility checks.
  - Relevant code: `apps/web/src/hooks/useModuleRouteGuard.ts`, `apps/web/src/moduleRegistry.tsx`, `apps/web/src/App.tsx`
- [ ] **ACC-002 — Align module catalog defaults with shared module keys**
  - Short summary: Ensure seeded/default org modules stay in sync with canonical shared module and RBAC definitions (including `compliance`).
  - Relevant code: `packages/shared/src/constants/modules.ts`, `packages/shared/src/constants/rbac.ts`, `apps/api/src/lib/orgModules.ts`

## Localization & UX Quality

- [ ] **L10N-001 — Replace hardcoded UI strings with i18n keys**
  - Short summary: Remaining hardcoded user-facing strings should use translation keys for Arabic/English parity.
  - Relevant code: `apps/web/src/components/pages/LoginPage.tsx`, `apps/web/src/components/layout/Header.tsx`, `apps/web/src/components/layout/Sidebar.tsx`, `apps/web/src/main.tsx`
- [ ] **L10N-002 — Audit RTL-sensitive utility usage**
  - Short summary: Directional spacing/alignment utilities should be reviewed for Arabic RTL correctness.
  - Relevant code: `apps/web/src/components/layout/Header.tsx`, `apps/web/src/components/layout/BottomNavBar.tsx`

## DevOps & Tooling

- [ ] **OPS-001 — Unify API container Node runtime baseline**
  - Short summary: Align Node versions across API Dockerfiles to reduce environment drift and deployment surprises.
  - Relevant code: `Dockerfile.api`, `apps/api/Dockerfile`
- [ ] **OPS-002 — Fix shared package export path drift**
  - Short summary: Shared package exports should only expose real subpaths to prevent consumer import failures.
  - Relevant code: `packages/shared/package.json`, `packages/shared/src/index.ts`

## Code Quality

- [ ] **CQ-001 — Remove legacy role state from App.tsx**
  - Short summary: Drop local `role`/`setRole` state and the `role` prop passed to layout components; rely on `OrgContext` as the single source of truth.
  - Relevant code: `apps/web/src/App.tsx`, `apps/web/src/components/layout/Sidebar.tsx`, `apps/web/src/components/layout/Header.tsx`, `apps/web/src/components/layout/MobileSidebar.tsx`
- [ ] **CQ-002 — Standardize mutation error recovery pattern**
  - Short summary: Add consistent `onSettled` cache-invalidation to all mutation hooks, matching the pattern in `useDonors.ts`.
  - Relevant code: `apps/web/src/hooks/useProjects.ts`, `apps/web/src/hooks/`
- [ ] **CQ-003 — Move Contact type out of component file**
  - Short summary: Relocate `Contact` type from `ContactsTab.tsx` to shared types or `packages/shared` schemas; update imports in `contactOptimistic.ts` and the tab component.
  - Relevant code: `apps/web/src/components/pages/donors/ContactsTab.tsx`, `apps/web/src/lib/contactOptimistic.ts`, `apps/web/src/types.ts`, `packages/shared/src/schemas/`
- [ ] **CQ-004 — Document and clarify demo user behavior**
  - Short summary: Document demo-mode credentials and bypass behavior in `CLAUDE.md`; consider an `isDemoMode` flag in `OrgContext` and a default viewer role for navigation.
  - Relevant code: `CLAUDE.md`, `apps/web/src/contexts/AuthContext.tsx`, `apps/web/src/contexts/OrgContext.tsx`

