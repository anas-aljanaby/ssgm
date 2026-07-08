# Partner Evaluations — Page Design Spec (Stage 1)

**Verdict at a glance: ELIMINATE as a standalone page. Fold its one unique asset (the multi-criteria scored evaluation form) into the existing `Implementing Partners → Performance` tab, which already owns partner evaluation and is backend-wired.**

---

## Intent (Phase 0)

1. **Job-to-be-done.** Let a program manager (or partnerships officer) score an implementing partner against defined criteria — timeliness, quality, communication, transparency, budget discipline, etc. — record strengths/weaknesses/recommendations, and produce an overall rating that feeds partner selection and renewal decisions.

2. **Does it serve more than one job?** No — it does exactly one job. The problem is not that the page is confused; it's that **this job already has a home**. The `Implementing Partners` module's `PerformanceTab` (`apps/web/src/components/pages/implementing_partners/tabs/PerformanceTab.tsx`) does the same thing, against the same `Partner` entity, and is already wired to a real backend (`usePartnerEvaluations` / `useCreatePartnerEvaluation`). This standalone page is a second, disconnected front door to the same task.

The page's job-to-be-done is clear and legitimate. The finding is a **duplication / IA** finding, not a "no clear purpose" finding.

---

## Component critique (Phase 1)

Current page is a two-pane master–detail: a partner list (left) + an evaluation form (right), plus a success modal.

| Component | Verdict | Reason |
|-----------|---------|--------|
| `PartnerList` (search + rating-sorted partner list) | **Cut** | Duplicates the Implementing Partners list/search/filter, which is richer (sector, status, country, performance filters, pagination). No reason to maintain a second partner picker. |
| `EvaluationForm` header (title, "last evaluation" date, "New Evaluation" button) | **Rework** | Keep the intent (evaluation header) but it belongs inside the partner detail context where the partner is already selected; the hardcoded "15 December 2023" date is mock noise. |
| `ScoreSlider` criteria groups — Commitment (timeline, quality), Cooperation (communication, transparency, flexibility), Efficiency (budget, resources) | **Move** | This is the **one genuinely valuable asset** the page adds: a structured, multi-dimensional scoring rubric. The existing PerformanceTab only captures a single 1–5 star rating + free-text comment and has an empty "criteria" placeholder (`partners.performance.criteriaPlaceholder`). Move this rubric there. |
| `InteractiveStarRating` (overall 1–5) | **Merge** | PerformanceTab already has an overall rating (`form.rating`, 1–5). Consolidate — don't keep two overall-rating controls. |
| Strengths / Weaknesses / Recommendations textareas | **Move** | Useful qualitative capture; move into the PerformanceTab evaluation modal (it currently has a single `comment` field — expand it to these three, or keep `comment` + add these). |
| `SuccessModal` | **Cut** | PerformanceTab already gives success feedback via toast (`partners.performance.addSuccess`). A full-screen success modal is heavier than the module's established pattern. |
| Breadcrumb / page title | **Cut** | Becomes redundant once this lives inside the Implementing Partners detail view, which has its own breadcrumb. |

**Legacy-code note:** the entire page is legacy per the project's data-layer rules — it imports `MOCK_PARTNERS` from `apps/web/src/data/partnersData.ts` and uses the legacy `useLocalization` hook, with **no** TanStack Query or Hono wiring. Nothing here is a pattern to preserve; only the *rubric design* is worth carrying over.

---

## Cross-page / IA findings (Phase 2)

- **Direct duplication.** `Implementing Partners → Performance` tab is the canonical, backend-wired partner-evaluation surface. It has: an overall score card, a list of evaluation records (reviewer, date, project, rating, comment), an "Add Evaluation" modal, and — tellingly — a **criteria section that is currently just a placeholder** (`partners.performance.criteriaTitle` / `criteriaPlaceholder`). The standalone page's rubric is exactly what that placeholder was reserving space for.
- **Same entity, same data.** Both operate on the `Partner` type. Evaluations belong to a partner; the natural home is inside that partner's detail view, not a parallel top-level page where you re-pick the partner.
- **Registry.** Both are registered as separate top-level modules (`packages/shared/src/constants/modules.ts` lines 14–15, and `moduleRegistry.tsx` lines 47–48). Keeping two modules for one job splits the sidebar and confuses users about where to evaluate a partner.

**Conclusion:** the real home for this content is the existing Performance tab. There is no distinct job that justifies a second page.

---

## Page verdict (Phase 3)

**Eliminate — redundant with `Implementing Partners`.** Remove `partner_evaluations` as a standalone page/module. Migrate its one unique asset (the structured multi-criteria scoring rubric + qualitative notes) into the existing `Implementing Partners → Performance` tab, which already owns this job and is backend-wired.

### What must be preserved and where it goes
- **The scoring rubric** (three criteria groups → 7 sub-criteria) → becomes the content of the Performance tab's currently-empty "Evaluation Criteria" section **and** the fields of its "Add Evaluation" modal.
- **Strengths / Weaknesses / Recommendations** qualitative capture → added to the "Add Evaluation" modal (extending or replacing the single `comment` field).
- **Criteria labels & section names** (the `partner_evaluations.criteria.*` and `partner_evaluations.sections.*` translation keys) → migrate into the `partners` namespace under `partners.performance.*`.

