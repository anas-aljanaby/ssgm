# Implementing Partners — Full Page Audit (Phase 0)

**Status:** Audit complete — implementation not started  
**Last updated:** 2026-06-12  
**Entry point:** `apps/web/src/components/pages/ImplementingPartnersPage.tsx`  
**Data hook:** `apps/web/src/hooks/usePartners.ts` → `GET/PATCH/POST/DELETE /implementing-partners`  
**DB table:** `implementing_partners` (no `partner_documents`, `partner_evaluations`, or project FK yet)

Use this document as the implementation checklist. Work tab-by-tab; check off items as you complete them.

---

## Component tree

```
ImplementingPartnersPage
├── PartnerAnalytics (list only)
├── PartnerCard / PartnerCardSkeleton
├── PartnerDetailView
│   ├── Header (logo, name, country, sector)
│   ├── OverviewTab
│   ├── ProjectsTab (+ ProjectCard, link modal)
│   ├── PerformanceTab (+ EvaluationRecordCard, add modal)
│   ├── DocumentsTab (+ folder modal, delete confirm)
│   └── ContactTab (+ ContactPersonCard, AddContactModal)
├── AddPartnerWizard (+ StepIndicator, SuccessScreen)
└── shared: EditActions, fieldClass
```

**Static data file:** `apps/web/src/components/pages/implementing_partners/partnerStaticData.ts`
- `MOCK_PARTNER_PROJECTS`
- `MOCK_PARTNER_REVIEWS`
- `MOCK_EVALUATION_KPIS`
- `MOCK_PARTNER_DOCUMENTS`

---

## Backend infrastructure

| Capability | Status | Notes |
|------------|--------|-------|
| `implementing_partners` CRUD | ✅ Live | Full REST + Zod in `packages/shared/src/schemas/partner.ts` |
| `contacts` JSONB on partner | ✅ | Via PATCH |
| `rating`, `budget`, project counts | ✅ | Stored columns, not aggregated from projects |
| `description` | ✅ DB | Not on frontend `Partner` type |
| `coordinates` | ✅ DB | Not used in UI (placeholder map) |
| `custom_fields` | ✅ DB + seed | Not mapped to frontend |
| Partner documents table + storage | ❌ | Donor pattern exists (`donor_documents`, `institutional_donor_documents`) |
| Partner evaluations table | ❌ | |
| Projects ↔ partner link | ❌ | `projects.implementing_partner` is free text, no FK |
| `useProjects` API | ✅ Live | Projects module has real API; Partners Projects tab does not use it |
| Delete partner UI | ❌ | `useDeletePartner` exists, unused |
| Export list | ❌ | Button only, no handler |

---

## 1. List view (`ImplementingPartnersPage`)

### Page chrome (breadcrumb, title, subtitle)

| Field | Category | Source | Pipeline | Editable |
|-------|----------|--------|----------|----------|
| Breadcrumb / title / subtitle | Static/Config | i18n | — | — |

### Error banner

| Field | Category | Source | Pipeline | Editable |
|-------|----------|--------|----------|----------|
| Load error + retry | Computed | `usePartners` error state | ✅ Real | Retry refetches API |

### `PartnerAnalytics`

| KPI | Category | Source | Pipeline | Notes |
|-----|----------|--------|----------|-------|
| Total partners | Computed | `partners.length` | ✅ From API list | |
| Active partners | Computed | `status === 'نشط'` | ✅ | |
| Pending review | Computed | `status === 'قيد المراجعة'` | ✅ | |
| Avg performance | Computed | Mean of `partner.rating` | ✅ | Ratings are seed/manual unless changed on Performance tab |

**Status:** ✅ **Live** — aggregates real partner list data.

### Search & filters

| Control | Category | Source | Pipeline | Notes |
|---------|----------|--------|----------|-------|
| Search | Client filter | `partners` from API | ✅ | Name, country, sector |
| Sector / status filters | Static/Config + filter | Enum values + API data | ✅ | |
| Country filter | Computed options | Distinct `partner.country` from API | ✅ | |
| Performance filter | Client filter | `partner.rating` thresholds | ✅ | |
| Export list | — | — | ❌ **Not implemented** | No `onClick` |
| Register partner | Navigation | — | ✅ Opens wizard | |
| Grid/list toggle | UI state | Local | — | |

