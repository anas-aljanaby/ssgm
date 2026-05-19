# Financials Page — Backend Build Plan

## Context
The financials page has 9 tabs built with mock data. We need a fully working backend so every button and workflow is functional end-to-end. This is the first backend page (no dependencies on other pages), so it also establishes patterns for future pages.

---

## Phase 1: Database Schema (Drizzle)
**File:** `apps/api/src/db/schema.ts`

Add these tables following the existing pattern (org_id FK, custom_fields JSONB, timestamps):

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `financial_transactions` | Spine table — all money movement | date, description_en/ar, amount (numeric 12,2), currency, direction, category, status, reference, related_entity_type/name, notes, approved_by/date, posted_by/date, attachments count |
| `transaction_documents` | Receipts/docs attached to transactions | transaction_id FK, filename, file_url, content_type, size_bytes |
| `financial_pledges` | Donor commitments | donor_name, pledge_date, total_amount, paid_amount, status, frequency, next_due_date |
| `pledge_installments` | Individual pledge payments | pledge_id FK, due_date, amount, paid_amount, paid_date, status |
| `project_budgets` | Per-project budget headers | project_id, project_name, fiscal_year, total_planned/actual/committed, status |
| `budget_lines` | Line items within a budget | budget_id FK, category, planned/committed/actual amounts |
| `disbursements` | Outgoing payments (aid, scholarships, etc.) | beneficiary, type, amount, method, project_id/name, status, scheduled_date |
| `funds` | Organizational fund accounts | name (en/ar), type (unrestricted/temp/perm restricted), balance, total_received/spent/committed |
| `grants` | Incoming grants | grant_number, grantor, title, total_amount, received_amount, start/end date, status |
| `grant_installments` | Grant payment schedule | grant_id FK, installment_number, amount, expected_date, received_amount, received_date, status |
| `approval_items` | Approval queue entries | type, description (en/ar), amount, requested_by, current_step/total_steps, status, priority, due_date, reference_id/type |
| `financial_reports` | Report metadata | type, title (en/ar), description, format, last_generated, period, file_url |

---

## Phase 2: Zod Validation Schemas
**File:** `packages/shared/src/schemas/financials.ts`

Follow donor pattern: base schema -> create schema (omit id/org_id/computed) -> update schema (partial).

Schemas needed:
- `createTransactionSchema` / `updateTransactionSchema`
- `createPledgeSchema` / `createPledgeInstallmentSchema`
- `createBudgetSchema` / `createBudgetLineSchema`
- `createDisbursementSchema`
- `approvalActionSchema` (approve/reject with optional notes)
- `generateReportSchema` (type + period)

---

## Phase 3: API Routes
**File:** `apps/api/src/routes/financials.ts`
**Register in:** `apps/api/src/index.ts` as `app.route('/financials', financialsRouter)`

### Transactions (full CRUD + file upload)
```
GET    /financials/transactions          — list with filters (status, direction, category, search)
POST   /financials/transactions          — create (multipart for receipt upload)
GET    /financials/transactions/:id      — get single
PATCH  /financials/transactions/:id      — update (status transitions, edits)
DELETE /financials/transactions/:id      — soft delete (void)
```

### Donations (read-only view over transactions)
```
GET    /financials/donations             — list donations (transactions with category=donation + donor info)
```
> Donations are transactions with category='donation'. The donations tab is a *view* over transactions joined with donor info. No separate CRUD needed.

### Pledges
```
GET    /financials/pledges               — list with installments
POST   /financials/pledges               — create pledge
PATCH  /financials/pledges/:id           — update
POST   /financials/pledges/:id/payments  — record installment payment (creates a transaction too)
```

### Budgets
```
GET    /financials/budgets               — list all project budgets
GET    /financials/budgets/:id           — get with line items
POST   /financials/budgets               — create budget
PATCH  /financials/budgets/:id           — update budget/lines
```

### Disbursements
```
GET    /financials/disbursements         — list with filters
POST   /financials/disbursements         — create (auto-creates approval item)
PATCH  /financials/disbursements/:id     — update status
```

### Funds
```
GET    /financials/funds                 — list all funds with balances
POST   /financials/funds                 — create fund
PATCH  /financials/funds/:id             — update
```

### Grants
```
GET    /financials/grants                — list with installments
POST   /financials/grants                — create grant
PATCH  /financials/grants/:id            — update
POST   /financials/grants/:id/receive    — record installment receipt (creates transaction)
```

