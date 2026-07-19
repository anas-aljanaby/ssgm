# Page Spec — Digital Marketing

**Page:** `apps/web/src/components/pages/DigitalMarketing.tsx` + `apps/web/src/components/pages/marketing/`*  
**Also embeds:** `SmartMessageCampaign.tsx`, `OptimalContactTimingPage.tsx`  
**Sidebar key:** `digital_marketing`  
**Legacy keys (already mapped here):** `smart_message_campaign`, `optimal_contact_timing`  
**Stage:** 1 of 3 (DESIGN). Plan only — no code changes. All open questions are resolved into decisions below; this spec is ready for BUILD.

---

## Intent

### Job-to-be-done

Help **donor-relations / fundraising officers** plan and run outbound digital outreach — appeals, stewardship, and re-engagement — primarily over **email and SMS/WhatsApp**, using donor data for audience, timing, and personalization. Secondary users: program managers launching a campaign around a project, and executives glancing at digital fundraising health.

### Does it serve more than one job?

Yes — today it tries to be eight products at once. Enumerating them makes the defect obvious:

1. **Omnichannel campaign planning** (Campaigns tab + incomplete 8-step wizard)
2. **Email broadcast ops** (Email tab)
3. **SMS / WhatsApp channel ops** (SMS tab)
4. **Social media scheduling** (Social tab)
5. **Paid advertising platform management** (Ads tab)
6. **Website / landing-page CMS** (Website tab)
7. **Content publishing** (Content placeholder)
8. **Standalone marketing analytics suite** (Analytics placeholder)
9. **AI per-donor message generation** (Smart Messaging tab)
10. **Predictive contact-timing** (Optimal Timing tab)

