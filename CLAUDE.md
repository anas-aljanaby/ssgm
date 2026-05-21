# GMS — Global Management System for Non-Profits

## What is this

An ERP system for non-profit organizations (awqaf, charitable foundations) in the Gulf region. Bilingual Arabic/English, RTL-first. The product's strategic differentiator is **Bousala** — a strategic compass that maps organizational goals → KPIs → projects → impact. The rest of the system (donors, financials, beneficiaries, projects) feeds data into Bousala.

This is an **MVP**. The goal is to ship a polished initial version with enough depth in each module that it feels like a real product, not a skeleton CRUD app. Quality and UX polish in existing modules over breadth of half-baked modules.

## Target users

- Large non-profit orgs, awqaf, and charitable foundations in the Gulf (KSA, UAE primarily).
- End users: program managers, finance staff, donor relations officers, executive leadership.
- Admins who configure the system for their org.

## Tech stack

- **Monorepo**: npm workspaces (`apps/web`, `apps/api`, `packages/shared`)
- **Frontend**: React 19 + Vite + TypeScript, TailwindCSS, TanStack Query, i18next, Recharts, Framer Motion
- **Backend**: Hono (Node.js) + TypeScript
- **Database**: PostgreSQL via Drizzle ORM
- **Auth & Storage**: Supabase (Auth, Storage, RLS)
- **AI**: Google Gemini API (server-side only, never in browser bundle)
- **Shared**: Zod schemas + derived types in `packages/shared`
- **Deployment**: Vite static build on Vercel (frontend), Node on Render (backend), Supabase managed DB

## Demo credentials

For local development and testing:
- **Email**: anas.aljanaby00@gmail.com
- **Password**: ChangeMe123!

## Dev commands

```
npm run dev:web          # Vite dev server (frontend)
npm run dev:api          # tsx watch (backend)
npm run build:web        # Production build
npm run db:push          # Push Drizzle schema to DB (in apps/api)
npm run db:generate      # Generate Drizzle migrations (in apps/api)
npm run db:studio        # Open Drizzle Studio (in apps/api)
npm run seed             # Seed database (in apps/api)
npm run seed:reset       # Reset + reseed (in apps/api)
```

## Architecture principles

### Multi-tenancy
- Shared database, shared schema. Every domain table has `org_id`.
- Row-Level Security (RLS) enforces tenant isolation.
- **Every query must be scoped by org_id. Every new table needs `org_id` + `custom_fields jsonb`.**

### Bilingual / RTL
- Every user-facing string must exist in both Arabic and English.
- Translation files are in `apps/web/public/locales/{ar,en}/`.
- RTL layout is not optional — it must work correctly for Arabic.
- Use i18next `t()` for all UI text. Never hardcode user-facing strings.

### Module system
- Sidebar is data-driven from the API, not hardcoded.
- Dashboard widgets are registered, not hardcoded.
- Every entity gets a `custom_fields jsonb` column for future extensibility.
- Each module follows the pattern: `config.json`, `permissions.json`, `routes.json`.

### Data layer
- The canonical backend is Hono + Drizzle. All new work targets this stack.
- **Any page or hook not using the Hono API is legacy code** (uses mock data or localStorage). Do not use legacy patterns as reference for new work. Derive style and patterns only from code that uses TanStack Query + Hono API routes.
- Schema lives in `apps/api/src/db/schema.ts`. Shared Zod schemas live in `packages/shared`.

### AI
- All Gemini API calls are server-side (Hono routes under `apps/api/src/routes/ai.ts`).
- API keys never touch the browser.

## Business logic guidance

When making business decisions (field names, workflows, status flows, categorizations, report structures):
- Evaluate against **industry standards** for non-profit management.
- Reference how **market leaders** handle it (Salesforce Nonprofit Cloud, Bloomerang, Blackbaud, DonorPerfect).
- Apply **reason** — if the standard approach is overcomplicated for an MVP, simplify, but explain the tradeoff.
- Consider the **Gulf non-profit context**: Islamic finance concepts (zakat, waqf, sadaqah), bilingual requirements, local compliance.

## What NOT to do

- Don't add modules or features beyond what's asked. This is an MVP.
- Don't build abstractions for hypothetical future use cases.
- Don't migrate inactive/placeholder pages unless asked.
- No custom auth (Supabase Auth only), no GraphQL, no microservices.
- No test suite exists yet — don't try to run tests.
- **Desktop only.** Do not add mobile responsiveness, mobile layouts, or touch optimizations. If legacy mobile code exists, ignore it.