### What is discarded
- The standalone page shell, partner picker, breadcrumb, success modal, and the `partner_evaluations` module/route/namespace.

---

## Target structure spec (Phase 4)

There is **no standalone Partner Evaluations page** in the end state. The target is the modified `Implementing Partners → Performance` tab. Visual design language stays as-is (the existing partners module styling); we restructure *what* the tab holds.

### Performance tab — target layout (in order)

1. **Overall Score card** — *(keep, unchanged)* big overall rating number + stars + "based on N evaluations". Data: partner's aggregate rating (owned here, derived from evaluation records).

2. **Evaluation Criteria breakdown** — *(new — replaces the current empty placeholder)* a read-only summary of the partner's average score per criterion, grouped:
   - **Commitment**: Adherence to schedule, Quality of outputs
   - **Cooperation**: Quality of communication, Transparency, Flexibility & responsiveness
   - **Efficiency**: Budget management, Resource utilization
   Shown as labeled bars/scores (reuse the module's existing visual style; the 0–100 slider look from the old page is fine as a static read-only bar). Data: per-criterion averages across this partner's evaluation records (owned here). If no evaluations exist yet, show the existing empty state.

3. **Evaluation Records list** — *(rework)* existing cards, but the free-text body now shows the structured **strengths / weaknesses / recommendations** instead of the single `comment`; keep reviewer, date, linked project, and the (now derived) rating. Data: list of evaluation records for this partner (owned here).

4. **"Add Evaluation" modal** — *(rework — this is where the rubric moves)* replace the single 1–5 `rating` dropdown with the full rubric:
   - Reviewer *(keep)*, Linked project *(keep — sourced read-only from the Projects module, same as today)*
   - **Criteria scores** for the 7 sub-criteria above (grouped by the 3 sections). One-line description: each is a **1–5** score (star or select), consistent with the module's star-based rating.
   - **Overall rating** — **auto-derived**, displayed read-only as the average of the 7 criteria scores (rendered as stars). No separate overall control; the two old overall inputs are dropped in favor of the computed value.
   - **Strengths**, **Weaknesses**, **Recommendations** free-text areas that **replace** the single `comment` field.
   Data entered on this page (owned here). The resulting record updates the partner's aggregate rating (existing behavior via `onPartnerUpdate({ ...partner, rating: result.partnerRating })`).

### Cut list (one line each)
- Standalone page shell + breadcrumb — redundant inside detail view.
- `PartnerList` picker — duplicates Implementing Partners list.
- `SuccessModal` — module uses toast feedback instead.
- Hardcoded "last evaluation: 15 December 2023" — mock noise.

### Renames / namespace changes
- Delete namespace `partner_evaluations` (both `ar` and `en` files) after migrating keys.
- Add to `partners.performance.*`: the 3 section labels (`commitment`, `cooperation`, `efficiency`), the 7 criteria labels, and `strengths` / `weaknesses` / `recommendations` labels. Keep `ar` and `en` in sync.
- Remove `partner_evaluations` from `packages/shared/src/constants/modules.ts` (lines 14–15, 38–39, 82–83) and from `moduleRegistry.tsx` (line 48). Delete `PartnerEvaluationsPage.tsx`.

### Data notes for ACTIVATE stage
- **Evaluation record** now needs 7 per-criterion scores (each **1–5**) + `strengths` / `weaknesses` / `recommendations` text, plus reviewer and linked project. The `rating` is **derived** (average of the 7 criteria), not entered; the old single `comment` field is **removed**. The existing `usePartnerEvaluations` / `useCreatePartnerEvaluation` hooks and their Hono route + Drizzle table need these columns (all inside the partner-evaluation record; no new module). Confirm the exact current schema in ACTIVATE.
- **Linked project** stays read-only, sourced from the Projects module (unchanged from today).
- **Per-criterion averages** (section 2) and the record-level overall rating are both computed from the per-criterion scores — ACTIVATE decides client- vs server-side.

---

## Resolved decisions (human-approved)

1. **Scoring scale — 1–5.** All 7 criteria use a **1–5** scale, consistent with the module's star-based rating (and Bloomerang/Blackbaud partner scorecards). The old 0–100 sliders are dropped.
2. **Overall rating — auto-derived.** The record's overall rating is the **average of the 7 criteria scores**, shown read-only as stars. No separate overall-rating control in the modal.
3. **Strengths/weaknesses/recommendations — replace `comment`.** The single `comment` field is **removed** and replaced by three structured fields (`strengths`, `weaknesses`, `recommendations`). Record cards render these three.
4. **Criteria set — confirmed.** The 7 criteria (timeline, quality, communication, transparency, flexibility, budget, resources) are approved as-is.
5. **Sidebar/RBAC cleanup — approved.** Remove the `partner_evaluations` module entirely from the module list and RBAC (`packages/shared/src/constants/rbac.ts` if present) — no hidden/locked stub. Delete `PartnerEvaluationsPage.tsx` and its `partner_evaluations` translation namespace.

No open questions remain — the spec is ready for the BUILD stage.
