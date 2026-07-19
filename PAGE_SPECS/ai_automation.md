# Page Spec — AI & Automation

**Page:** `apps/web/src/components/pages/AiAutomation.tsx` + `apps/web/src/components/pages/ai/*` (+ embedded `AnomalyDetectionPage.tsx`)
**Sidebar key:** `ai_automation`
**Absorbs:** standalone `anomaly_detection` (already aliased to `ai_automation` in `LEGACY_MODULE_NAME_MAP`; keep as a tab, never a second sidebar entry)
**Stage:** 1 of 3 (DESIGN). Plan only — no code changes. All open questions are resolved below; this spec is ready for BUILD.

---

## Intent

### Job-to-be-done
Give **admins and power users** (program managers, donor-relations leads, finance ops) one place to (1) **ask the system questions in natural language**, (2) **clean and merge dirty CRM records**, (3) **define simple event→action automations**, and (4) **spot unusual KPI swings** that need investigation. Market leaders (Salesforce Einstein + Flow, Blackbaud Intelligence) treat AI as a *layer* over core ops — chat, data hygiene, light automation, anomaly alerts — not as a dumping ground for every analytics chart.

### Does it serve more than one job?
**Yes — badly.** The current page packs ~11 tabs that try to be: a chat product, an insights product, a BI/reporting suite, a forecast product, a search product, a financial approvals queue, a document OCR product, a UX-training workshop, a data-quality tool, a workflow builder, and an anomaly lab. Only four of those jobs belong together under "AI & Automation" for an MVP; the rest already live (or should live) elsewhere.

---

## Phase 1 — Component critique

| Tab | Section / component | Verdict | Reason |
|-----|--------------------|---------|--------|
| **AI Assistant** | Chat shell (messages, suggestions, mic, file attach, new conversation) | **Keep** | Clear primary job; Gemini route already exists server-side (`POST /ai/generate`). |
| **AI Assistant** | Function-call / navigation side effects | **Rework** | Keep the idea of "do something from chat," but strip the prop-drilling of every module's mock data; ACTIVATE wires tools against real APIs. |
| **Insights Generator** | Generate button + categorized insight cards (Achievements / Warnings / Opportunities / Predictions) + confidence + explain + thumbs | **Rework** + **Merge** | On-demand org insights are useful, but they duplicate `dashboard/AIInsightsPanel`. Keep generation here; Dashboard becomes a read-only subset with "View more" → this tab. Absorb forecast/anomaly *narrative* from Predictive Analytics into the Predictions/Warnings categories. |
| **Data Quality** | Health gauge + summary cards + Start scan | **Keep** | Real stewardship job; unique to this page. |
| **Data Quality** | Duplicates list + `MergeModal` + ignore confirm | **Keep** | Highest-value interaction on the page; merge UX is worth preserving. |
| **Data Quality** | Formatting issues list | **Keep** | Complements duplicates; same stewardship job. |
| **Data Quality** | Audit log of merge/ignore actions | **Keep** | Needed for accountable data cleanup. |
| **Workflow Automation** | My workflows list | **Keep** | Operational automations (new donor → email/task) are distinct from financial approval chains. |
| **Workflow Automation** | Create workflow (trigger + action selects + AI suggestion blurb) | **Rework** | Belongs here, but too thin (2 dropdowns, save does nothing). Expand to name + enable/disable + one trigger + one action; drop decorative AI blurb until ACTIVATE can suggest for real. |
| **User Flow Workshop** | Role + goal → generated step list | **Cut** | Meta/dev demo, not a non-profit ops job. Help & Support already covers onboarding/how-to. |
| **Intelligent Reporting** | Canned insight paragraphs | **Merge → Insights** | Narrative insights belong with Insights Generator, not a fake BI tab. |
| **Intelligent Reporting** | Donations-by-country bar + donor-health pie | **Cut** | Decorative mock charts; real donor analytics belong on Donors / Dashboard / Bousala. |
| **Predictive Analytics** | Donation forecast line chart | **Cut** | Vanity forecast with hardcoded months; no decision value without real series. |
| **Predictive Analytics** | Anomaly + recommendation text blocks | **Merge → Insights / Anomalies** | Narrative anomaly → Insights Warnings; operational detection UX already has its own tab. |
| **Anomaly Detection** | KPI picker + algorithm/sensitivity + run + chart with markers + anomaly list | **Keep** | Distinct monitoring job; already absorbed via module alias. Drop standalone sidebar if it ever reappears. |
| **Document Processing** | Upload dropzone + processed-documents table | **Cut** | OCR/classification is a later-phase platform capability; donors/partners already own document upload per entity. Hardcoded local translations are a smell. |
| **Smart Search** | Query box + donor Kanban results | **Cut** | Exact job of header `GlobalSearch`; this tab is a weaker duplicate over `MOCK_DONORS`. |
| **Automated Approvals** | Approval queue with approve/reject/comment | **Cut** | Exact job of `Financials → Approvals` (already live via `useApprovals`). Confusion with Settings approval-workflow config is harmful. |
| **Page chrome** | Centered H1 + description | **Rework** | Keep title/description, but align with the narrowed job (assistant + hygiene + automation + anomalies). |
| **Global `AiFab`** | Floating sparkles button | **Rework** *(cross-page)* | Keep as entry to Assistant; today it navigates to Dashboard — wrong. BUILD should open the Assistant tab (or a drawer that shares the same component). |