### `PartnerCard`

| Field | Category | Source | Pipeline | Editable |
|-------|----------|--------|----------|----------|
| Logo | Computed | From name / DB `logo` | ✅ | No UI |
| Name | Manual entry | API `name_en`/`name_ar` | ✅ | No on card |
| Country | Manual entry | API | ✅ | |
| Sector | Manual entry | API | ✅ | |
| Status badge | Manual entry | API | ✅ | |
| Projects completed | Manual entry (today) | `projects_completed` column | ⚠️ Seed/static, not from Projects module | |
| Projects in progress | Manual entry (today) | `projects_in_progress` column | ⚠️ Same | |
| Rating | Manual entry (today) | `rating` column | ⚠️ Partially updated from Performance tab | |
| Budget | Manual entry (today) | `budget` column | ⚠️ Not from project spend | |
| View profile | Navigation | — | ✅ | |

**Status:** ✅ Display wired to API; ⚠️ stat fields are not cross-module computed.

### Pagination

| Field | Category | Source | Pipeline |
|-------|----------|--------|----------|
| Page items | Client slice | Filtered `partners` | ✅ |

---

## 2. Add partner wizard (`AddPartnerWizard`)

### Step 1 — Basic

| Field | Category | Saved to API? | Pipeline | Notes |
|-------|----------|---------------|----------|-------|
| Organization name (AR) | Manual entry | ✅ `name_ar` | ✅ POST on submit | Required |
| Organization name (EN) | Manual entry | ✅ `name_en` | ✅ | Optional |
| Primary sector | Manual entry | ✅ `sector` | ✅ | |
| Description | Manual entry | ✅ `description` | ✅ | **Not shown anywhere in detail view** |

### Step 2 — Scope

| Field | Category | Saved? | Pipeline |
|-------|----------|--------|----------|
| Country | Manual entry | ✅ | ✅ Required |
| City | Manual entry | ✅ | ✅ |

### Step 3 — Contact

| Field | Category | Saved? | Pipeline | Notes |
|-------|----------|--------|----------|-------|
| Main phone | Manual entry | ✅ `phone` | ✅ | Org-level, not contact person |
| Official email | Manual entry | ✅ `email` | ✅ | Required in wizard |
| Website | Manual entry | ✅ `website` | ✅ | |

**Gap:** Wizard does not create `contacts[]` or a primary contact person.

### Step 4 — Documents

| Field | Category | Saved? | Pipeline |
|-------|----------|--------|----------|
| Uploaded files | Manual entry | ❌ | **Local `uploadedFiles` state only** — discarded on submit |

### Step 5 — Review + submit

| Field | Category | Saved? | Pipeline |
|-------|----------|--------|----------|
| Confirmation checkbox | UI gate | — | — |
| Reference number | Fake | ❌ | Client-generated `P-YYYY-XXXX`, not from DB |
| Status on success screen | Static | — | Always shows “pending review” |

### Wizard extras

| Feature | Status |
|---------|--------|
| Save draft | ❌ Toast only, no persistence |
| Create partner API | ✅ `useCreatePartner` |
| Default status | `قيد المراجعة` | ✅ |

---

## 3. Detail view header (`PartnerDetailView`)

| Field | Category | Source | Pipeline | Editable |
|-------|----------|--------|----------|----------|
| Logo | Computed / manual | API `logo` or initials | ✅ | ❌ No edit UI |
| Name | Manual entry | API bilingual names | ✅ | ❌ No edit UI |
| Country \| sector | Manual entry | API | ✅ | Editable on Overview only |
| Tab navigation | UI | Local state | — | — |

**Gap:** No edit for name, logo, or description in detail view.

---

## 4. Overview tab (`OverviewTab`)

### Card 1 — Status & sector (editable block)