### Approvals (workflow)
```
GET    /financials/approvals             — list pending/recent
POST   /financials/approvals/:id/approve — approve (advances step or completes)
POST   /financials/approvals/:id/reject  — reject with notes
```
> Approvals originate FROM this page:
> - Creating a disbursement -> auto-creates an approval item
> - Budget amendments -> auto-creates an approval item
> - Approving a disbursement -> updates disbursement status -> creates a transaction
> Full loop is in-scope.

### Reports
```
GET    /financials/reports               — list report types with last-generated info
POST   /financials/reports/:type/generate — generate report (queries real data, creates file)
GET    /financials/reports/:type/download — download generated file
```

### Overview (aggregation)
```
GET    /financials/overview              — returns KPIs, monthly summaries, recent transactions, alerts
```

---

## Phase 4: Frontend Integration

### New hooks (one per entity, following useTransactions pattern)
**Directory:** `apps/web/src/hooks/`

| Hook file | Hooks exported |
|-----------|---------------|
| `useTransactions.ts` | already exists, flip USE_API -> true |
| `useDonations.ts` | `useDonations()` |
| `usePledges.ts` | `usePledges()`, `useRecordPledgePayment()` |
| `useBudgets.ts` | `useBudgets()` |
| `useDisbursements.ts` | `useDisbursements()`, `useCreateDisbursement()` |
| `useFunds.ts` | `useFunds()` |
| `useGrants.ts` | `useGrants()`, `useReceiveGrantInstallment()` |
| `useApprovals.ts` | `useApprovals()`, `useApproveItem()`, `useRejectItem()` |
| `useReports.ts` | `useReports()`, `useGenerateReport()` |
| `useFinancialOverview.ts` | `useFinancialOverview()` |

### Tab component updates
Each tab switches from `MOCK_*` imports to its hook.

### Additional frontend work needed
- **ApprovalsTab**: Wire approve/reject buttons to mutations (currently local state only)
- **ReportsTab**: Wire Generate/Download buttons to actual API calls
- **DisbursementsTab**: Add "Create Disbursement" button + modal (triggers approval workflow)
- **PledgesTab**: Add "Record Payment" action per pledge row
- **GrantsFundsTab**: Add "Receive Installment" action per grant
- **BudgetsTab**: Ensure project selector works with real data

---

## Phase 5: Workflow Completeness

| Workflow | Origin | In-scope? | Plan |
|----------|--------|-----------|------|
| Create transaction | Transactions tab "Add Transaction" | Yes | Already built. Wire to API. |
| Create donation | Transactions tab (category=donation) | Yes | Donation = transaction. Donations tab is a view. |
| Record pledge payment | Pledges tab action button | Yes | Build. Creates installment record + transaction. |
| Create disbursement | Disbursements tab (new button) | Yes | Build. Auto-creates approval item. |
| Approve/reject items | Approvals tab buttons | Yes | Wire to API. On approve: update source entity. |
| Disbursement -> Approval -> Transaction | Approvals tab | Yes | Full loop built in-scope. |
| Grant installment receipt | Grants tab action | Yes | Build. Creates transaction + updates grant. |
| Generate/download reports | Reports tab buttons | Yes | Build. Server-side generation. |
| Budget creation/amendment | Budgets tab | Yes | Build. Amendments trigger approval items. |
| Fund balance updates | Automatic from transactions | Yes | When transaction posts, update fund balance. |
| Overview KPIs | Overview tab | Yes | Aggregation endpoint. |

### Out-of-scope stubs
1. **Donor page deep links** — Related Entity shows name but doesn't link to donor profile
2. **Project CRUD** — Budgets reference projects by name; no project creation
3. **Beneficiary CRUD** — Disbursements reference beneficiaries by name
4. **Email notifications** — Approval workflow won't send emails
5. **PDF/XLSX report export** — Will generate CSV reports; rich formats deferred

---

## Implementation Order

Build incrementally, test each piece before moving on:

1. **Schema + Migrations** — All tables at once
2. **Transactions CRUD** — Core table, test with existing modal
3. **Overview endpoint** — Aggregates transaction data
4. **Pledges + Payments** — Includes creating transactions from payments
5. **Disbursements + Approvals** — The approval workflow loop
6. **Funds + Grants** — Fund balance tracking, grant installment receipts
7. **Budgets** — Project budget display + line items
8. **Donations view** — Filtered transaction query + donor name join
9. **Reports** — Generation + download
10. **Final integration** — Flip all USE_API flags, full regression test

---

## Testing Approach
- Test each phase in the browser after implementation
- Verify cross-tab: create transaction -> appears in Overview
- Verify workflow: create disbursement -> approval appears -> approve -> disbursement status changes -> transaction created
- Verify data consistency: fund balances update when transactions post
- Seed initial data so tabs aren't empty on first load