---

## Phase 2 — Cross-page / IA findings

1. **Smart Search vs header `GlobalSearch`** — same job (find records across the system). Header owns it. Cut the tab.

2. **Automated Approvals vs `Financials → Approvals`** — same queue (PRs, expenses, vendor payments). Financials already has live approve/reject. Cut the tab. Do **not** confuse with `Settings → Financial → Approval Workflows` (authorization *chains*), which stays in Settings.

3. **Insights Generator vs `dashboard/AIInsightsPanel`** — same content shape (opportunities / alerts / recommendations / forecasts). Decision: **one source of truth on this page**; Dashboard panel is a compact read-only feed with "View more" navigating to the Insights tab.

4. **Intelligent Reporting / Predictive Analytics vs Donors, Dashboard, Bousala** — charts and forecasts are analytics surfaces that belong with the domain (or Bousala for strategic KPIs), not under an AI kitchen sink. Cut the charts; keep only narrative insight categories.

5. **Anomaly Detection** — reference app still has a separate sidebar item; this repo already maps `anomaly_detection → ai_automation`. Confirm BUILD never re-registers it as a top-level module. Keep as a tab here.

6. **Document Processing vs per-module Documents tabs** — entity documents already live on donors/partners/etc. A central OCR inbox is a platform feature for later, not MVP.

7. **User Flow Workshop vs Help & Support** — how-to guidance belongs in Help. Cut.

8. **Workflow Automation vs Financial approval workflows** — different jobs (event automation vs spend authorization). Keep Workflows here with a clear label so they don't collide.

9. **AI Assistant vs `AiFab`** — one product, two entry points. Page tab = full experience; FAB = shortcut to the same Assistant. Do not maintain two different assistants.

---

## Phase 3 — Page verdict

**Keep as a dedicated page (heavily restructured).**

Collapse **11 tabs → 5**:

| # | Tab | Role |
|---|-----|------|
| 1 | **Assistant** | Natural-language Q&A / task help (primary surface) |
| 2 | **Insights** | On-demand org insights (canonical; feeds Dashboard "AI Insights" teaser) |
| 3 | **Data Quality** | Duplicate/format scan, merge, audit log (individual donors only) |
| 4 | **Automations** | Event→action rules (rename from Workflow Automation) |
| 5 | **Anomalies** | KPI anomaly detection (algorithm UI kept) |

### Unique assets to preserve
- Assistant chat UX (suggestions, mic, attach) → Assistant tab.
- Insights categories + confidence/explain/feedback → Insights tab (also backs Dashboard panel).
- Data Quality scan + merge modal + formatting + audit log → Data Quality tab (unchanged intent).
- Workflow list + trigger/action model → Automations tab (reworked form).
- Anomaly KPI runner (algorithm, sensitivity, chart markers) → Anomalies tab.

### Discarded (and why)
- Smart Search — owned by GlobalSearch.
- Automated Approvals — owned by Financials Approvals.
- Intelligent Reporting charts — vanity / wrong home.
- Predictive Analytics chart — vanity forecast.
- Document Processing — out of MVP scope; entity docs already exist.
- User Flow Workshop — not an ops job.

---

## Phase 4 — Target structure spec

Same visual language (`AiCard`, existing tabs, page header). Restructure *what* is shown.

### Tab order
`Assistant` · `Insights` · `Data Quality` · `Automations` · `Anomalies`

### Tab 1 — Assistant (was "AI Assistant")
- Full-height chat: header (status + New conversation), message list, suggestion chips, composer (attach + mic + text + send).
- Drop the kitchen-sink prop interface that injects every module's mock arrays; chat talks to the AI API and (later) tool calls.
- **FAB:** opens this same experience (navigate to `ai_automation` with Assistant tab active, or a shared drawer — BUILD picks the smaller change).

### Tab 2 — Insights (was "Insights Generator"; absorbs narrative bits from Intelligent Reporting + Predictive Analytics)
- Description + **Generate insights** CTA.
- Results grouped by category: Achievements · Warnings · Opportunities · Predictions (reuse existing category model).
- Each card: bilingual text, confidence %, expand-to-explain, helpful thumbs.
- Empty / loading / error states as today.
- **Cut:** any Recharts from Intelligent Reporting / Predictive Analytics.
- Dashboard `AIInsightsPanel` "View more" → navigates here (wire in BUILD).

### Tab 3 — Data Quality (unchanged intent)
Keep current substructure:
1. Health gauge + summary cards (duplicates, formatting, records scanned, issues found).
2. Start scan control.
3. Inner tabs: Dashboard · Duplicates · Formatting · Audit log.
4. Merge modal + ignore confirmation.