| Field | Category | Source | Pipeline | Editable on Overview |
|-------|----------|--------|----------|----------------------|
| Status | Manual entry | API | ✅ PATCH | ✅ |
| Eligibility label | Computed | `status === 'نشط'` | Local | Via status only |
| Sector | Manual entry | API | ✅ PATCH | ✅ |
| Country/city | Manual entry | API | ✅ PATCH | ✅ (single text field) |

**Status:** ✅ **Fully implemented** for this card.

**Code:** `apps/web/src/components/pages/implementing_partners/tabs/OverviewTab.tsx`

### Card 2 — Contact & performance summary

| Field | Category | Source | Pipeline | Editable on Overview |
|-------|----------|--------|----------|----------------------|
| Primary contact | Cross-ref (same entity) | `partner.contacts` JSONB | ✅ | ❌ — edit on Contacts tab |
| Latest performance | Manual entry (today) | `partner.rating` | ✅ | ❌ — edit on Performance tab |

**Status:** ✅ Real read-only summary; edits intentionally on other tabs.

### Card 3 — Agreement & compliance

| Field | Category | Source | Pipeline | Editable |
|-------|----------|--------|----------|----------|
| Agreement status | Unresolvable (intended) | **Fake:** `status !== 'غير نشط'` | ❌ PLACEHOLDER | ❌ |
| Compliance status | Unresolvable (intended) | **Fake:** `status !== 'قيد المراجعة'` | ❌ PLACEHOLDER | ❌ |

**Note:** Seed has `custom_fields.agreement_status` / `due_diligence_status` in `apps/api/src/db/implementingPartnerSeed.ts` but frontend does not read them.

**Status:** ❌ **Not implemented** — placeholder logic only (see `PLACEHOLDER` comments in OverviewTab).

### Bottom KPI row

| Field | Category | Intended | Source today | Pipeline | Editable |
|-------|----------|----------|--------------|----------|----------|
| Active projects | Computed (intended) | Count from Projects | `projects_in_progress` column | ⚠️ Static/seed | ❌ |
| Completed projects | Computed (intended) | Count from Projects | `projects_completed` column | ⚠️ Static/seed | ❌ |
| Total budget | Computed (intended) | Sum project budgets | `budget` column | ⚠️ Static/seed | ❌ |

---

## 5. Projects tab (`ProjectsTab`)

**Critical gap:** Tab receives **no `partner` prop** — same mock data for every partner.

| Component / action | Category | Source | Pipeline | Persists? |
|--------------------|----------|--------|----------|-----------|
| Project list | Cross-module ref | `MOCK_PARTNER_PROJECTS` | ❌ Mock | ❌ Local state only |
| Status filter / sort | UI | Local | — | — |
| `ProjectCard` fields (name, status, sector, duration, budget, beneficiaries, location, progress) | Cross-module | Mock | ❌ | — |
| View details button | — | — | ❌ **No navigation** | — |
| Link project modal | Cross-module | `MOCK_PROJECTS` from `projectData.ts` | ❌ Legacy mock, not `useProjects` | ❌ Local state |
| Link submit | Manual | Maps mock project → local `PartnerProject` | ❌ | Lost on refresh |

**Available fix path:** `useProjects()` is live (`apps/web/src/hooks/useProjects.ts`); need `partnerId` prop + filter/link by `implementing_partner` (today text field — needs FK or ID wiring).

**Code:** `apps/web/src/components/pages/implementing_partners/tabs/ProjectsTab.tsx` — TODO at line 11.

**Status:** ❌ **Placeholder** — interactive UI, no real or per-partner data.

---

## 6. Performance tab (`PerformanceTab`)

| Component / field | Category | Source | Pipeline | Persists? |
|-------------------|----------|--------|----------|-----------|
| Overall score display | Computed | Local reviews OR `partnerRating` prop | ⚠️ Mixed | Rating only via parent PATCH |
| Add evaluation modal | Manual entry | Local form | ⚠️ | Reviews ❌; rating ✅ |
| Evaluation records list | Manual entry | `MOCK_PARTNER_REVIEWS` + local adds | ❌ Mock | ❌ Lost on remount; same mock for all partners |
| Criteria KPIs (5 bars) | Static/mock | `MOCK_EVALUATION_KPIS` | ❌ | ❌ |
| `onRatingChange` → parent | Manual entry | `partner.rating` | ✅ PATCH | ✅ |

