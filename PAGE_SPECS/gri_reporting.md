# Page Spec — GRI Reporting

**Page:** `apps/web/src/components/pages/GRIReportingPage.tsx`
**Sidebar key:** `gri_reporting`
**Related modules (not absorbed):** `grc` (enterprise governance/risk/regulatory compliance), `stakeholder_management` (stakeholder register/materiality matrix), `bousala` (goals → KPIs → impact), `financials` (economic figures), `staff` (workforce figures), `settings` (org profile).
**Stage:** 1 of 3 (DESIGN). Plan only — no code changes beyond this spec.

> Note: the in-repo page (`GRIReportingPage.tsx`), its mock data (`griData.ts`, `griQuestionnaireData.ts`), the `gri` translation namespace, and adjacent pages (`GrcPage`, `ShariaCompliancePage`, `StakeholderManagement`, `BousalaPage`) were inspected. The page uses a hub + wizard pattern (internal view state with "back to dashboard"), unlike the standard tabbed pages in this app. Treat current structure as intent/content reference, not a design to preserve.

---

## Intent

### Job-to-be-done
Give the sustainability/ESG reporting officer (and program/finance staff who feed it) a single workspace to **author, track completion of, and produce a GRI Standards sustainability report** for the organization. It answers: *which GRI disclosures are done, which are still missing, what data does each require, and can I export the finished report / content index?*

GRI (Global Reporting Initiative) is a recognized external reporting framework. For Gulf awqaf and foundations facing rising ESG/sustainability disclosure expectations, producing a GRI report is a discrete, high-value deliverable — distinct from internal regulatory compliance (owned by GRC).

### Does it serve more than one job?
Today it tries to be **four** loosely-connected screens for what is really **one** job:
1. **Dashboard** — completion overview + CTA hub.
2. **Data Collection** — per-disclosure narrative + evidence entry.
3. **Gap Analysis** — a (fake-AI) list of incomplete mandatory disclosures + "smart questions."
4. **Questionnaire** — a guided Q&A that collects the *same* disclosure data as Data Collection, via a different UI.

