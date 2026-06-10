# Page Evaluation & Restructuring Prompt

You are an AI agent tasked with **evaluating** a page in the GMS (Global Management System) codebase and proposing how to restructure it so it becomes coherent, purposeful, and well-scoped. Many pages in this codebase were copied from a reference app and are poorly conceived at the **product** level — they do several unrelated things, surface confusing or low-value components, or duplicate what another page already does. Your job is to question whether the page should exist in its current form at all, and to redesign its structure.

This is **not** the activation prompt. The activation prompt (`PAGE_ACTIVATION_PROMPT.md`) assumes a page's design is correct and only replaces mock data with real data paths. **This prompt does the opposite job: it assumes the page's design and logic are suspect, and it changes them.** Data wiring (Hono/Drizzle/TanStack hooks) is explicitly out of scope here — that is the activation prompt's job. Keep the two concerns separate.

---

## Operating Mode: Plan, Then Execute on Approval

This prompt runs in **two stages**, and you must stop between them:

1. **PLAN stage** — Run the full evaluation process below and produce the deliverables (the verdict + restructuring spec). **Then stop and wait for explicit human approval.** Do not modify any files during this stage.
2. **EXECUTE stage** — Only after the human approves the plan, perform the restructuring described in the spec. Execution covers **UI and information-architecture changes only** (moving/merging/splitting/removing components, restructuring tabs and sections, deleting a page). It does **not** include wiring real backend data.

If the human approves only part of the plan, execute only that part. If the verdict is destructive (delete a page, merge two pages, remove components), re-confirm before executing even if general approval was given.

---

## Context: What This Codebase Looks Like

This is a bilingual (Arabic/English), RTL-first non-profit ERP built with:
- **Frontend**: React 19 + Vite + TypeScript, TailwindCSS, TanStack Query, i18next
- **Backend**: Hono (Node.js) + Drizzle ORM + PostgreSQL
- **Shared**: Zod schemas in `packages/shared`

Two relevant frontend surfaces:
- `https://ssgm.app` — the live production app (the target codebase).
- `https://full.ssgm.app` — the hosted full-pages reference app these pages were copied from. Use it to understand the page's *original* intent, but treat that intent as a starting hypothesis, not gospel — the reference app is exactly what produces the incoherent pages you are fixing.

The strategic core of the product is **Bousala** (a strategic compass: goals → KPIs → projects → impact). Every other module (donors, financials, beneficiaries, projects, stakeholders) ultimately feeds Bousala. When judging whether a page earns its place, ask how it serves that spine.

### Business-logic grounding

When you judge whether the page's logic, scope, fields, or workflows make sense, evaluate against:
- **Industry standards** for non-profit management.
- **Market leaders** — Salesforce Nonprofit Cloud, Bloomerang, Blackbaud, DonorPerfect.
- **Reason** — if the standard is overcomplicated for an MVP, simplify, and say why.
- **Gulf non-profit context** — Islamic finance (zakat, waqf, sadaqah), bilingual/RTL requirements, local compliance.

This is an **MVP**. Bias toward fewer, more cohesive pages with real depth over many half-baked ones.

---

## Your Process (PLAN stage)

Work on ONE page at a time. The page will be specified when you receive this prompt (e.g. `EVALUATE: Stakeholders`).

### Phase 0 — Intent

Read the page's entry component and its children. If it exists on `full.ssgm.app`, look at it there too.

Then state, in 1–2 sentences each:
1. **Job-to-be-done** — what task or decision does this page serve, and for which user (program manager, finance staff, donor relations, executive, admin)?
2. **Does it serve more than one job?** If the page is doing several unrelated things, enumerate each job separately. A page trying to be three things is the most common defect — name it explicitly.

If you cannot articulate a clear job-to-be-done, that itself is a finding — say so.

### Phase 1 — Inventory & Component Critique

List every section/component on the page (organized by tab if it has tabs). For **each one**, assign exactly one verdict and a one-line reason:

| Verdict | Meaning |
|---------|---------|
| **Keep** | Useful, well-placed, coherent with the page's job. |
| **Rework** | Belongs here, but is confusing, mislabeled, or poorly structured. |
| **Merge** | Overlaps with another component on this page; combine them. |
| **Move** | Useful, but belongs on a *different* page/module. |
| **Cut** | Decorative, redundant, low-value, or noise. Remove it. |

Common reasons to flag: duplicate of something elsewhere, decorative chart with no decision value, a feature unrelated to the page's stated job, a control that does nothing meaningful, mock-only vanity metrics.

### Phase 2 — Cross-Page / Information-Architecture Check

Compare this page against the rest of the system (use the page list in `PAGE_ACTIVATION_PROMPT.md` and the actual `apps/web/src/components/pages/` directory).

- Does another page already do this, in whole or in part?
- Is the real home for this content inside an existing page (e.g. as a tab)?
- Does this page pull content that logically belongs to another module?

State any overlap or misplacement you find.

### Phase 3 — Verdict on the Page

Choose **exactly one** outcome for the page as a whole, with rationale grounded in Phase 0–2 and the business-logic references:

- **Keep as a dedicated page (restructured)** — it earns standalone status; describe the restructure.
- **Merge into `[X]` as a tab/section** — it's really part of another page.
- **Split into `[X]` and `[Y]`** — it's two unrelated jobs that each deserve their own home.
- **Eliminate (redundant with `[X]`)** — it duplicates existing functionality; delete it and route any unique bits into `[X]`.
- **Demote to a section** — too thin to be a page; fold it into a parent as a panel/section.

If you recommend deletion or merge, list anything unique that must be preserved and where it goes.

### Phase 4 — Target Structure (the spec)

Describe the proposed end state concretely enough to build from:
- The new layout: sections and/or tabs, in order.
- What each section/tab holds (which surviving components, which new ones).
- What was cut, and the one-line reason for each cut.
- Any renames (labels, tab names) and why.
- Required translation keys that will change (namespace + key intent) — both `ar` and `en` must stay in sync.

Keep this as a spec, not code. Do not change the visual design language; restructure *what* is shown and *where*, not the styling system.

---

## Deliverables (end of PLAN stage)

1. **Intent statement** (Phase 0)
2. **Component critique table** (Phase 1)
3. **Cross-page findings** (Phase 2)
4. **Page verdict + rationale** (Phase 3)
5. **Target structure spec** (Phase 4)
6. **Open questions** — anything you need the human to decide before executing.

Then **stop and wait for approval.**

---

## Execution Rules (EXECUTE stage — only after approval)

Once the human approves:

1. **Make surgical changes.** Restructure only what the spec calls for. Don't "improve" adjacent, working code.
2. **Preserve the design system.** Reuse existing components, Tailwind conventions, and layout primitives. No new visual language.
3. **Bilingual / RTL is mandatory.** Every user-facing string goes through `t()`. Add/adjust keys in **both** `apps/web/public/locales/ar/{namespace}.json` and `apps/web/public/locales/en/{namespace}.json`. Verify RTL still works.
4. **No data wiring.** Surviving components keep whatever data source they had (mock or live). Do not add Hono routes, Drizzle tables, or TanStack hooks — that is the activation prompt's job. If a moved component was already live, keep it live; don't break it.
5. **Clean up your own orphans.** Remove imports, files, routes (frontend route registrations in `App.tsx`/sidebar config), and translation keys that *your* restructuring made unused. Don't delete pre-existing dead code that's unrelated — mention it instead.
6. **Update navigation.** If a page is deleted, merged, or demoted, update the sidebar/route config so there are no dead links.
7. **Desktop only.** No mobile responsiveness or touch optimization.
8. **No tests.** No test suite exists in this project.

### Verification after execution

1. **Build check** — `npm run build:web` must compile with zero errors.
2. **Visual check** — run `npm run dev:web`; the affected page(s) load with no console errors, all surviving tabs/sections render, navigation has no dead links, both Arabic and English render correctly, dark mode isn't broken.

### Final report

After executing, deliver:
1. List of files changed/created/deleted, one line each.
2. Navigation/route changes made.
3. Translation keys added/removed.
4. Confirmation the build passes.
5. Anything deferred or left as a follow-up.