**Status:** ⚠️ **Partial** — aggregate rating can persist; reviews and criteria are fully mock.

**Code:** `apps/web/src/components/pages/implementing_partners/tabs/PerformanceTab.tsx` — TODO at line 9.

---

## 7. Documents tab (`DocumentsTab`)

**Critical gap:** No `partner` prop — same mock documents for every partner.

| Component / action | Category | Source | Pipeline | Persists? |
|--------------------|----------|--------|----------|-----------|
| Document list | Manual entry (intended) | `MOCK_PARTNER_DOCUMENTS` | ❌ Mock | ❌ |
| Category filters | Static/Config | `PARTNER_DOCUMENT_CATEGORY_KEYS` | — | — |
| Upload file | Manual entry | Browser file → local state | ❌ | File not stored |
| New folder | Manual entry | Local state | ❌ | ❌ |
| Delete document | Manual entry | Local state | ❌ | ❌ |
| Preview | — | — | ❌ Toast placeholder | — |
| Download | — | — | ❌ Toast placeholder | — |
| Multi-select checkboxes | UI | Local | — | No bulk actions |

**Reference pattern:** `donor_documents` + `institutional_donor_documents` + Supabase storage in `apps/api/src/routes/donors.ts` and `institutionalDonors.ts`.

**Status:** ❌ **Placeholder** — UI complete, no API/storage.

**Code:** `apps/web/src/components/pages/implementing_partners/tabs/DocumentsTab.tsx` — TODO at line 15.

---

## 8. Contacts tab (`ContactTab`)

### Organization contact info block

| Field | Category | Source | Pipeline | Editable |
|-------|----------|--------|----------|----------|
| Phone | Manual entry | API `phone` | ✅ PATCH | ✅ |
| Email | Manual entry | API `email` | ✅ PATCH | ✅ |
| Website | Manual entry | API `website` | ✅ PATCH | ✅ |
| Address | Manual entry | API `address` | ✅ PATCH | ✅ |
| Map panel | Unresolvable | — | ❌ PLACEHOLDER | Shows “no location” always |

**Gap:** `coordinates` in DB/seed not used; map is static placeholder (line 224).

### Contact persons grid

| Field | Category | Source | Pipeline | Editable |
|-------|----------|--------|----------|----------|
| Name, position, email, phone | Manual entry | `contacts` JSONB | ✅ PATCH | ✅ Add via modal |
| Primary flag | Manual entry | `isPrimary` on contact | ✅ PATCH | ✅ On add |
| Photo | Manual entry | `photoUrl` or ui-avatars | ✅ | Via AddContactModal |
| Delete contact | Manual entry | `contacts` JSONB | ✅ PATCH | ✅ |
| Edit existing contact | — | — | ❌ **Not implemented** | Add/delete only |

**Status:** ✅ **Mostly live** — org info + contacts CRUD (no edit contact, no map/coordinates).

---

## 9. Shared primitives

| File | Role | Status |
|------|------|--------|
| `shared.tsx` — `EditActions` | Edit/save/cancel UI | ✅ Used by Overview + Contact |
| `shared.tsx` — `fieldClass` | Form styling | ✅ |
| `PartnerCardSkeleton` | Loading UI | ✅ |
| `partnerStaticData.ts` | Mock bundles | ❌ Placeholder data for 3 tabs |

---

## Data not surfaced anywhere in UI

| DB / API field | In seed? | Shown in UI? |
|----------------|----------|--------------|
| `description` | ✅ | ❌ (wizard saves, never displayed) |
| `coordinates` | ✅ | ❌ (placeholder map only) |
| `custom_fields` (agreement, due diligence, founded_year, etc.) | ✅ Rich seed | ❌ Not mapped to `Partner` type |
| `logo` | ✅ | Display only, no edit |
| `name_en` / `name_ar` | ✅ | Display as single `name`, no bilingual edit |

---

## Summary matrix by tab