Scope for MVP: **individual donor records** only (matches current mock). Institutional donors / beneficiaries are a later expansion.

### Tab 4 — Automations (renamed from "Workflow Automation")
- **My automations** list: name, trigger label, action label, enabled toggle, edit.
- **Create / edit** panel or modal: name (ar/en), trigger (new donor / new donation / project status update), action (send email / create task / notify user), enabled.
- Cut the non-functional decorative "AI suggestion" callout until ACTIVATE can generate real suggestions (optional later).
- Explicitly **not** financial approval chains (those stay in Settings / Financials).

### Tab 5 — Anomalies
- KPI selector (daily donations, website visitors, new signups — or whatever live series ACTIVATE can feed).
- Algorithm + sensitivity controls + Run detection.
- Chart with anomaly markers + list of detected points (date, value, reason).
- No page-level H1 when embedded (tab provides context).

### Cut list (one line each)
| Cut | Reason |
|-----|--------|
| Smart Search tab | Duplicate of header GlobalSearch |
| Automated Approvals tab | Duplicate of Financials → Approvals |
| Intelligent Reporting charts | Domain analytics, not AI page |
| Predictive Analytics forecast chart | Hardcoded vanity series |
| Document Processing tab | OCR platform feature; entity docs already exist |
| User Flow Workshop tab | Demo/meta; Help covers how-to |
| Workflow "AI suggestion" blurb | Decorative until generation is real |
| Prop-drilling of all module mocks into Assistant | Legacy coupling; ACTIVATE uses APIs/tools |

### Renames
| Where | From (en) | To (en) | To (ar) | Why |
|-------|-----------|---------|---------|-----|
| Tab | Workflow Automation | Automations | الأتمتة | Shorter; avoids collision with financial "approval workflows" |
| Tab | AI Assistant | Assistant | المساعد | Cleaner under an already-AI page title |
| Page description | (current broad blurb) | Narrow to chat + insights + data quality + automations + anomalies | matching ar | Match real scope |

### Data each component needs (notes for ACTIVATE — plain terms, not schema)

| Component | Data | Ownership |
|-----------|------|-----------|
| **Assistant messages** | User/AI turns, optional attachments | *Entered/generated on this page* — **ephemeral for MVP** (New conversation resets local state; no conversation table) |
| **Assistant answers** | Model text via existing `POST /ai/generate` | *Generated*; org context (donors/projects/…) read from other modules when tools exist |
| **Insights** | Category, text ar/en, confidence, reasoning ar/en, generated_at | *Generated on this page* from cross-module aggregates (donors, projects, donations — **read-only, owned by those modules**) |
| **Dashboard AI panel** | Same insight feed, top N | *Read-only* subset of Insights |
| **Data Quality records** | Individual donor fields used for match/format checks | *Owned by Donors*; this page proposes merges/fixes (individual donors only in MVP) |
| **Duplicate pairs / formatting issues** | Pair ids, score, field, issue type | *Computed* by scan |
| **Merge / ignore actions** | Actor, timestamp, details | *Entered/logged on this page* (audit log) |
| **Automations** | Name ar/en, trigger, action, enabled | *Entered on this page* — single trigger + single action only (no branches / multi-step) |
| **Anomaly series** | Date/value KPI points | *Owned by source modules* (donations, web analytics, …) — read-only here |
| **Detected anomalies** | Date, value, algorithm, reason | *Computed* on this page |

### Translation namespace impact (`ar` + `en` must stay in sync)
- Keep namespace `ai_automation`.
- Rename keys/labels: `workflow_automation` → present as **Automations / الأتمتة** (key can stay or rename to `automations`; keep both locales in sync).
- Narrow `ai_automation.description`.
- Remove or stop loading unused sections: `smart_search`, `automated_approvals`, `document_processing`, `user_flow_workshop`, `intelligent_reporting`, `predictive_analytics` (after content merges).
- Keep `anomaly_detection` namespace for the Anomalies tab content.
- Dashboard: wire `dashboard.aiInsights.viewMore` to this page's Insights tab (no new copy required beyond link behavior).

---

## Decisions (resolved — ready for BUILD)

1. **Anomalies tab kept** as Tab 5 (KPI picker, algorithm/sensitivity, run, chart markers, anomaly list).

2. **Data Quality scope = individual donors only** for MVP. Institutional / beneficiaries later.

3. **Assistant conversations are ephemeral** for MVP — no saved history table; "New conversation" resets local state.

4. **Insights tab is canonical**; Dashboard `AIInsightsPanel` is a read-only teaser; "View more" navigates to Insights.

5. **Automations = single trigger + single action**, no branching / multi-step. BUILD ships static interactive UI (list + create/edit with local state); ACTIVATE persists later.

---

## What to do next

> Spec is approved with the decisions above. Run `PAGE_BUILD_PROMPT.md` for `ai_automation` to implement the 5-tab frontend from this blueprint.
