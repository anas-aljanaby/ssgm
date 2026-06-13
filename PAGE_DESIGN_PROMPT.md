# Page Design Prompt (Stage 1 of 3 — DESIGN → build → activate)

> **What you (the human) do here:** This stage writes *no code*. The agent decides whether page **X** should exist and what its target structure should be, then writes a spec to `PAGE_SPECS/<page>.md` and stops. **Review the verdict** (keep / merge / split / eliminate) **and the target structure** (tabs, sections, what's cut) — confirm the page's job-to-be-done makes sense for a real non-profit user, then approve or adjust. You are approving a blueprint, not a built page.

---

## What this stage is

You are evaluating one page and producing a **structure spec** for it. The page was copied from a vibe-coded reference app (`full.ssgm.app`) where a non-technical client threw in everything they could imagine — no coherent UX, IA, or scope. Treat that page as **inspiration for intent and content**, not as a design to preserve. Your job is to decide what the page *should* be, not to defend what it currently is.

This is a **plan-only** stage. You produce a spec and stop for human approval. The next stage (`PAGE_BUILD_PROMPT.md`) implements the frontend from your spec; the stage after (`PAGE_ACTIVATION_PROMPT.md`) wires the backend. Do not do their work here — no interactivity, no data wiring, no component edits.

## Context

Bilingual (Arabic/English), RTL-first non-profit ERP for Gulf awqaf and charitable foundations. React 19 + Vite + Tailwind + TanStack Query + i18next on the frontend; Hono + Drizzle + Postgres on the backend. The strategic core is **Bousala** (a strategic compass: goals → KPIs → projects → impact); every other module ultimately feeds it. This is an **MVP** — bias toward fewer, cohesive pages with real depth over many half-baked ones.

When judging scope, fields, and workflows, ground decisions in: industry standards for non-profit management; how market leaders solve it (Salesforce Nonprofit Cloud, Bloomerang, Blackbaud, DonorPerfect); plain reason (simplify if the standard is overkill for an MVP, and say why); and the Gulf context (zakat, waqf, sadaqah, bilingual/RTL, local compliance).

## Inputs you read first

1. The page's entry component and its children in `apps/web/src/components/pages/<page>/`.
2. The same page on `full.ssgm.app` if it exists there — to recover the client's original intent.
3. The rest of `apps/web/src/components/pages/` — so you can spot overlap with other pages.

---

## Process

### Phase 0 — Intent

State, in 1–2 sentences each:
1. **Job-to-be-done** — what task or decision does this page serve, and for which user (program manager, finance staff, donor relations, executive, admin)?
2. **Does it serve more than one job?** A page trying to be three things is the most common defect — if so, enumerate each job separately.

If you cannot articulate a clear job-to-be-done, that itself is a finding — say so.

### Phase 1 — Component critique

List every section/component (grouped by tab if tabbed). Give each **exactly one** verdict + a one-line reason:

| Verdict | Meaning |
|---------|---------|
| **Keep** | Useful, coherent with the page's job. |
| **Rework** | Belongs here, but confusing, mislabeled, or poorly structured. |
| **Merge** | Overlaps another component on this page; combine them. |
| **Move** | Useful, but belongs on a different page/module. |
| **Cut** | Decorative, redundant, low-value, or noise. |

Common flags: duplicate of something elsewhere, decorative chart with no decision value, a feature unrelated to the page's job, a control that does nothing, mock-only vanity metrics.

### Phase 2 — Cross-page / IA check

- Does another page already do this, in whole or part?
- Is the real home for this content a tab inside an existing page?
- Does this page pull content that belongs to another module?

State any overlap or misplacement.

### Phase 3 — Page verdict

Choose **exactly one**, with rationale grounded in Phases 0–2:

- **Keep as a dedicated page (restructured)** — describe the restructure.
- **Merge into `[X]` as a tab/section.**
- **Split into `[X]` and `[Y]`.**
- **Eliminate (redundant with `[X]`).**
- **Demote to a section of `[X]`.**

If deleting or merging, list anything unique that must be preserved and where it goes.

### Phase 4 — Target structure spec

Describe the end state concretely enough for the BUILD stage to implement without re-deciding anything:
- The new layout: sections and/or tabs, in order.
- What each section/tab holds — which surviving components, which new ones, and a one-line description of each new one.
- What was cut, one-line reason each.
- Renames (labels, tab names) and why.
- The data each surviving/new component will need, described in plain terms (this is *notes for the ACTIVATE stage*, not a schema — e.g. "list of projects with name, status, budget, % complete"). Do not design tables or APIs. For each, note whether it is **entered on this page** or **owned/edited by another module** (read-only here, sourced from `<module>`) — this tells BUILD which fields get an edit affordance vs a drill-through link, and tells ACTIVATE which fields to wire to another module's API.
- Translation namespaces/keys that will change in intent (both `ar` and `en` must stay in sync later).

Keep it a spec, not code. Do not change the visual design language — restructure *what* is shown and *where*.

---

## Deliverable

Write the spec to **`PAGE_SPECS/<page>.md`** (create the folder if needed) with these sections: Intent, Component critique table, Cross-page findings, Page verdict + rationale, Target structure spec, and **Open questions** (anything the human must decide before BUILD).

Then post a short summary in chat and **stop. Make no other code changes.**

## What the human reviews here (point them at this)

> Read the **Page verdict** and the **Target structure spec** in `PAGE_SPECS/<page>.md`. Ask yourself: does the stated job-to-be-done match what a real user needs? Is the verdict right (should this page even exist as-is)? Is the tab/section structure sensible, and is anything important in the "cut" list that you actually want kept? Answer the Open questions. If yes, approve and run the BUILD prompt; if not, correct the spec first.