| Tab / area | UI completeness | Data pipeline | Persistence |
|------------|-----------------|---------------|-------------|
| List + analytics | High | ✅ API | ✅ |
| Partner cards | High | ✅ API | ✅ (display) |
| Add wizard | High | ⚠️ Partial | ✅ core fields only; docs/draft fake |
| Detail header | Medium | ✅ API | ❌ no edit |
| Overview | High | ⚠️ Mixed | ✅ Card 1; ❌ Card 3; ⚠️ KPI row |
| Projects | High | ❌ Mock | ❌ |
| Performance | High | ❌ Mock + partial rating | ⚠️ Rating only |
| Documents | High | ❌ Mock | ❌ |
| Contacts | High | ✅ API | ✅ (minus map + contact edit) |

---

## Recommended implementation order

1. **Wire tab context** — Pass `partner` (at least `id`) into `ProjectsTab`, `DocumentsTab`, `PerformanceTab` from `PartnerDetailView`.
2. **Projects tab** — `useProjects` + link by partner ID; compute Overview KPIs from linked projects.
3. **Documents tab** — `partner_documents` table + storage (mirror institutional donors).
4. **Performance tab** — `partner_evaluations` table; derive `rating` from records; wire criteria or drop until product defines them.
5. **Overview Card 3** — Read `custom_fields` short-term, or real agreements/compliance module long-term.
6. **Detail gaps** — Name/description edit, coordinates/map, wizard document upload, delete partner, export.
7. **Schema** — Replace `projects.implementing_partner` text with `implementing_partner_id` FK.

---

## Implementation checklist (track progress here)

### Phase 1 — Frontend pass (interactive UI, real hooks where possible)

- [ ] Pass `partner` prop to Projects, Documents, Performance tabs
- [ ] Overview Card 3 — wire `custom_fields` or remove fake derivation
- [ ] Overview KPI row — prepare for computed values from projects hook
- [ ] Projects tab — replace mocks with `useProjects`, per-partner filter
- [ ] Performance tab — replace mock reviews; keep rating sync to parent
- [ ] Documents tab — prepare props/hooks for documents API
- [ ] Contact tab — map/coordinates panel; edit existing contact
- [ ] Detail header — edit name (bilingual), description
- [ ] Wizard — persist documents step or mark clearly deferred
- [ ] List — export handler; delete partner flow

### Phase 2 — Backend pass

- [ ] `partner_documents` table + routes + storage
- [ ] `partner_evaluations` table + routes
- [ ] `projects.implementing_partner_id` FK + migration from text field
- [ ] Aggregate endpoints or computed fields for partner project stats
- [ ] Map `custom_fields` + `description` on frontend `Partner` type

### Phase 3 — Verification

- [ ] `npm run build:web` — zero errors
- [ ] Create partner → persists → refresh shows from DB
- [ ] Edit Overview Card 1 → persists
- [ ] Contacts add/delete → persists; Overview primary contact updates
- [ ] Link project → persists and is per-partner
- [ ] Upload document → persists with preview/download
- [ ] Add evaluation → persists; rating updates Overview + list card
- [ ] Arabic / English + RTL smoke check

---

## Key file references

| Purpose | Path |
|---------|------|
| Page entry | `apps/web/src/components/pages/ImplementingPartnersPage.tsx` |
| Detail + tabs shell | `apps/web/src/components/pages/implementing_partners/PartnerDetailView.tsx` |
| Hooks | `apps/web/src/hooks/usePartners.ts` |
| API routes | `apps/api/src/routes/implementingPartners.ts` |
| DB schema | `apps/api/src/db/schema.ts` → `implementing_partners` |
| Zod schemas | `packages/shared/src/schemas/partner.ts` |
| Seed data | `apps/api/src/db/implementingPartnerSeed.ts` |
| Mock static data | `apps/web/src/components/pages/implementing_partners/partnerStaticData.ts` |
| Projects hook (live) | `apps/web/src/hooks/useProjects.ts` |
| Donor documents reference | `apps/api/src/routes/institutionalDonors.ts` |
| Activation process | `PAGE_ACTIVATION_PROMPT.md` |