Market leaders (Bloomerang, Raiser's Edge + Constant Contact) treat digital engagement as **email + SMS + segmented donor journeys**, with AI assist — not a HubSpot clone with ad OAuth, page builders, and a CMS. For a Gulf non-profit MVP, jobs **1 + 2 + 3 + 9 + 10** (and a light **4**) are the coherent set. Jobs **5–8** are either a different product category or vanity for this stage.

---



## Phase 1 — Component critique


| Tab                 | Section / component                                                                                                                  | Verdict              | Reason                                                                                                                                                        |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Dashboard**       | 8× `MarketingMetricCard` (conversion, email, social, traffic, ads, content, ROI, digital donations)                                  | **Rework**           | Useful as an overview, but 8 vanity KPIs with empty sparklines; several (ads, content, traffic) belong to cut tabs. Shrink to 4 fundraising-relevant metrics. |
| **Dashboard**       | `RealTimeActivityFeed`                                                                                                               | **Keep**             | Cross-channel activity is the right overview job; keep once channels are real.                                                                                |
| **Dashboard**       | `QuickActionsPanel` (6 actions)                                                                                                      | **Rework**           | Half are dead (Publish Blog toast, View Analytics → empty tab, Generate Report toast). Keep only actions that land on surviving tabs/modals.                  |
| **Campaigns**       | KPI cards (active / spend / ROI / conversion)                                                                                        | **Keep**             | Sensible campaign-roll-up metrics.                                                                                                                            |
| **Campaigns**       | Filter chips + `CampaignsTable`                                                                                                      | **Keep**             | Primary list view for the page's core entity.                                                                                                                 |
| **Campaigns**       | `CreateCampaignWizard` (8 steps, only 1–2 built, does not persist)                                                                   | **Rework**           | Concept is right; 8-step HubSpot-style wizard is overkill. Collapse to a short create flow (basics → audience → channel → review).                            |
| **Smart Messaging** | `DashboardStats` + language pie                                                                                                      | **Rework**           | Stats are mock vanity until generation is real; keep a slim summary after generate, drop decorative pie-before-data.                                          |
| **Smart Messaging** | `CampaignTypeSelector` (thank you / update / request / re-engage / milestone)                                                        | **Keep**             | Clear stewardship typology; on-job for personalized outreach.                                                                                                 |
| **Smart Messaging** | `TargetSelectionPanel` (donor filters)                                                                                               | **Keep**             | Audience selection is core; donors are owned by Donors module (read-only here).                                                                               |
| **Smart Messaging** | `CampaignConfigPanel` (language / timing / personalization)                                                                          | **Keep** + **Merge** | Timing config overlaps Optimal Timing; merge into one Outreach flow.                                                                                          |
| **Smart Messaging** | `LivePreviewPanel` + `GeneratedMessages`                                                                                             | **Keep**             | Preview + batch results are the value of this feature.                                                                                                        |
| **Optimal Timing**  | Dismissible "ready today" alert + 4 KPI cards                                                                                        | **Merge**            | Same job as Outreach (who to contact); become the Outreach queue header, not a separate tab.                                                                  |
| **Optimal Timing**  | Filter bar (non-functional selects)                                                                                                  | **Cut**              | Dead controls; Outreach already has donor filters.                                                                                                            |
| **Optimal Timing**  | Donor timing table (next gift, best day/channel, engagement)                                                                         | **Merge**            | Valuable columns → Outreach "Ready to contact" queue / sort; also already echoed on donor detail.                                                             |
| **Optimal Timing**  | Preview footer button (non-functional)                                                                                               | **Cut**              | Dead control.                                                                                                                                                 |
| **Social**          | Account cards + performance KPIs                                                                                                     | **Rework**           | Keep connected-accounts strip; drop duplicate vanity KPIs (Overview owns roll-up).                                                                            |
| **Social**          | Calendar + `CreatePostModal`                                                                                                         | **Keep**             | Scheduling posts is a real fundraising-comms job and doesn't always belong inside a Campaign.                                                                 |
| **Email**           | KPI strip + `RecentEmailsTable`                                                                                                      | **Merge**            | Email *sends* become Campaign rows with channel=email (or campaign detail history). Standalone Email tab goes away.                                           |
| **Email**           | `SendEmailModal` (to/subject/body)                                                                                                   | **Rework**           | Keep as a quick-send affordance from Overview / Campaign create — not a full ESP. Wire Create button (currently broken).                                      |
| **SMS/WhatsApp**    | Channel cards (balance, rates, provider)                                                                                             | **Rework**           | Channel health belongs as a thin strip on Campaigns or Overview, not its own tab.                                                                             |
| **SMS/WhatsApp**    | Action bar (Send SMS / WhatsApp / Template / Inbox — all dead)                                                                       | **Cut**              | Non-functional noise; send flows through Campaign create / Outreach.                                                                                          |
| **SMS/WhatsApp**    | `RecentMessagingCampaignsTable`                                                                                                      | **Merge**            | Same entity as Campaigns with channel=sms/whatsapp.                                                                                                           |
| **Website**         | Landing page KPIs + table + create modal (builder "coming soon")                                                                     | **Cut**              | Page builder is a separate product. Donation forms belong later under Donors/Financials, not a fake CMS here.                                                 |
| **Content**         | `PlaceholderPage`                                                                                                                    | **Cut**              | Empty shell; no MVP job.                                                                                                                                      |
| **Ads**             | Platform connection cards (6 networks) + overall perf + ad campaigns table                                                           | **Cut**              | Paid-ad OAuth and ROAS dashboards are out of MVP scope; Google Ad Grants vanity without real integration.                                                     |
| **Ads**             | `CreateAdModal`                                                                                                                      | **Cut**              | Goes with Ads tab.                                                                                                                                            |
| **Analytics**       | `PlaceholderPage`                                                                                                                    | **Cut**              | Metrics live on Overview + Campaigns; a dedicated analytics suite is premature.                                                                               |
| *(orphans)*         | `marketing/CampaignTypeSelector`, `marketing/CampaignConfigPanel`, `marketing/advertising/AdvertisingTab`, unused `optimal_timing/`* | **Cut**              | Duplicate/unused trees — delete in BUILD cleanup, not new surfaces.                                                                                           |


---



## Phase 2 — Cross-page / IA findings

1. **Smart Messaging + Optimal Timing are already demoted into this module** via `LEGACY_MODULE_NAME_MAP` → `digital_marketing`. They are not separate sidebar pages. Keeping them *as two tabs* still splits one job ("contact the right donor with the right message at the right time"). **Decision:** one **Outreach** tab.
2. **Donor detail already surfaces Optimal Contact Timing** (`donors_individual/DetailOverviewTab`). Timing *per donor* stays owned by Donors (read-only signal). This page owns the **queue / batch** view for officers running outreach — not a second system of record for timing scores. Timing scores are **computed from Donors + donation/communication history** (owned elsewhere).
3. **"Campaign" name collision.** Fundraising `Campaign` (wizard) vs paid `AdCampaign` (Ads tab) vs messaging "campaign" (SMS table) vs Smart Messaging "campaign type". **Decision:** one entity — **Campaign** = planned outreach with a primary channel (`email` | `sms` | `whatsapp` | `social`). Ads concept is cut for MVP. Smart Messaging types become **message purpose** on Outreach, not a second campaign system.
4. **No overlap with Bousala / Projects / Financials** for core messaging. Digital donations KPI on the dashboard is a **cross-module read** from Financials/Donations (attribution can stay crude for MVP). Landing-page "conversions" that were on Website tab are cut with that tab.
5. **Website / Content / Ads** do not belong as half-tabs inside this ERP module for MVP. If needed later: Ads as an integrations settings surface; donation pages under Donors/Financials; Content never unless the product strategy changes.

---



## Phase 3 — Page verdict

**Keep as a dedicated page (restructured).**

Digital Marketing (donor digital outreach) is a legitimate sidebar module for Gulf charities — WhatsApp/SMS + email appeals are core fundraising ops, and AI personalization is a credible differentiator. The current page fails because it is a kitchen-sink copy of every marketing tool the client imagined (11 tabs, 2 empty, Ads/CMS/Analytics as theater).

### Restructure

- Collapse **11 tabs → 4 tabs**: Overview · Campaigns · Outreach · Social.
- **Merge** Smart Messaging + Optimal Timing → **Outreach**.
- **Merge** Email + SMS/WhatsApp campaign lists into **Campaigns** (channel is a field).
- **Cut** Content, Analytics, Website, Ads entirely for MVP.
- **Rework** Overview KPIs and Quick Actions to match surviving jobs.
- **Rework** campaign create from 8 incomplete steps → short 4-step flow.



### Unique value preserved (and where it goes)


| Unique piece                                            | Destination                                              |
| ------------------------------------------------------- | -------------------------------------------------------- |
| Campaign list + KPIs + filters                          | Campaigns tab                                            |
| Email send history / create                             | Campaigns (channel=email) + quick-send from Overview     |
| SMS/WhatsApp campaign rows + channel health strip       | Campaigns (channel=sms/whatsapp) + thin health strip     |
| Social calendar + compose + accounts                    | Social tab                                               |
| Message types, targeting, AI generate, preview, results | Outreach tab                                             |
| Ready-to-contact / best time / best channel             | Outreach queue (batch); per-donor still on Donors detail |
| Activity feed                                           | Overview                                                 |
| Digital donations headline metric                       | Overview (read from Donations)                           |


Nothing unique from Ads / Website / Content / Analytics placeholders needs preserving for MVP.

---



## Phase 4 — Target structure spec

Four tabs. Same visual language as today (cards, tables, modals, existing Tailwind patterns). Restructure *what* is shown and *where* — do not invent a new design system.

### Tab order

`Overview` · `Campaigns` · `Outreach` · `Social`

---



### Tab 1 — Overview (was "Dashboard")

**Headline KPI cards — keep 4 only:**

1. **Digital donations** (period total) — *owned by Financials/Donations; read-only here*
2. **Campaigns active** — *entered/owned on Campaigns tab; computed count*
3. **Email performance** (open rate or similar roll-up) — *computed from Campaign sends with channel=email*
4. **Messages sent** (email + SMS/WhatsApp in period) — *computed from Campaign sends*

**Cut from the old 8:** social reach, website traffic, ad performance, content engagement, campaign ROI as separate vanity cards (ROI can appear on Campaigns tab if needed later).

**Activity feed** — Keep. Shows recent sends, social posts scheduled, donations attributed to digital (mock until ACTIVATE).

**Quick actions** — Rework to exactly:


| Action          | Goes to                                              |
| --------------- | ---------------------------------------------------- |
| Create Campaign | Opens campaign create on Campaigns (or wizard modal) |
| Quick Email     | Opens slim send modal                                |
| Open Outreach   | Switches to Outreach tab                             |
| Schedule Social | Opens create-post modal / Social tab                 |


**Cut quick actions:** Publish Blog, Generate Report, View Analytics, Create Ad.

---



### Tab 2 — Campaigns

Primary entity of the page: a **fundraising outreach campaign**.

**Sections (in order):**

1. **Header** — title + "Create Campaign" button.
2. **KPI strip** — Active count · Spend (optional; can be 0 until budgets are used) · Messages sent · Avg open/response rate. (Reuse/adapt existing `CampaignKpiCard`s; drop ROI if no reliable revenue attribution yet — prefer honest metrics.)
3. **Filters** — All / Active / Ending Soon; add **Channel** filter chips: All · Email · SMS · WhatsApp · Social.
4. **Campaigns table** — Name · Status · Channel(s) · Date range · Audience size · Progress/goal · Owner · Actions. Merge former Email "recent emails" and SMS "recent messaging campaigns" into this list (a row is a campaign, not a channel-specific duplicate entity).
5. **Channel health strip** *(new, compact)* — one row under the table or above filters: Email deliverability snapshot · SMS balance/provider · WhatsApp quality. Pulled from former SMS/Email channel cards; **not** a full second dashboard. If a metric isn't available, show "—" rather than fake precision.

**Create Campaign flow** *(rework wizard)* — 4 steps only:

1. **Basics** — name (en/ar), objective (appeal / stewardship / update / event), dates, owner, optional budget.
2. **Audience** — all contacts / segment / filter (reuse Step2Audience intent; segments may be static lists for BUILD).
3. **Channel & content** — pick primary channel (email | sms | whatsapp | social); subject/body or link to draft; language.
4. **Review & launch** — summary; status → Draft or Scheduled/Active.

**Cut:** wizard steps 3–8 "under construction" placeholders; separate Email/SMS tabs; Ads create.

**Data notes (for ACTIVATE later):**

- Campaign fields entered here: name_en/ar, objective, status, channel, start/end, budget, owner, audience definition, content draft, counts/metrics computed from sends.
- Owner may reference Staff (read-only name) if Staff module is live; else free text for BUILD.
- Audience donors are **owned by Donors** — selected IDs only.

---



### Tab 3 — Outreach (merge of Smart Messaging + Optimal Timing)

One job: **contact the right donors with a personalized message, timed well.**

**Sections (in order):**

1. **Ready-to-contact queue** *(from Optimal Timing)* — table of donors flagged ready / due soon: Name · Best day/time · Best channel · Engagement · Last contact · Next predicted gift (if available). Primary CTA: "Use in message" (selects them as Outreach targets). Data **computed from Donors + donation/communication history** — not manually entered here. Per-donor deep link → Donors detail.
2. **Message purpose** — keep `CampaignTypeSelector` (thank you / update / request / re-engagement / milestone).
3. **Targets** — keep `TargetSelectionPanel`; pre-fill from queue selections; donors read-only from Donors module.
4. **Config** — language, send timing (immediate / use best time / custom), personalization level, channel (email default; SMS/WhatsApp if in scope). Timing "use best time" reads the same signals as the queue.
5. **Generate + Live preview + Results table** — keep existing Smart Messaging flow (`LivePreviewPanel`, `GeneratedMessages`). Bulk send/schedule buttons stay as UI for BUILD (static ok until ACTIVATE).

**Cut:** Optimal Timing as its own tab; non-functional filter selects; decorative pre-generate language pie; orphan `optimal_timing/`* components not wired today (BUILD may reuse `ContactNowModal` if useful, else leave unused — do not expand scope).

**Data notes:**

- Generated messages entered/produced here (content, scores, schedule, status).
- Donor attributes, engagement, last contact, gift history: **owned by Donors / Donations** — read-only.
- Templates: config owned on this page (or static seed for BUILD).

---



### Tab 4 — Social

**Sections:**

1. **Connected accounts** — keep `AccountCard` grid (connection status + followers). Connect CTA can remain visual for BUILD.
2. **Calendar + Create Post** — keep `SocialCalendar` + `CreatePostModal`.
3. **Cut:** the 4 social performance `MarketingMetricCard`s on this tab (Overview owns the slim roll-up; avoid triple-counting).

Social posts may optionally link to a Campaign ID later; not required for BUILD.

**Data notes:** posts and schedule entered here; follower counts are platform-sourced (mock until real integrations).

---



### Cut list (summary)


| Cut                                                                                | Reason                                    |
| ---------------------------------------------------------------------------------- | ----------------------------------------- |
| Content tab                                                                        | Empty placeholder; not MVP                |
| Analytics tab                                                                      | Empty; KPIs live on Overview + Campaigns  |
| Website / landing pages tab + builder modal                                        | CMS/page-builder is a different product   |
| Ads tab + platform cards + Create Ad                                               | Paid-ad OAuth/ROAS out of MVP             |
| Email tab (as standalone)                                                          | Merged into Campaigns                     |
| SMS/WhatsApp tab (as standalone)                                                   | Merged into Campaigns + thin health strip |
| Optimal Timing tab (as standalone)                                                 | Merged into Outreach                      |
| Dashboard KPIs: ads, content, traffic, social reach, ROI card                      | Tied to cut surfaces or vanity            |
| Quick actions: blog, report, analytics, create ad                                  | Dead or point at cut tabs                 |
| 8-step campaign wizard steps 3–8                                                   | Unbuilt theater; replace with 4-step flow |
| Orphan duplicate components under `marketing/` and unused `optimal_timing/*` trees | Cleanup in BUILD — do not surface         |


---



### Renames


| Where            | From (en)                                     | To (en)                                                | To (ar) suggestion | Why                                                                                       |
| ---------------- | --------------------------------------------- | ------------------------------------------------------ | ------------------ | ----------------------------------------------------------------------------------------- |
| Tab              | Dashboard                                     | Overview                                               | نظرة عامة          | Matches other restructured pages; not a second analytics suite                            |
| Tab              | Smart Messaging                               | *(removed)*                                            | —                  | Folded into Outreach                                                                      |
| Tab              | Optimal Timing                                | *(removed)*                                            | —                  | Folded into Outreach                                                                      |
| New tab          | —                                             | Outreach                                               | التواصل المخصص     | Single job: personalized timed donor contact                                              |
| Page title key   | `digital_marketing.title` (currently "Title") | Digital Marketing                                      | التسويق الرقمي     | Keep product name; fix placeholder string in BUILD |
| Campaigns column | *(add)* Channel                               | Channel                                                | القناة             | Needed after merge                                                                        |
| Wizard           | 8-step labels                                 | 4-step: Basics / Audience / Channel & content / Review | matching ar        | Match reworked flow                                                                       |


Translation namespaces to keep in sync (`ar` + `en`):

- `digital_marketing` — retitle tabs; remove keys for cut tabs or leave unused until cleanup; add Outreach section keys (or reuse/move from `smart_messaging`)
- `smart_messaging` — remains the namespace for Outreach copy (BUILD can keep importing it under the Outreach tab)
- Optimal Timing inline `localTranslations` — **migrate into** `digital_marketing` or `smart_messaging` so RTL/i18n is consistent (no inline dictionaries)

---



### Data ownership cheat-sheet (BUILD ↔ ACTIVATE)


| Data                                                      | Entered on this page?  | Source of truth                                        |
| --------------------------------------------------------- | ---------------------- | ------------------------------------------------------ |
| Campaigns (name, channel, dates, status, content, budget) | Yes                    | This module                                            |
| Campaign send metrics                                     | Computed               | This module (from sends)                               |
| Social posts / schedule                                   | Yes                    | This module                                            |
| Outreach generated messages                               | Yes (AI-assisted)      | This module                                            |
| Message templates / purposes                              | Yes (or seeded config) | This module                                            |
| Donor list, segments inputs, engagement, last contact     | No (select only)       | Donors                                                 |
| Optimal timing signals                                    | No (computed/read)     | Derived from Donors + Donations + prior communications |
| Digital donations total                                   | No                     | Financials / Donations                                 |
| Ad platforms, landing pages, blog posts                   | —                      | Cut; N/A                                               |


---



## Decisions (resolved open questions)

1. **Page name:** Keep **Digital Marketing** / التسويق الرقمي.
2. **Ads:** **Cut** entirely for MVP — no platform cards, no "coming soon" panel.
3. **Website / donation pages:** **Cut** entirely — no page builder, no lightweight URL register.
4. **Outreach vs Donors:** Ready-to-contact **queue on this page** is the primary surface; donor detail keeps only a summary / deep-link target.
5. **SMS/WhatsApp depth:** **Channel health strip** on Campaigns is enough — no WhatsApp template-approval UI in MVP.
6. **Campaign budget/spend:** **Keep** budget fields on Campaigns for BUILD mock (spend can stay 0 / mock until Financials attribution exists).

---

## Ready for BUILD

Spec is approved with the decisions above. Next step: run `PAGE_BUILD_PROMPT.md` against this page.