The core defect: **two parallel data-entry surfaces** (Data Collection and Questionnaire) for the same disclosures, plus a decorative Gap Analysis whose "smart questions" duplicate the Questionnaire. This is one job (fill in disclosures, see what's left, export) fragmented into four navigations.

---

## Component Critique Table

| Section / component | Verdict | Reason |
|---------------------|---------|--------|
| Page identity (`GRIReportingIcon`, title/subtitle) | **Keep** | Correct, distinct module; subtitle already promises "manage and create your GRI reports." |
| Dashboard — 4 completion rings (overall / universal / topic / sector) | **Rework** | Useful signal, but "sector" is always 0% (placeholder) and the rings are mock; keep overall + universal + topic on an Overview tab, drop sector. |
| Dashboard — disclosure status donut (complete/partial/missing) | **Keep** | Real at-a-glance completion signal; belongs on Overview. |
| Dashboard — Material Topics list (hardcoded ⚠️) | **Rework** | Valid GRI 3 concept but hardcoded and overlaps stakeholder materiality; keep as a small read-only "material topics in scope" summary. |
| Dashboard — "Ready for the next step?" CTA card (2 buttons) | **Cut** | Pure navigation chrome that exists only because the page is a hub; tabs replace it. |
| Settings gear + `GriSettingsModal` ("under construction") | **Cut** | Placeholder modal with no content; GRI config (report period, framework version) belongs in a real Report/setup surface, not a stub modal. |
| Data Collection — Universal / Topic / Sector tabs | **Rework** | Fold into a single **Disclosures** tab; Universal/Topic grouping stays, **Sector** tab is placeholder-only → cut. |
| Data Collection — accordion `StandardRow` (narrative, evidence upload, status) | **Keep** | This is the real data-entry unit; it becomes the single disclosure-entry surface. |
| Gap Analysis — fake-AI loading spinner (`setTimeout`) | **Cut** | Decorative; simulates AI work that doesn't exist. |
| Gap Analysis — Critical Gaps list (mandatory disclosures with missing data) | **Keep** | Genuinely useful; move to Overview as a "gaps to address" summary (derivable from disclosure statuses). |
| Gap Analysis — "AI-Generated Smart Questions" list | **Cut** | Duplicates the Questionnaire's questions; no independent value. |
| Questionnaire — progress bar + category accordions + `QuestionField` (text/number/currency, skip) | **Merge** | Same data as Data Collection via a second UI. Merge the useful part (typed field hints per disclosure, progress) into the single Disclosures tab; drop the separate wizard. |
| Export / report generation | **Missing (add)** | The page's stated purpose is to "create your GRI report," yet there is no output anywhere — a genuine gap to fill with a minimal Report tab. |

---

## Cross-Page Findings

1. **GRC stays separate.** `grc` owns enterprise governance, risk, and *regulatory* compliance (requirements, assessments, audit, screening). GRI is *external voluntary sustainability reporting* against a specific framework. Shared word "compliance" is fine — different deliverables, different audiences. No merge; GRI could later surface as a "framework" reference within GRC, but not for this MVP.

2. **Stakeholders owns materiality/engagement.** `StakeholderManagement` has a stakeholder register and materiality matrix. GRI 3 "material topics" conceptually derive from a materiality assessment. Keep GRI's material-topics list as a **read-only in-scope summary** here; its authoritative source is the org's materiality assessment (future link to `stakeholder_management`). Do not rebuild a materiality matrix here.

3. **Bousala / Financials / Staff feed disclosure figures.** Several topic disclosures pull from other modules: economic (GRI 201/203) ↔ `financials`; workforce (GRI 2-7, 401, 404, 405) ↔ `staff`; community impact (GRI 203-2, 413) ↔ `bousala`/`projects`. For BUILD these are entered on this page; ACTIVATE should note these fields may later be sourced/prefilled from those modules. No structural merge.

4. **Org profile (GRI 2-1, 2-2, 2-3).** Legal name, entities, report period are org-level facts owned by `settings`/org profile. Surface read-only / prefill here; the report period is the one setup field this page legitimately owns.

---

## Page Verdict + Rationale

**Keep as a dedicated page (restructured).**

GRI reporting is a self-contained, recognizable deliverable with real depth (a full disclosure framework already modeled in `griData.ts`). Eliminating it loses a differentiating ESG capability; merging into GRC would blur voluntary external reporting with internal regulatory compliance.

Restructure the hub + 4-wizard-view pattern into the app's standard tabbed page (matching `GrcPage`/`ShariaCompliancePage`), collapsing the two duplicate data-entry surfaces into one:
- **Overview** — completion status, gaps to address, material topics in scope (replaces the CTA hub).
- **Disclosures** — the single place to answer each disclosure (absorbs Data Collection + Questionnaire).
- **Report** — assemble/preview/export the GRI content index and report (fills the missing "create the report" job).

Cuts: fake-AI Gap Analysis, the separate Questionnaire wizard, the under-construction Settings modal, the always-empty Sector standards, and the CTA card.

**Preserve when cutting:** the Critical Gaps view (→ Overview), the typed field behavior from the Questionnaire (currency/number inputs → per-disclosure field hints on Disclosures), and the disclosure dataset in `griData.ts`.

---

## Target Structure Spec

Three tabs, same visual language. BUILD produces a fully interactive static frontend with local/mock state only. Use the shared `Tabs` component (as in `GrcPage`).

### Tab Order
`Overview` · `Disclosures` · `Report`

### Tab 1 — Overview
- **Completion KPIs** — reworked rings/cards: Overall completion, Universal Standards, Topic-Specific Standards. **Drop the Sector ring.** Mock/computed values in BUILD, derived from disclosure statuses in ACTIVATE.
- **Disclosure Status donut** — keep the complete / partial / missing breakdown.
- **Gaps to Address** *(moved from Gap Analysis)* — list of mandatory disclosures whose status ≠ complete, showing disclosure number, title, and which data is missing. Each row drills into that disclosure on the Disclosures tab. No fake-AI, no spinner.
- **Material Topics in Scope** — small read-only list of the org's selected material topics (GRI 3). Editable set is out of scope for MVP; note future source = materiality assessment.
- **Report meta** — report period + GRI framework version (e.g. "GRI Standards 2021"), shown here; period is editable (this page owns it). Replaces the deleted Settings modal.

### Tab 2 — Disclosures  *(absorbs Data Collection + Questionnaire)*
- **Standard-family grouping** — Universal (GRI 1/2/3) and Topic-Specific (grouped Economic / Environmental / Social). **No Sector group** (was placeholder).
- **Disclosure accordion row** (`StandardRow`, kept) — each row shows `standard-disclosureNumber`, title, and status pill; expands to:
  - **Narrative / structured response** — textarea by default; where the disclosure's data type is numeric/currency, show the typed input hint carried over from the Questionnaire (`currency` → SAR-suffixed number, `number` → numeric). Placeholder = the disclosure description.
  - **Supporting evidence** — file upload dropzone (static in BUILD).
  - **Status** — Not started / In progress / Complete.
  - **Save** (per-disclosure, static).
- **Completion progress bar** — carried over from the Questionnaire, shown at the top of the tab (share of disclosures marked complete).
- **Filter/toggle** *(optional, small)* — "show only incomplete" to reproduce the useful part of Gap Analysis inline. Include only if trivial; otherwise defer.

### Tab 3 — Report  *(new — fills the "create the report" job)*
- **GRI Content Index** — table of all in-scope disclosures: disclosure number, title, requirement (Yes / If applicable / Recommended), status, and page/reference field. This is the standard GRI "content index" every GRI report must contain.
- **Export / Generate** — button to export the report / content index (PDF/DOCX stub in BUILD; wired in ACTIVATE). Replaces the empty promise in the subtitle.
- **Readiness summary** — one-line "X of Y mandatory disclosures complete" gate before export.

### Cut

| Cut | One-line reason |
|-----|-----------------|
| "Ready for the next step?" CTA card | Navigation chrome made redundant by tabs. |
| Separate Questionnaire wizard | Duplicate data-entry surface for the same disclosures; merged into Disclosures. |
| Gap Analysis view (spinner + AI questions) | Fake-AI decoration; the one useful part (critical gaps) moved to Overview. |
| `GriSettingsModal` ("under construction") | Empty placeholder; real report-period setup lives on Overview/Report. |
| Sector Standards ring + tab + placeholder | Always 0% / "under development"; no content for MVP. |

### Renames

| Where | From | To (en) | To (ar) | Why |
|-------|------|---------|---------|-----|
| New Tab 1 | (Dashboard hub) | Overview | نظرة عامة | Turns the CTA hub into a real summary surface. |
| New Tab 2 | Data Collection / Questionnaire | Disclosures | الإفصاحات | One name for the single merged disclosure-entry surface. |
| New Tab 3 | — | Report | التقرير | Names the missing export/content-index deliverable. |

### Data Each Component Needs (notes for ACTIVATE — plain terms, not schema)

- **Disclosure catalog** — *reference/framework data (static, seeded — already in `griData.ts`).* Standard family, disclosure number, title (ar/en), description, data type, requirement (Yes / If applicable / Recommended), topic category (Economic/Environmental/Social).
- **Per-disclosure response** — *entered on this page.* Narrative/structured value, status (not started / in progress / complete), supporting-evidence file(s) placeholder, optional page/reference for the content index.
- **Completion KPIs & status donut** — *computed on this page* from response statuses.
- **Gaps to Address** — *derived* (mandatory disclosures with status ≠ complete).
- **Material topics in scope** — *entered on this page for MVP*; future source = materiality assessment (`stakeholder_management`), read-only then.
- **Report meta** — report period *(entered here)*; framework version label *(static)*; org profile fields for GRI 2-1/2-2 *(owned by `settings`/org profile, read-only/prefill here)*.
- **Economic / workforce / community figures** — for topic disclosures, *entered here in BUILD*; ACTIVATE may prefill from `financials` (GRI 201/203), `staff` (GRI 2-7/401/404/405), `bousala`/`projects` (GRI 203-2/413). Note as read-only-from-source candidates, not editable duplicates.
- **Content index / export** — *generated on this page* from the catalog + responses; export output (PDF/DOCX) stubbed in BUILD.

### Translation Namespace Impact (both `ar` + `en`)

- Keep the `gri` namespace.
- **Add:** `gri.tabs.overview`, `.disclosures`, `.report`.
- **Add:** `gri.overview.*` — gaps-to-address labels (reuse existing `gapAnalysis.criticalGaps*` intent), material-topics-in-scope label, report-period/framework labels.
- **Reuse/rework:** `gri.dataCollection.*` for the Disclosures tab (narrative, evidence, status, save, universal/topic labels, categories). Keep progress label from `gri.questionnaire.progress`.
- **Add:** `gri.report.*` — content-index column labels, export button, readiness summary.
- **Remove intent (stop using):** `gri.gapAnalysis.aiQuestions*` and its loading/summary keys, all `gri.questionnaire.*` beyond `progress`, `gri.settings.*`, `gri.placeholder.*`, `gri.sectorStandards` + `gri.dataCollection.sector*`, and the "next steps" CTA keys.
- `ar` and `en` must stay in sync when BUILD/ACTIVATE apply these.

---

## Open Questions — RESOLVED (approved 2026-07-08)

1. **Report/export tab:** ✅ **Include a minimal Report tab** (GRI content index table + stubbed export). It completes the page's stated job.
2. **Material topics:** ✅ **Read-only in-scope list for MVP.** Editing deferred to a future stakeholder/materiality workflow.
3. **Topic-disclosure figures (economic/workforce):** ✅ **Manual entry in BUILD.** Cross-module prefill from `financials`/`staff`/`bousala` is noted as an ACTIVATE-stage enhancement only.
4. **AI gap analysis:** ✅ **Dropped.** Replace with a plain derived "Gaps to Address" list. Any real Gemini-backed suggestion feature is a later decision.
