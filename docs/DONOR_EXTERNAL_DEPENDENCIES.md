# Individual Donors — External Page Dependencies

Components on the Individual Donors page (`DonorManagement` / `donors_individual`) and their data sources after production wiring.

## Wired on this page (API-backed)

| Component | Data source |
|-----------|-------------|
| Registry list / cards | `GET /donors` via `useDonors` |
| Registry KPIs | Derived from `useDonors` |
| Kanban / pipeline board | `custom_fields.pipeline_stage` on donor records; drag → `PATCH /donors/:id` |
| Add donor modal | `POST /donors` via `useCreateDonor` |
| Donor detail (all tabs) | `/donors/:id`, profile-summary, donations, tasks, interactions, documents |
| Pipeline + ask (Giving tab) | `PATCH /donors/:id` (`pipeline_stage`, `ask_amount`) |
| Log interaction | `POST /donors/:id/interactions` |
| Send email modal | Logs `email` interaction via `POST /donors/:id/interactions` (no mail provider yet) |
| Analytics tab | `useDonors` / donor_category from API |

## Depends on other pages — wire after those pages are ready

| Component / feature | Expected external source | Provider status | Action for you |
|---------------------|-------------------------|-----------------|----------------|
| **Giving history from Financials** | Donations recorded in Financials (`donation_records` / `POST /financials/transactions`) should appear on donor Giving tab | Financials API exists; **not synced** to donor `donations` table | Wire Financials → `donations` insert + `refreshDonorGivingCache`, or read financials donations filtered by `donor_id` in profile hook |
| **Real email delivery** | Mail provider (SendGrid, SES, etc.) | **Not implemented** | Replace interaction-only logging in `SendEmailModal` when mail service exists |
| **Donor category intelligence** | Auto-classification (Hero, Recurring, etc.) from gift patterns | Backend stores `donor_category` but **no compute job**; was frontend-only on mocks | Optional: port `classifyAndEnrichDonor` to API job or run after donation sync |

## Not used by Individual Donors (no blocker)

- Institutional Donors page (separate module, no backend yet)
- Projects catalog (not imported by individual donors UI)
- Kanban localStorage pipeline (`mss2-erp-donors-data`) — removed

## Cross-tab sync (implemented)

- **Canonical fields:** `custom_fields.pipeline_stage`, `custom_fields.ask_amount`, `custom_fields.stage_entered_at`
- **Kanban drag** and **Giving tab save** both PATCH the same donor record and invalidate `['donors']` + profile queries.
- **Registry list** reads the same `useDonors` cache, so stage/ask updates appear after invalidation without mock merge logic.
