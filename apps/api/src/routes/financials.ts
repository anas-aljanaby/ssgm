import { Hono } from 'hono';
import { User } from '@supabase/supabase-js';
import { and, desc, eq, ilike, or } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { db } from '../db';
import {
    financial_transactions, transaction_attachments, donation_records,
    financial_pledges, pledge_installments, project_budgets, budget_lines,
    disbursements, funds, grants, grant_installments,
    approval_items, financial_reports, financial_alerts,
    donations, individual_donors,
} from '../db/schema';
import { authMiddleware } from '../middleware/auth';
import { OrgContextVars, orgContext } from '../middleware/orgContext';
import {
    createTransactionSchema, updateTransactionSchema,
    createPledgeSchema, updatePledgeSchema,
    createBudgetSchema, updateBudgetSchema, createBudgetLineSchema, updateBudgetLineSchema,
    createDisbursementSchema, updateDisbursementSchema,
    createFundSchema, updateFundSchema,
    createGrantSchema, updateGrantSchema,
    approveRejectSchema,
} from '@gms/shared';

const financialsRouter = new Hono<{ Variables: OrgContextVars }>();
financialsRouter.use(authMiddleware);
financialsRouter.use(orgContext);

// ── Helpers ────────────────────────────────────────────────────────────────

function asNumber(v: unknown): number {
    if (v === null || v === undefined) return 0;
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
}

function toIso(v: Date | string | null | undefined): string | null {
    if (!v) return null;
    return v instanceof Date ? v.toISOString() : new Date(v).toISOString();
}



const FINANCIAL_UPLOAD_DIR = process.env.FINANCIAL_UPLOAD_DIR || path.resolve(process.cwd(), 'uploads', 'financial-documents');
const FINANCIAL_UPLOAD_PUBLIC_PATH = '/uploads/financial-documents';

function getRecord(value: unknown): Record<string, unknown> {
    return value && typeof value === 'object' && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : {};
}

function getString(value: unknown): string | null {
    return typeof value === 'string' && value.trim() ? value : null;
}

async function refreshDonorGivingCacheFromDonations(orgId: string, donorId: string) {
    const donationRows = await db
        .select()
        .from(donations)
        .where(and(eq(donations.org_id, orgId), eq(donations.donor_id, donorId)));

    const totalAmount = donationRows.reduce((sum, row) => sum + asNumber(row.amount), 0);
    const donationCount = donationRows.length;
    const lastDonationDate = donationRows
        .map((row) => row.date)
        .sort((a, b) => b.getTime() - a.getTime())[0] || null;

    await db.update(individual_donors).set({
        total_donations: totalAmount.toFixed(2),
        donations_count: donationCount,
        last_donation_date: lastDonationDate,
        avg_gift: donationCount > 0 ? (totalAmount / donationCount).toFixed(2) : null,
    }).where(and(eq(individual_donors.id, donorId), eq(individual_donors.org_id, orgId)));
}

// ── Mapper functions ───────────────────────────────────────────────────────
// These convert DB snake_case rows to the camelCase frontend type contract.

type TransactionRow = typeof financial_transactions.$inferSelect;
type DonationRecordRow = typeof donation_records.$inferSelect;
type PledgeRow = typeof financial_pledges.$inferSelect;
type PledgeInstallmentRow = typeof pledge_installments.$inferSelect;
type BudgetRow = typeof project_budgets.$inferSelect;
type BudgetLineRow = typeof budget_lines.$inferSelect;
type DisbursementRow = typeof disbursements.$inferSelect;
type FundRow = typeof funds.$inferSelect;
type GrantRow = typeof grants.$inferSelect;
type GrantInstallmentRow = typeof grant_installments.$inferSelect;
type ApprovalRow = typeof approval_items.$inferSelect;
type ReportRow = typeof financial_reports.$inferSelect;
type AlertRow = typeof financial_alerts.$inferSelect;

function mapTransaction(r: TransactionRow) {
    return {
        id: r.id,
        date: toIso(r.date)!,
        description: { en: r.description_en, ar: r.description_ar || '' },
        amount: asNumber(r.amount),
        currency: r.currency,
        direction: r.direction as 'inflow' | 'outflow',
        category: r.category,
        status: r.status,
        reference: r.reference || '',
        relatedEntityId: r.related_entity_id || undefined,
        relatedEntityType: r.related_entity_type || undefined,
        relatedEntityName: r.related_entity_name || undefined,
        accountCode: r.account_code || undefined,
        fundId: r.fund_id || undefined,
        bankAccountId: r.bank_account_id || undefined,
        approvedBy: r.approved_by || undefined,
        approvedDate: toIso(r.approved_date) || undefined,
        postedBy: r.posted_by || undefined,
        postedDate: toIso(r.posted_date) || undefined,
        notes: r.notes || undefined,
        attachments: r.attachments_count ?? 0,
    };
}

function mapDonationRecord(r: DonationRecordRow) {
    return {
        id: r.id,
        donorId: r.donor_id,
        donorName: { en: r.donor_name_en, ar: r.donor_name_ar || '' },
        donorType: r.donor_type as 'individual' | 'institutional',
        date: toIso(r.date)!,
        amount: asNumber(r.amount),
        currency: r.currency,
        method: r.method,
        designation: r.designation || undefined,
        projectId: r.project_id || undefined,
        projectName: r.project_name_en ? { en: r.project_name_en, ar: r.project_name_ar || '' } : undefined,
        fundId: r.fund_id || undefined,
        campaignId: r.campaign_id || undefined,
        campaignName: r.campaign_name || undefined,
        receiptId: r.receipt_id || undefined,
        receiptStatus: r.receipt_status,
        receiptNumber: r.receipt_number || undefined,
        isRecurring: r.is_recurring,
        recurringFrequency: r.recurring_frequency || undefined,
        notes: r.notes || undefined,
        transactionId: r.transaction_id || '',
    };
}

function mapPledgeInstallment(r: PledgeInstallmentRow) {
    return {
        id: r.id,
        dueDate: toIso(r.due_date)!,
        amount: asNumber(r.amount),
        paidAmount: asNumber(r.paid_amount),
        paidDate: toIso(r.paid_date) || undefined,
        status: r.status as 'pending' | 'paid' | 'overdue' | 'partial',
        transactionId: r.transaction_id || undefined,
    };
}

function mapPledge(r: PledgeRow, installments: PledgeInstallmentRow[] = []) {
    return {
        id: r.id,
        donorId: r.donor_id,
        donorName: { en: r.donor_name_en, ar: r.donor_name_ar || '' },
        donorType: r.donor_type as 'individual' | 'institutional',
        pledgeDate: toIso(r.pledge_date)!,
        totalAmount: asNumber(r.total_amount),
        paidAmount: asNumber(r.paid_amount),
        currency: r.currency,
        status: r.status,
        designation: r.designation || undefined,
        projectId: r.project_id || undefined,
        projectName: r.project_name_en ? { en: r.project_name_en, ar: r.project_name_ar || '' } : undefined,
        fundId: r.fund_id || undefined,
        startDate: toIso(r.start_date)!,
        endDate: toIso(r.end_date)!,
        frequency: r.frequency,
        installments: installments.map(mapPledgeInstallment),
        notes: r.notes || undefined,
    };
}

function mapBudgetLine(r: BudgetLineRow) {
    const planned = asNumber(r.planned);
    const actual = asNumber(r.actual);
    const committed = asNumber(r.committed);
    const variance = planned - actual;
    const variancePercent = planned > 0 ? (variance / planned) * 100 : 0;
    return {
        id: r.id,
        accountCode: r.account_code,
        accountName: { en: r.account_name_en, ar: r.account_name_ar || '' },
        category: r.category,
        planned,
        actual,
        committed,
        variance,
        variancePercent,
    };
}

function mapBudget(r: BudgetRow, lines: BudgetLineRow[] = []) {
    return {
        id: r.id,
        projectId: r.project_id,
        projectName: { en: r.project_name_en, ar: r.project_name_ar || '' },
        fiscalYear: r.fiscal_year,
        totalPlanned: asNumber(r.total_planned),
        totalActual: asNumber(r.total_actual),
        totalCommitted: asNumber(r.total_committed),
        currency: r.currency,
        status: r.status,
        lines: lines.map(mapBudgetLine),
        lastUpdated: toIso(r.updated_at) || toIso(r.created_at)!,
    };
}

function mapDisbursement(r: DisbursementRow) {
    return {
        id: r.id,
        beneficiaryId: r.beneficiary_id,
        beneficiaryName: { en: r.beneficiary_name_en, ar: r.beneficiary_name_ar || '' },
        type: r.type,
        amount: asNumber(r.amount),
        currency: r.currency,
        status: r.status,
        scheduledDate: toIso(r.scheduled_date)!,
        processedDate: toIso(r.processed_date) || undefined,
        projectId: r.project_id || undefined,
        projectName: r.project_name_en ? { en: r.project_name_en, ar: r.project_name_ar || '' } : undefined,
        fundId: r.fund_id || undefined,
        method: r.method,
        approvedBy: r.approved_by || undefined,
        notes: r.notes || undefined,
        transactionId: r.transaction_id || undefined,
    };
}

function mapFund(r: FundRow) {
    return {
        id: r.id,
        name: { en: r.name_en, ar: r.name_ar || '' },
        type: r.type,
        balance: asNumber(r.balance),
        currency: r.currency,
        donorRestriction: r.donor_restriction || undefined,
        projectId: r.project_id || undefined,
        projectName: r.project_name_en ? { en: r.project_name_en, ar: r.project_name_ar || '' } : undefined,
        institutionalDonorId: r.institutional_donor_id || undefined,
        institutionalDonorName: r.institutional_donor_name || undefined,
        startDate: toIso(r.start_date)!,
        endDate: toIso(r.end_date) || undefined,
        totalReceived: asNumber(r.total_received),
        totalSpent: asNumber(r.total_spent),
        totalCommitted: asNumber(r.total_committed),
    };
}

function mapGrantInstallment(r: GrantInstallmentRow) {
    return {
        id: r.id,
        dueDate: toIso(r.due_date)!,
        amount: asNumber(r.amount),
        receivedAmount: asNumber(r.received_amount),
        receivedDate: toIso(r.received_date) || undefined,
        status: r.status as 'pending' | 'received' | 'overdue',
    };
}

function mapGrant(r: GrantRow, installments: GrantInstallmentRow[] = []) {
    return {
        id: r.id,
        grantorId: r.grantor_id,
        grantorName: r.grantor_name,
        grantNumber: r.grant_number,
        title: { en: r.title_en, ar: r.title_ar || '' },
        totalAmount: asNumber(r.total_amount),
        receivedAmount: asNumber(r.received_amount),
        currency: r.currency,
        startDate: toIso(r.start_date)!,
        endDate: toIso(r.end_date)!,
        status: r.status,
        fundId: r.fund_id,
        projectId: r.project_id || undefined,
        projectName: r.project_name_en ? { en: r.project_name_en, ar: r.project_name_ar || '' } : undefined,
        installments: installments.map(mapGrantInstallment),
        reportingRequirements: r.reporting_requirements || undefined,
    };
}

function mapApproval(r: ApprovalRow) {
    const customFields =
        typeof r.custom_fields === 'object' && r.custom_fields && !Array.isArray(r.custom_fields)
            ? (r.custom_fields as Record<string, unknown>)
            : {};

    return {
        id: r.id,
        type: r.type,
        title: r.title,
        description: r.description,
        amount: asNumber(r.amount),
        currency: r.currency,
        requestedBy: r.requested_by,
        requestedDate: toIso(r.requested_date)!,
        priority: r.priority,
        status: r.status,
        relatedEntityId: r.related_entity_id || undefined,
        relatedEntityName: r.related_entity_name || undefined,
        currentStep: r.current_step,
        totalSteps: r.total_steps,
        workflowId: r.workflow_id,
        dueDate: toIso(r.due_date) || undefined,
        metadata: {
            beneficiaryNameEn: typeof customFields.beneficiary_name_en === 'string' ? customFields.beneficiary_name_en : undefined,
            beneficiaryNameAr: typeof customFields.beneficiary_name_ar === 'string' ? customFields.beneficiary_name_ar : undefined,
            disbursementType: typeof customFields.disbursement_type === 'string' ? customFields.disbursement_type : undefined,
            beneficiaryId: typeof customFields.beneficiary_id === 'string' ? customFields.beneficiary_id : undefined,
        },
    };
}

function mapReport(r: ReportRow) {
    return {
        id: r.id,
        type: r.type,
        name: { en: r.name_en, ar: r.name_ar || '' },
        description: { en: r.description_en, ar: r.description_ar || '' },
        lastGenerated: toIso(r.last_generated) || undefined,
        format: r.format,
        period: r.period || undefined,
    };
}

function mapAlert(r: AlertRow) {
    return {
        id: r.id,
        type: r.type,
        message: { en: r.message_en, ar: r.message_ar || '' },
        date: toIso(r.date)!,
        relatedEntityId: r.related_entity_id || undefined,
        actionRequired: r.action_required,
    };
}

function derivePledgeStatus(totalAmount: number, paidAmount: number, installments: PledgeInstallmentRow[]): string {
    if (paidAmount >= totalAmount) return 'fulfilled';
    const now = new Date();
    const hasOverdue = installments.some((inst) => inst.status !== 'paid' && new Date(inst.due_date) < now);
    if (hasOverdue) return 'overdue';
    if (paidAmount > 0) return 'partially_fulfilled';
    return 'active';
}

function deriveGrantStatus(totalAmount: number, receivedAmount: number): string {
    if (receivedAmount >= totalAmount) return 'completed';
    if (receivedAmount > 0) return 'active';
    return 'pending';
}

// ═══════════════════════════════════════════════════════════════════════════
// OVERVIEW
// ═══════════════════════════════════════════════════════════════════════════

financialsRouter.get('/overview', async (c) => {
    const orgId = c.get('orgId');

    const [txnRows, pledgeRows, fundRows, alertRows] = await Promise.all([
        db.select().from(financial_transactions).where(eq(financial_transactions.org_id, orgId)).orderBy(desc(financial_transactions.date)),
        db.select().from(financial_pledges).where(eq(financial_pledges.org_id, orgId)),
        db.select().from(funds).where(eq(funds.org_id, orgId)),
        db.select().from(financial_alerts).where(and(eq(financial_alerts.org_id, orgId), eq(financial_alerts.dismissed, false))),
    ]);

    // Build monthly data from transactions (last 12 months)
    const monthlyMap = new Map<string, { revenue: number; expenses: number }>();
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        monthlyMap.set(key, { revenue: 0, expenses: 0 });
    }
    for (const txn of txnRows) {
        const d = txn.date instanceof Date ? txn.date : new Date(txn.date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const entry = monthlyMap.get(key);
        if (entry) {
            const amt = asNumber(txn.amount);
            if (txn.direction === 'inflow') entry.revenue += amt;
            else entry.expenses += amt;
        }
    }
    const monthlyData = Array.from(monthlyMap.entries()).map(([month, data]) => ({
        month,
        revenue: data.revenue,
        expenses: data.expenses,
        netIncome: data.revenue - data.expenses,
    }));

    // Outstanding pledges
    const outstandingPledges = pledgeRows
        .filter((p) => ['active', 'overdue', 'partially_fulfilled'].includes(p.status))
        .reduce((sum, p) => sum + (asNumber(p.total_amount) - asNumber(p.paid_amount)), 0);

    // KPIs
    const totalRevenue = monthlyData.reduce((s, d) => s + d.revenue, 0);
    const totalExpenses = monthlyData.reduce((s, d) => s + d.expenses, 0);

    return c.json({
        monthlyData,
        totalRevenue,
        totalExpenses,
        netIncome: totalRevenue - totalExpenses,
        outstandingPledges,
        recentTransactions: txnRows.slice(0, 5).map(mapTransaction),
        funds: fundRows.map(mapFund),
        alerts: alertRows.map(mapAlert),
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// TRANSACTIONS
// ═══════════════════════════════════════════════════════════════════════════

financialsRouter.get('/transactions', async (c) => {
    const orgId = c.get('orgId');

    const conditions = [eq(financial_transactions.org_id, orgId)];
    const status = c.req.query('status');
    if (status) conditions.push(eq(financial_transactions.status, status));
    const direction = c.req.query('direction');
    if (direction) conditions.push(eq(financial_transactions.direction, direction));
    const category = c.req.query('category');
    if (category) conditions.push(eq(financial_transactions.category, category));
    const search = c.req.query('search');
    if (search) {
        conditions.push(
            or(
                ilike(financial_transactions.description_en, `%${search}%`),
                ilike(financial_transactions.description_ar, `%${search}%`),
                ilike(financial_transactions.reference, `%${search}%`),
            )!,
        );
    }

    const rows = await db
        .select()
        .from(financial_transactions)
        .where(and(...conditions))
        .orderBy(desc(financial_transactions.date));

    return c.json(rows.map(mapTransaction));
});

financialsRouter.get('/transactions/:id', async (c) => {
    const orgId = c.get('orgId');

    const rows = await db.select().from(financial_transactions)
        .where(and(eq(financial_transactions.id, c.req.param('id')), eq(financial_transactions.org_id, orgId)));
    if (!rows.length) return c.json({ error: 'Not found' }, 404);
    return c.json(mapTransaction(rows[0]));
});

financialsRouter.post('/transactions', async (c) => {
    const orgId = c.get('orgId');

    // Support both JSON and multipart (for receipt upload)
    const contentType = c.req.header('content-type') || '';
    let body: Record<string, unknown>;
    let receiptFile: any = null;

    if (contentType.includes('multipart/form-data')) {
        const raw = await c.req.parseBody();
        receiptFile = raw.receipt;
        body = {} as Record<string, unknown>;
        for (const [k, v] of Object.entries(raw)) {
            if (k === 'receipt') continue;
            if (k === 'amount') { body[k] = Number(v); continue; }
            if (k === 'custom_fields' && typeof v === 'string') { try { body[k] = JSON.parse(v); } catch { body[k] = {}; } continue; }
            body[k] = v;
        }
    } else {
        body = await c.req.json();
    }

    const parsed = createTransactionSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);

    const data = parsed.data;
    const descriptionEn = data.description_en.trim();
    const descriptionAr = data.description_ar.trim();
    const [txn] = await db.insert(financial_transactions).values({
        org_id: orgId,
        date: new Date(data.date),
        description_en: descriptionEn,
        description_ar: descriptionAr,
        amount: String(data.amount),
        currency: data.currency,
        direction: data.direction,
        category: data.category,
        status: data.status,
        reference: data.reference,
        related_entity_id: data.related_entity_id,
        related_entity_type: data.related_entity_type,
        related_entity_name: data.related_entity_name,
        account_code: data.account_code,
        fund_id: data.fund_id,
        bank_account_id: data.bank_account_id,
        notes: data.notes,
        custom_fields: data.custom_fields,
    }).returning();

    // Handle receipt upload
    if (receiptFile && isUploadedFile(receiptFile)) {
        const originalFilename = sanitizeFilename(receiptFile.name || 'receipt');
        const storedFilename = `${txn.id}-${randomUUID()}${path.extname(originalFilename)}`;
        await mkdir(FINANCIAL_UPLOAD_DIR, { recursive: true });
        await writeFile(path.join(FINANCIAL_UPLOAD_DIR, storedFilename), Buffer.from(await receiptFile.arrayBuffer()));
        await db.insert(transaction_attachments).values({
            org_id: orgId,
            transaction_id: txn.id,
            filename: originalFilename,
            file_url: `${FINANCIAL_UPLOAD_PUBLIC_PATH}/${storedFilename}`,
            content_type: receiptFile.type || null,
            size_bytes: typeof receiptFile.size === 'number' ? receiptFile.size : null,
        });
        await db.update(financial_transactions).set({ attachments_count: 1 }).where(eq(financial_transactions.id, txn.id));
        txn.attachments_count = 1;
    }

    if (data.category === 'donation') {
        const cf = (data.custom_fields ?? {}) as Record<string, unknown>;
        const method = typeof cf.donation_method === 'string' ? cf.donation_method : 'bank_transfer';
        const donorType = cf.donor_type === 'institutional' ? 'institutional' : 'individual';
        const isRecurring = cf.is_recurring === true;
        const recurringFrequency =
            isRecurring && typeof cf.recurring_frequency === 'string' ? cf.recurring_frequency : null;
        const designation = typeof cf.designation === 'string' ? cf.designation : null;

        await db.insert(donation_records).values({
            org_id: orgId,
            donor_id: data.related_entity_id || '',
            donor_name_en: data.related_entity_name || descriptionEn || descriptionAr,
            donor_name_ar: descriptionAr || data.related_entity_name || descriptionEn,
            donor_type: donorType,
            date: new Date(data.date),
            amount: String(data.amount),
            currency: data.currency,
            method,
            designation,
            fund_id: data.fund_id,
            receipt_status: 'pending',
            is_recurring: isRecurring,
            recurring_frequency: recurringFrequency,
            notes: data.notes,
            transaction_id: txn.id,
        });

        const isLinkedIndividualDonor = data.related_entity_type === 'donor' && !!data.related_entity_id;
        if (isLinkedIndividualDonor) {
            const donorId = data.related_entity_id as string;
            const donorRows = await db
                .select({ id: individual_donors.id })
                .from(individual_donors)
                .where(and(eq(individual_donors.id, donorId), eq(individual_donors.org_id, orgId)))
                .limit(1);

            if (donorRows.length > 0) {
                await db.insert(donations).values({
                    org_id: orgId,
                    donor_id: donorId,
                    amount: String(data.amount),
                    date: new Date(data.date),
                    program: designation || '',
                    custom_fields: {
                        status: data.status,
                        payment_method: method,
                        designation: designation || undefined,
                        transaction_id: txn.id,
                    },
                });
                await refreshDonorGivingCacheFromDonations(orgId, donorId);
            }
        }
    }

    return c.json(mapTransaction(txn), 201);
});

financialsRouter.patch('/transactions/:id', async (c) => {
    const orgId = c.get('orgId');

    const existing = await db.select().from(financial_transactions)
        .where(and(eq(financial_transactions.id, c.req.param('id')), eq(financial_transactions.org_id, orgId)));
    if (!existing.length) return c.json({ error: 'Not found' }, 404);

    const body = await c.req.json();
    const parsed = updateTransactionSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);

    const d = parsed.data;
    const vals: Record<string, unknown> = { updated_at: new Date() };
    if (d.date !== undefined) vals.date = new Date(d.date);
    if (d.description_en !== undefined) vals.description_en = d.description_en;
    if (d.description_ar !== undefined) vals.description_ar = d.description_ar;
    if (d.amount !== undefined) vals.amount = String(d.amount);
    if (d.currency !== undefined) vals.currency = d.currency;
    if (d.direction !== undefined) vals.direction = d.direction;
    if (d.category !== undefined) vals.category = d.category;
    if (d.status !== undefined) vals.status = d.status;
    if (d.reference !== undefined) vals.reference = d.reference;
    if (d.related_entity_id !== undefined) vals.related_entity_id = d.related_entity_id;
    if (d.related_entity_type !== undefined) vals.related_entity_type = d.related_entity_type;
    if (d.related_entity_name !== undefined) vals.related_entity_name = d.related_entity_name;
    if (d.account_code !== undefined) vals.account_code = d.account_code;
    if (d.fund_id !== undefined) vals.fund_id = d.fund_id;
    if (d.bank_account_id !== undefined) vals.bank_account_id = d.bank_account_id;
    if (d.notes !== undefined) vals.notes = d.notes;
    if (d.custom_fields !== undefined) vals.custom_fields = d.custom_fields;

    const [updated] = await db.update(financial_transactions).set(vals)
        .where(and(eq(financial_transactions.id, c.req.param('id')), eq(financial_transactions.org_id, orgId)))
        .returning();

    return c.json(mapTransaction(updated));
});

financialsRouter.delete('/transactions/:id', async (c) => {
    const orgId = c.get('orgId');

    const existing = await db.select().from(financial_transactions)
        .where(and(eq(financial_transactions.id, c.req.param('id')), eq(financial_transactions.org_id, orgId)));
    if (!existing.length) return c.json({ error: 'Not found' }, 404);

    const txnId = c.req.param('id');
    const legacyDonationRows = await db
        .select()
        .from(donations)
        .where(eq(donations.org_id, orgId));
    const linkedLegacyDonations = legacyDonationRows.filter((row) => {
        const customFields = getRecord(row.custom_fields);
        return getString(customFields.transaction_id) === txnId;
    });
    const affectedDonorIds = Array.from(
        new Set(linkedLegacyDonations.map((row) => row.donor_id).filter((id): id is string => !!id)),
    );

    await db.delete(transaction_attachments).where(eq(transaction_attachments.transaction_id, txnId));
    await db.delete(donation_records).where(
        and(eq(donation_records.org_id, orgId), eq(donation_records.transaction_id, txnId)),
    );
    for (const row of linkedLegacyDonations) {
        await db.delete(donations).where(and(eq(donations.org_id, orgId), eq(donations.id, row.id)));
    }
    await db.update(pledge_installments).set({ transaction_id: null }).where(
        and(eq(pledge_installments.org_id, orgId), eq(pledge_installments.transaction_id, txnId)),
    );
    await db.update(disbursements).set({ transaction_id: null }).where(
        and(eq(disbursements.org_id, orgId), eq(disbursements.transaction_id, txnId)),
    );
    await db.delete(financial_transactions)
        .where(and(eq(financial_transactions.id, txnId), eq(financial_transactions.org_id, orgId)));

    for (const donorId of affectedDonorIds) {
        await refreshDonorGivingCacheFromDonations(orgId, donorId);
    }

    return c.json({ ok: true });
});

// ═══════════════════════════════════════════════════════════════════════════
// DONATIONS
// ═══════════════════════════════════════════════════════════════════════════

financialsRouter.get('/donations', async (c) => {
    const orgId = c.get('orgId');

    const conditions = [eq(donation_records.org_id, orgId)];
    const method = c.req.query('method');
    if (method) conditions.push(eq(donation_records.method, method));
    const receiptStatus = c.req.query('receipt_status');
    if (receiptStatus) conditions.push(eq(donation_records.receipt_status, receiptStatus));
    const search = c.req.query('search');
    if (search) {
        conditions.push(
            or(
                ilike(donation_records.donor_name_en, `%${search}%`),
                ilike(donation_records.donor_name_ar, `%${search}%`),
                ilike(donation_records.designation, `%${search}%`),
            )!,
        );
    }

    const rows = await db.select().from(donation_records)
        .where(and(...conditions))
        .orderBy(desc(donation_records.date));

    return c.json(rows.map(mapDonationRecord));
});

financialsRouter.get('/donations/:id', async (c) => {
    const orgId = c.get('orgId');

    const rows = await db.select().from(donation_records)
        .where(and(eq(donation_records.id, c.req.param('id')), eq(donation_records.org_id, orgId)));
    if (!rows.length) return c.json({ error: 'Not found' }, 404);
    return c.json(mapDonationRecord(rows[0]));
});

// ═══════════════════════════════════════════════════════════════════════════
// PLEDGES
// ═══════════════════════════════════════════════════════════════════════════

financialsRouter.get('/pledges', async (c) => {
    const orgId = c.get('orgId');

    const pledgeRows = await db.select().from(financial_pledges)
        .where(eq(financial_pledges.org_id, orgId))
        .orderBy(desc(financial_pledges.pledge_date));

    if (pledgeRows.length === 0) return c.json([]);

    const installmentRows = await db.select().from(pledge_installments)
        .where(eq(pledge_installments.org_id, orgId))
        .orderBy(pledge_installments.due_date);

    const installmentsByPledge = new Map<string, PledgeInstallmentRow[]>();
    for (const inst of installmentRows) {
        const arr = installmentsByPledge.get(inst.pledge_id) || [];
        arr.push(inst);
        installmentsByPledge.set(inst.pledge_id, arr);
    }

    return c.json(pledgeRows.map((p) => mapPledge(p, installmentsByPledge.get(p.id) || [])));
});

financialsRouter.get('/pledges/:id', async (c) => {
    const orgId = c.get('orgId');

    const rows = await db.select().from(financial_pledges)
        .where(and(eq(financial_pledges.id, c.req.param('id')), eq(financial_pledges.org_id, orgId)));
    if (!rows.length) return c.json({ error: 'Not found' }, 404);

    const installments = await db.select().from(pledge_installments)
        .where(eq(pledge_installments.pledge_id, rows[0].id))
        .orderBy(pledge_installments.due_date);

    return c.json(mapPledge(rows[0], installments));
});

financialsRouter.post('/pledges', async (c) => {
    const orgId = c.get('orgId');

    const body = await c.req.json();
    const parsed = createPledgeSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);

    const d = parsed.data;
    const [pledge] = await db.insert(financial_pledges).values({
        org_id: orgId,
        donor_id: d.donor_id,
        donor_name_en: d.donor_name_en,
        donor_name_ar: d.donor_name_ar,
        donor_type: d.donor_type,
        pledge_date: new Date(d.pledge_date),
        total_amount: String(d.total_amount),
        paid_amount: String(d.paid_amount),
        currency: d.currency,
        status: d.status,
        designation: d.designation,
        project_id: d.project_id,
        project_name_en: d.project_name_en,
        project_name_ar: d.project_name_ar,
        fund_id: d.fund_id,
        start_date: new Date(d.start_date),
        end_date: new Date(d.end_date),
        frequency: d.frequency,
        notes: d.notes,
        custom_fields: d.custom_fields,
    }).returning();

    // Auto-generate installments based on frequency
    const installments: PledgeInstallmentRow[] = [];
    if (d.frequency !== 'one_time') {
        const start = new Date(d.start_date);
        const end = new Date(d.end_date);
        const monthStep = d.frequency === 'monthly' ? 1 : d.frequency === 'quarterly' ? 3 : 12;
        const dates: Date[] = [];
        const cur = new Date(start);
        while (cur <= end) {
            dates.push(new Date(cur));
            cur.setMonth(cur.getMonth() + monthStep);
        }
        if (dates.length > 0) {
            const installmentAmount = d.total_amount / dates.length;
            for (const date of dates) {
                const [inst] = await db.insert(pledge_installments).values({
                    org_id: orgId,
                    pledge_id: pledge.id,
                    due_date: date,
                    amount: String(installmentAmount.toFixed(2)),
                    paid_amount: '0',
                    status: 'pending',
                    custom_fields: {},
                }).returning();
                installments.push(inst);
            }
        }
    } else {
        // One-time: single installment
        const [inst] = await db.insert(pledge_installments).values({
            org_id: orgId,
            pledge_id: pledge.id,
            due_date: new Date(d.start_date),
            amount: String(d.total_amount),
            paid_amount: '0',
            status: 'pending',
            custom_fields: {},
        }).returning();
        installments.push(inst);
    }

    return c.json(mapPledge(pledge, installments), 201);
});

financialsRouter.patch('/pledges/:id', async (c) => {
    const orgId = c.get('orgId');

    const existing = await db.select().from(financial_pledges)
        .where(and(eq(financial_pledges.id, c.req.param('id')), eq(financial_pledges.org_id, orgId)));
    if (!existing.length) return c.json({ error: 'Not found' }, 404);

    const body = await c.req.json();
    const parsed = updatePledgeSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);

    const d = parsed.data;
    const vals: Record<string, unknown> = { updated_at: new Date() };
    if (d.donor_id !== undefined) vals.donor_id = d.donor_id;
    if (d.donor_name_en !== undefined) vals.donor_name_en = d.donor_name_en;
    if (d.donor_name_ar !== undefined) vals.donor_name_ar = d.donor_name_ar;
    if (d.donor_type !== undefined) vals.donor_type = d.donor_type;
    if (d.pledge_date !== undefined) vals.pledge_date = new Date(d.pledge_date);
    if (d.total_amount !== undefined) vals.total_amount = String(d.total_amount);
    if (d.paid_amount !== undefined) vals.paid_amount = String(d.paid_amount);
    if (d.currency !== undefined) vals.currency = d.currency;
    if (d.status !== undefined) vals.status = d.status;
    if (d.designation !== undefined) vals.designation = d.designation;
    if (d.project_id !== undefined) vals.project_id = d.project_id;
    if (d.project_name_en !== undefined) vals.project_name_en = d.project_name_en;
    if (d.project_name_ar !== undefined) vals.project_name_ar = d.project_name_ar;
    if (d.fund_id !== undefined) vals.fund_id = d.fund_id;
    if (d.start_date !== undefined) vals.start_date = new Date(d.start_date);
    if (d.end_date !== undefined) vals.end_date = new Date(d.end_date);
    if (d.frequency !== undefined) vals.frequency = d.frequency;
    if (d.notes !== undefined) vals.notes = d.notes;
    if (d.custom_fields !== undefined) vals.custom_fields = d.custom_fields;

    const [updated] = await db.update(financial_pledges).set(vals)
        .where(and(eq(financial_pledges.id, c.req.param('id')), eq(financial_pledges.org_id, orgId)))
        .returning();

    const installmentRows = await db.select().from(pledge_installments)
        .where(eq(pledge_installments.pledge_id, updated.id))
        .orderBy(pledge_installments.due_date);

    return c.json(mapPledge(updated, installmentRows));
});

financialsRouter.post('/pledges/:id/payments', async (c) => {
    const user = c.get('user') as User;
    const orgId = c.get('orgId');

    const pledgeRows = await db.select().from(financial_pledges)
        .where(and(eq(financial_pledges.id, c.req.param('id')), eq(financial_pledges.org_id, orgId)));
    if (!pledgeRows.length) return c.json({ error: 'Pledge not found' }, 404);
    const pledge = pledgeRows[0];

    const body = await c.req.json().catch(() => ({}));
    const rawAmount = Number(body?.amount);
    if (!Number.isFinite(rawAmount) || rawAmount <= 0) return c.json({ error: 'amount must be a positive number' }, 400);

    const installmentRows = await db.select().from(pledge_installments)
        .where(eq(pledge_installments.pledge_id, pledge.id))
        .orderBy(pledge_installments.due_date);
    if (!installmentRows.length) return c.json({ error: 'No installments found for pledge' }, 400);

    const targetInstallmentId = typeof body?.installment_id === 'string' ? body.installment_id : undefined;
    const installment = targetInstallmentId
        ? installmentRows.find((inst) => inst.id === targetInstallmentId)
        : installmentRows.find((inst) => inst.status !== 'paid');
    if (!installment) return c.json({ error: 'No payable installment found' }, 400);

    const existingPaid = asNumber(installment.paid_amount);
    const installmentAmount = asNumber(installment.amount);
    const remaining = Math.max(0, installmentAmount - existingPaid);
    const paymentAmount = Math.min(rawAmount, remaining || rawAmount);
    const newPaidAmount = existingPaid + paymentAmount;
    const installmentStatus = newPaidAmount >= installmentAmount ? 'paid' : 'partial';
    const paymentDate = body?.paid_date ? new Date(String(body.paid_date)) : new Date();

    const reference = typeof body?.reference === 'string' && body.reference.trim()
        ? body.reference.trim()
        : `PLG-PAY-${Date.now()}`;
    const [txn] = await db.insert(financial_transactions).values({
        org_id: orgId,
        date: paymentDate,
        description_en: `Pledge payment from ${pledge.donor_name_en}`,
        description_ar: pledge.donor_name_ar ? `دفعة تعهد من ${pledge.donor_name_ar}` : '',
        amount: String(paymentAmount),
        currency: pledge.currency,
        direction: 'inflow',
        category: 'donation',
        status: 'posted',
        reference,
        related_entity_id: pledge.donor_id,
        related_entity_type: 'donor',
        related_entity_name: pledge.donor_name_en,
        fund_id: pledge.fund_id,
        notes: typeof body?.notes === 'string' ? body.notes : undefined,
        posted_by: user.email || user.id,
        posted_date: new Date(),
        custom_fields: { source: 'pledge_payment', pledge_id: pledge.id, installment_id: installment.id },
    }).returning();

    await db.update(pledge_installments).set({
        paid_amount: String(newPaidAmount),
        paid_date: paymentDate,
        status: installmentStatus,
        transaction_id: txn.id,
    }).where(and(eq(pledge_installments.id, installment.id), eq(pledge_installments.org_id, orgId)));

    const refreshedInstallments = await db.select().from(pledge_installments)
        .where(eq(pledge_installments.pledge_id, pledge.id))
        .orderBy(pledge_installments.due_date);
    const totalPaid = refreshedInstallments.reduce((sum, inst) => sum + asNumber(inst.paid_amount), 0);
    const nextStatus = derivePledgeStatus(asNumber(pledge.total_amount), totalPaid, refreshedInstallments);

    const [updatedPledge] = await db.update(financial_pledges).set({
        paid_amount: String(totalPaid),
        status: nextStatus,
        updated_at: new Date(),
    }).where(and(eq(financial_pledges.id, pledge.id), eq(financial_pledges.org_id, orgId)))
        .returning();

    const updatedInstallment = refreshedInstallments.find((inst) => inst.id === installment.id) || installment;

    return c.json({
        pledge: mapPledge(updatedPledge, refreshedInstallments),
        installment: mapPledgeInstallment(updatedInstallment),
        transaction: mapTransaction(txn),
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// BUDGETS
// ═══════════════════════════════════════════════════════════════════════════

financialsRouter.get('/budgets', async (c) => {
    const orgId = c.get('orgId');

    const budgetRows = await db.select().from(project_budgets)
        .where(eq(project_budgets.org_id, orgId))
        .orderBy(desc(project_budgets.fiscal_year));

    if (budgetRows.length === 0) return c.json([]);

    const lineRows = await db.select().from(budget_lines)
        .where(eq(budget_lines.org_id, orgId));

    const linesByBudget = new Map<string, BudgetLineRow[]>();
    for (const line of lineRows) {
        const arr = linesByBudget.get(line.budget_id) || [];
        arr.push(line);
        linesByBudget.set(line.budget_id, arr);
    }

    return c.json(budgetRows.map((b) => mapBudget(b, linesByBudget.get(b.id) || [])));
});

financialsRouter.get('/budgets/:id', async (c) => {
    const orgId = c.get('orgId');

    const rows = await db.select().from(project_budgets)
        .where(and(eq(project_budgets.id, c.req.param('id')), eq(project_budgets.org_id, orgId)));
    if (!rows.length) return c.json({ error: 'Not found' }, 404);

    const lineRows = await db.select().from(budget_lines)
        .where(eq(budget_lines.budget_id, rows[0].id));

    return c.json(mapBudget(rows[0], lineRows));
});

financialsRouter.post('/budgets', async (c) => {
    const orgId = c.get('orgId');

    const body = await c.req.json();
    const parsed = createBudgetSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);

    const d = parsed.data;
    const [budget] = await db.insert(project_budgets).values({
        org_id: orgId,
        project_id: d.project_id,
        project_name_en: d.project_name_en,
        project_name_ar: d.project_name_ar,
        fiscal_year: d.fiscal_year,
        total_planned: String(d.total_planned),
        total_actual: String(d.total_actual),
        total_committed: String(d.total_committed),
        currency: d.currency,
        status: d.status,
        custom_fields: d.custom_fields,
    }).returning();

    return c.json(mapBudget(budget, []), 201);
});

financialsRouter.patch('/budgets/:id', async (c) => {
    const orgId = c.get('orgId');

    const existing = await db.select().from(project_budgets)
        .where(and(eq(project_budgets.id, c.req.param('id')), eq(project_budgets.org_id, orgId)));
    if (!existing.length) return c.json({ error: 'Not found' }, 404);

    const body = await c.req.json();
    const parsed = updateBudgetSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);

    const d = parsed.data;
    const vals: Record<string, unknown> = { updated_at: new Date() };
    if (d.project_id !== undefined) vals.project_id = d.project_id;
    if (d.project_name_en !== undefined) vals.project_name_en = d.project_name_en;
    if (d.project_name_ar !== undefined) vals.project_name_ar = d.project_name_ar;
    if (d.fiscal_year !== undefined) vals.fiscal_year = d.fiscal_year;
    if (d.total_planned !== undefined) vals.total_planned = String(d.total_planned);
    if (d.total_actual !== undefined) vals.total_actual = String(d.total_actual);
    if (d.total_committed !== undefined) vals.total_committed = String(d.total_committed);
    if (d.currency !== undefined) vals.currency = d.currency;
    if (d.status !== undefined) vals.status = d.status;
    if (d.custom_fields !== undefined) vals.custom_fields = d.custom_fields;

    const [updated] = await db.update(project_budgets).set(vals)
        .where(and(eq(project_budgets.id, c.req.param('id')), eq(project_budgets.org_id, orgId)))
        .returning();

    const lineRows = await db.select().from(budget_lines).where(eq(budget_lines.budget_id, updated.id));
    return c.json(mapBudget(updated, lineRows));
});

financialsRouter.post('/budgets/:id/lines', async (c) => {
    const orgId = c.get('orgId');

    const existing = await db.select().from(project_budgets)
        .where(and(eq(project_budgets.id, c.req.param('id')), eq(project_budgets.org_id, orgId)));
    if (!existing.length) return c.json({ error: 'Budget not found' }, 404);

    const body = await c.req.json();
    const parsed = createBudgetLineSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);

    const d = parsed.data;
    const [line] = await db.insert(budget_lines).values({
        org_id: orgId,
        budget_id: existing[0].id,
        account_code: d.account_code,
        account_name_en: d.account_name_en,
        account_name_ar: d.account_name_ar,
        category: d.category,
        planned: String(d.planned),
        actual: String(d.actual),
        committed: String(d.committed),
        custom_fields: d.custom_fields,
    }).returning();

    return c.json(mapBudgetLine(line), 201);
});

financialsRouter.patch('/budgets/:id/lines/:lineId', async (c) => {
    const orgId = c.get('orgId');

    const existingBudget = await db.select().from(project_budgets)
        .where(and(eq(project_budgets.id, c.req.param('id')), eq(project_budgets.org_id, orgId)));
    if (!existingBudget.length) return c.json({ error: 'Budget not found' }, 404);

    const body = await c.req.json();
    const parsed = updateBudgetLineSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);

    const d = parsed.data;
    const vals: Record<string, unknown> = {};
    if (d.account_code !== undefined) vals.account_code = d.account_code;
    if (d.account_name_en !== undefined) vals.account_name_en = d.account_name_en;
    if (d.account_name_ar !== undefined) vals.account_name_ar = d.account_name_ar;
    if (d.category !== undefined) vals.category = d.category;
    if (d.planned !== undefined) vals.planned = String(d.planned);
    if (d.actual !== undefined) vals.actual = String(d.actual);
    if (d.committed !== undefined) vals.committed = String(d.committed);
    if (d.custom_fields !== undefined) vals.custom_fields = d.custom_fields;

    if (Object.keys(vals).length === 0) {
        const rows = await db.select().from(budget_lines)
            .where(and(eq(budget_lines.id, c.req.param('lineId')), eq(budget_lines.budget_id, existingBudget[0].id)));
        return rows[0] ? c.json(mapBudgetLine(rows[0])) : c.json({ error: 'Not found' }, 404);
    }

    const [updated] = await db.update(budget_lines).set(vals)
        .where(and(eq(budget_lines.id, c.req.param('lineId')), eq(budget_lines.budget_id, existingBudget[0].id)))
        .returning();

    if (!updated) return c.json({ error: 'Not found' }, 404);
    return c.json(mapBudgetLine(updated));
});

// ═══════════════════════════════════════════════════════════════════════════
// DISBURSEMENTS
// ═══════════════════════════════════════════════════════════════════════════

financialsRouter.get('/disbursements', async (c) => {
    const orgId = c.get('orgId');

    const conditions = [eq(disbursements.org_id, orgId)];
    const type = c.req.query('type');
    if (type) conditions.push(eq(disbursements.type, type));
    const status = c.req.query('status');
    if (status) conditions.push(eq(disbursements.status, status));
    const beneficiaryId = c.req.query('beneficiary_id');
    if (beneficiaryId) conditions.push(eq(disbursements.beneficiary_id, beneficiaryId));
    const search = c.req.query('search');
    if (search) {
        conditions.push(
            or(
                ilike(disbursements.beneficiary_name_en, `%${search}%`),
                ilike(disbursements.beneficiary_name_ar, `%${search}%`),
            )!,
        );
    }

    const rows = await db.select().from(disbursements)
        .where(and(...conditions))
        .orderBy(desc(disbursements.scheduled_date));

    return c.json(rows.map(mapDisbursement));
});

financialsRouter.post('/disbursements', async (c) => {
    const user = c.get('user') as User;
    const orgId = c.get('orgId');

    const body = await c.req.json();
    const parsed = createDisbursementSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);

    const d = parsed.data;
    const [row] = await db.insert(disbursements).values({
        org_id: orgId,
        beneficiary_id: d.beneficiary_id,
        beneficiary_name_en: d.beneficiary_name_en,
        beneficiary_name_ar: d.beneficiary_name_ar,
        type: d.type,
        amount: String(d.amount),
        currency: d.currency,
        status: 'pending_approval',
        scheduled_date: new Date(d.scheduled_date),
        processed_date: d.processed_date ? new Date(d.processed_date) : null,
        project_id: d.project_id,
        project_name_en: d.project_name_en,
        project_name_ar: d.project_name_ar,
        fund_id: d.fund_id,
        method: d.method,
        approved_by: d.approved_by,
        notes: d.notes,
        transaction_id: d.transaction_id,
        custom_fields: d.custom_fields,
    }).returning();

    const [approval] = await db.insert(approval_items).values({
        org_id: orgId,
        type: 'disbursement',
        title: `Disbursement approval: ${d.beneficiary_name_en}`,
        description: `Approve ${d.type} disbursement for ${d.beneficiary_name_en}`,
        amount: String(d.amount),
        currency: d.currency,
        requested_by: user.email || user.id,
        requested_date: new Date(),
        priority: 'medium',
        status: 'pending',
        related_entity_id: row.id,
        related_entity_name: d.beneficiary_name_en,
        current_step: 1,
        total_steps: 1,
        workflow_id: 'disbursement_approval',
        due_date: new Date(d.scheduled_date),
        custom_fields: {
            disbursement_id: row.id,
            beneficiary_id: d.beneficiary_id,
            beneficiary_name_en: d.beneficiary_name_en,
            beneficiary_name_ar: d.beneficiary_name_ar,
            disbursement_type: d.type,
        },
    }).returning();

    return c.json({ disbursement: mapDisbursement(row), approval: mapApproval(approval) }, 201);
});

financialsRouter.patch('/disbursements/:id', async (c) => {
    const orgId = c.get('orgId');

    const existing = await db.select().from(disbursements)
        .where(and(eq(disbursements.id, c.req.param('id')), eq(disbursements.org_id, orgId)));
    if (!existing.length) return c.json({ error: 'Not found' }, 404);

    const body = await c.req.json();
    const parsed = updateDisbursementSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);

    const d = parsed.data;
    const vals: Record<string, unknown> = { updated_at: new Date() };
    if (d.beneficiary_id !== undefined) vals.beneficiary_id = d.beneficiary_id;
    if (d.beneficiary_name_en !== undefined) vals.beneficiary_name_en = d.beneficiary_name_en;
    if (d.beneficiary_name_ar !== undefined) vals.beneficiary_name_ar = d.beneficiary_name_ar;
    if (d.type !== undefined) vals.type = d.type;
    if (d.amount !== undefined) vals.amount = String(d.amount);
    if (d.currency !== undefined) vals.currency = d.currency;
    if (d.status !== undefined) vals.status = d.status;
    if (d.scheduled_date !== undefined) vals.scheduled_date = new Date(d.scheduled_date);
    if (d.processed_date !== undefined) vals.processed_date = d.processed_date ? new Date(d.processed_date) : null;
    if (d.project_id !== undefined) vals.project_id = d.project_id;
    if (d.project_name_en !== undefined) vals.project_name_en = d.project_name_en;
    if (d.project_name_ar !== undefined) vals.project_name_ar = d.project_name_ar;
    if (d.fund_id !== undefined) vals.fund_id = d.fund_id;
    if (d.method !== undefined) vals.method = d.method;
    if (d.approved_by !== undefined) vals.approved_by = d.approved_by;
    if (d.notes !== undefined) vals.notes = d.notes;
    if (d.transaction_id !== undefined) vals.transaction_id = d.transaction_id;
    if (d.custom_fields !== undefined) vals.custom_fields = d.custom_fields;

    const [updated] = await db.update(disbursements).set(vals)
        .where(and(eq(disbursements.id, c.req.param('id')), eq(disbursements.org_id, orgId)))
        .returning();

    return c.json(mapDisbursement(updated));
});

// ═══════════════════════════════════════════════════════════════════════════
// FUNDS
// ═══════════════════════════════════════════════════════════════════════════

financialsRouter.get('/funds', async (c) => {
    const orgId = c.get('orgId');

    const rows = await db.select().from(funds).where(eq(funds.org_id, orgId));
    return c.json(rows.map(mapFund));
});

financialsRouter.post('/funds', async (c) => {
    const orgId = c.get('orgId');

    const body = await c.req.json();
    const parsed = createFundSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);

    const d = parsed.data;
    const [row] = await db.insert(funds).values({
        org_id: orgId,
        name_en: d.name_en,
        name_ar: d.name_ar,
        type: d.type,
        balance: String(d.balance),
        currency: d.currency,
        donor_restriction: d.donor_restriction,
        project_id: d.project_id,
        project_name_en: d.project_name_en,
        project_name_ar: d.project_name_ar,
        institutional_donor_id: d.institutional_donor_id,
        institutional_donor_name: d.institutional_donor_name,
        start_date: new Date(d.start_date),
        end_date: d.end_date ? new Date(d.end_date) : null,
        total_received: String(d.total_received),
        total_spent: String(d.total_spent),
        total_committed: String(d.total_committed),
        custom_fields: d.custom_fields,
    }).returning();

    return c.json(mapFund(row), 201);
});

financialsRouter.patch('/funds/:id', async (c) => {
    const orgId = c.get('orgId');

    const existing = await db.select().from(funds)
        .where(and(eq(funds.id, c.req.param('id')), eq(funds.org_id, orgId)));
    if (!existing.length) return c.json({ error: 'Not found' }, 404);

    const body = await c.req.json();
    const parsed = updateFundSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);

    const d = parsed.data;
    const vals: Record<string, unknown> = { updated_at: new Date() };
    if (d.name_en !== undefined) vals.name_en = d.name_en;
    if (d.name_ar !== undefined) vals.name_ar = d.name_ar;
    if (d.type !== undefined) vals.type = d.type;
    if (d.balance !== undefined) vals.balance = String(d.balance);
    if (d.currency !== undefined) vals.currency = d.currency;
    if (d.donor_restriction !== undefined) vals.donor_restriction = d.donor_restriction;
    if (d.project_id !== undefined) vals.project_id = d.project_id;
    if (d.project_name_en !== undefined) vals.project_name_en = d.project_name_en;
    if (d.project_name_ar !== undefined) vals.project_name_ar = d.project_name_ar;
    if (d.institutional_donor_id !== undefined) vals.institutional_donor_id = d.institutional_donor_id;
    if (d.institutional_donor_name !== undefined) vals.institutional_donor_name = d.institutional_donor_name;
    if (d.start_date !== undefined) vals.start_date = new Date(d.start_date);
    if (d.end_date !== undefined) vals.end_date = d.end_date ? new Date(d.end_date) : null;
    if (d.total_received !== undefined) vals.total_received = String(d.total_received);
    if (d.total_spent !== undefined) vals.total_spent = String(d.total_spent);
    if (d.total_committed !== undefined) vals.total_committed = String(d.total_committed);
    if (d.custom_fields !== undefined) vals.custom_fields = d.custom_fields;

    const [updated] = await db.update(funds).set(vals)
        .where(and(eq(funds.id, c.req.param('id')), eq(funds.org_id, orgId)))
        .returning();

    return c.json(mapFund(updated));
});

// ═══════════════════════════════════════════════════════════════════════════
// GRANTS
// ═══════════════════════════════════════════════════════════════════════════

financialsRouter.get('/grants', async (c) => {
    const orgId = c.get('orgId');

    const grantRows = await db.select().from(grants)
        .where(eq(grants.org_id, orgId))
        .orderBy(desc(grants.start_date));

    if (grantRows.length === 0) return c.json([]);

    const installmentRows = await db.select().from(grant_installments)
        .where(eq(grant_installments.org_id, orgId))
        .orderBy(grant_installments.due_date);

    const installmentsByGrant = new Map<string, GrantInstallmentRow[]>();
    for (const inst of installmentRows) {
        const arr = installmentsByGrant.get(inst.grant_id) || [];
        arr.push(inst);
        installmentsByGrant.set(inst.grant_id, arr);
    }

    return c.json(grantRows.map((g) => mapGrant(g, installmentsByGrant.get(g.id) || [])));
});

financialsRouter.post('/grants', async (c) => {
    const orgId = c.get('orgId');

    const body = await c.req.json();
    const parsed = createGrantSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);

    const d = parsed.data;
    const [grant] = await db.insert(grants).values({
        org_id: orgId,
        grantor_id: d.grantor_id,
        grantor_name: d.grantor_name,
        grant_number: d.grant_number,
        title_en: d.title_en,
        title_ar: d.title_ar,
        total_amount: String(d.total_amount),
        received_amount: String(d.received_amount),
        currency: d.currency,
        start_date: new Date(d.start_date),
        end_date: new Date(d.end_date),
        status: d.status,
        fund_id: d.fund_id,
        project_id: d.project_id,
        project_name_en: d.project_name_en,
        project_name_ar: d.project_name_ar,
        reporting_requirements: d.reporting_requirements,
        custom_fields: d.custom_fields,
    }).returning();

    return c.json(mapGrant(grant, []), 201);
});

financialsRouter.patch('/grants/:id', async (c) => {
    const orgId = c.get('orgId');

    const existing = await db.select().from(grants)
        .where(and(eq(grants.id, c.req.param('id')), eq(grants.org_id, orgId)));
    if (!existing.length) return c.json({ error: 'Not found' }, 404);

    const body = await c.req.json();
    const parsed = updateGrantSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);

    const d = parsed.data;
    const vals: Record<string, unknown> = { updated_at: new Date() };
    if (d.grantor_id !== undefined) vals.grantor_id = d.grantor_id;
    if (d.grantor_name !== undefined) vals.grantor_name = d.grantor_name;
    if (d.grant_number !== undefined) vals.grant_number = d.grant_number;
    if (d.title_en !== undefined) vals.title_en = d.title_en;
    if (d.title_ar !== undefined) vals.title_ar = d.title_ar;
    if (d.total_amount !== undefined) vals.total_amount = String(d.total_amount);
    if (d.received_amount !== undefined) vals.received_amount = String(d.received_amount);
    if (d.currency !== undefined) vals.currency = d.currency;
    if (d.start_date !== undefined) vals.start_date = new Date(d.start_date);
    if (d.end_date !== undefined) vals.end_date = new Date(d.end_date);
    if (d.status !== undefined) vals.status = d.status;
    if (d.fund_id !== undefined) vals.fund_id = d.fund_id;
    if (d.project_id !== undefined) vals.project_id = d.project_id;
    if (d.project_name_en !== undefined) vals.project_name_en = d.project_name_en;
    if (d.project_name_ar !== undefined) vals.project_name_ar = d.project_name_ar;
    if (d.reporting_requirements !== undefined) vals.reporting_requirements = d.reporting_requirements;
    if (d.custom_fields !== undefined) vals.custom_fields = d.custom_fields;

    const [updated] = await db.update(grants).set(vals)
        .where(and(eq(grants.id, c.req.param('id')), eq(grants.org_id, orgId)))
        .returning();

    const installmentRows = await db.select().from(grant_installments)
        .where(eq(grant_installments.grant_id, updated.id))
        .orderBy(grant_installments.due_date);

    return c.json(mapGrant(updated, installmentRows));
});

financialsRouter.post('/grants/:id/receive', async (c) => {
    const user = c.get('user') as User;
    const orgId = c.get('orgId');

    const grantRows = await db.select().from(grants)
        .where(and(eq(grants.id, c.req.param('id')), eq(grants.org_id, orgId)));
    if (!grantRows.length) return c.json({ error: 'Grant not found' }, 404);
    const grant = grantRows[0];

    const body = await c.req.json().catch(() => ({}));
    const rawAmount = Number(body?.amount);
    if (!Number.isFinite(rawAmount) || rawAmount <= 0) return c.json({ error: 'amount must be a positive number' }, 400);

    const installmentRows = await db.select().from(grant_installments)
        .where(eq(grant_installments.grant_id, grant.id))
        .orderBy(grant_installments.due_date);
    if (!installmentRows.length) return c.json({ error: 'No installments found for grant' }, 400);

    const targetInstallmentId = typeof body?.installment_id === 'string' ? body.installment_id : undefined;
    const installment = targetInstallmentId
        ? installmentRows.find((inst) => inst.id === targetInstallmentId)
        : installmentRows.find((inst) => inst.status !== 'received');
    if (!installment) return c.json({ error: 'No receivable installment found' }, 400);

    const existingReceived = asNumber(installment.received_amount);
    const installmentAmount = asNumber(installment.amount);
    const remaining = Math.max(0, installmentAmount - existingReceived);
    const receiveAmount = Math.min(rawAmount, remaining || rawAmount);
    const newReceivedAmount = existingReceived + receiveAmount;
    const installmentStatus = newReceivedAmount >= installmentAmount ? 'received' : 'pending';
    const receivedDate = body?.received_date ? new Date(String(body.received_date)) : new Date();

    const reference = typeof body?.reference === 'string' && body.reference.trim()
        ? body.reference.trim()
        : `GRT-REC-${Date.now()}`;
    const [txn] = await db.insert(financial_transactions).values({
        org_id: orgId,
        date: receivedDate,
        description_en: `Grant installment from ${grant.grantor_name}`,
        description_ar: '',
        amount: String(receiveAmount),
        currency: grant.currency,
        direction: 'inflow',
        category: 'grant_income',
        status: 'posted',
        reference,
        related_entity_id: grant.grantor_id,
        related_entity_type: 'institutional_donor',
        related_entity_name: grant.grantor_name,
        fund_id: grant.fund_id,
        notes: typeof body?.notes === 'string' ? body.notes : undefined,
        posted_by: user.email || user.id,
        posted_date: new Date(),
        custom_fields: { source: 'grant_installment', grant_id: grant.id, installment_id: installment.id },
    }).returning();

    await db.update(grant_installments).set({
        received_amount: String(newReceivedAmount),
        received_date: receivedDate,
        status: installmentStatus,
    }).where(and(eq(grant_installments.id, installment.id), eq(grant_installments.org_id, orgId)));

    const refreshedInstallments = await db.select().from(grant_installments)
        .where(eq(grant_installments.grant_id, grant.id))
        .orderBy(grant_installments.due_date);
    const totalReceived = refreshedInstallments.reduce((sum, inst) => sum + asNumber(inst.received_amount), 0);
    const nextStatus = deriveGrantStatus(asNumber(grant.total_amount), totalReceived);

    const [updatedGrant] = await db.update(grants).set({
        received_amount: String(totalReceived),
        status: nextStatus,
        updated_at: new Date(),
    }).where(and(eq(grants.id, grant.id), eq(grants.org_id, orgId)))
        .returning();

    return c.json({
        grant: mapGrant(updatedGrant, refreshedInstallments),
        transaction: mapTransaction(txn),
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// APPROVALS
// ═══════════════════════════════════════════════════════════════════════════

financialsRouter.get('/approvals', async (c) => {
    const orgId = c.get('orgId');

    const rows = await db.select().from(approval_items)
        .where(eq(approval_items.org_id, orgId))
        .orderBy(desc(approval_items.requested_date));

    return c.json(rows.map(mapApproval));
});

async function approveApproval(c: any) {
    const user = c.get('user') as User;
    const orgId = c.get('orgId');

    const existing = await db.select().from(approval_items)
        .where(and(eq(approval_items.id, c.req.param('id')), eq(approval_items.org_id, orgId)));
    if (!existing.length) return c.json({ error: 'Not found' }, 404);
    if (existing[0].status !== 'pending') return c.json({ error: 'Can only approve pending items' }, 400);

    const body = await c.req.json().catch(() => ({}));
    const parsed = approveRejectSchema.safeParse(body);
    const notes = parsed.success && parsed.data.notes ? parsed.data.notes : undefined;

    const [updated] = await db.update(approval_items).set({
        status: 'approved',
        approved_by: user.email || user.id,
        approved_date: new Date(),
        updated_at: new Date(),
        ...(notes ? { custom_fields: { ...(typeof existing[0].custom_fields === 'object' && existing[0].custom_fields ? existing[0].custom_fields : {}), approval_notes: notes } } : {}),
    }).where(and(eq(approval_items.id, c.req.param('id')), eq(approval_items.org_id, orgId)))
        .returning();

    if (updated.type === 'disbursement' && updated.related_entity_id) {
        const disbursementRows = await db.select().from(disbursements)
            .where(and(eq(disbursements.id, updated.related_entity_id), eq(disbursements.org_id, orgId)));
        if (disbursementRows.length) {
            const disbursementRow = disbursementRows[0];
            if (!disbursementRow.transaction_id) {
                const reference = `DIS-${Date.now()}`;
                const [txn] = await db.insert(financial_transactions).values({
                    org_id: orgId,
                    date: new Date(),
                    description_en: `Disbursement to ${disbursementRow.beneficiary_name_en}`,
                    description_ar: disbursementRow.beneficiary_name_ar ? `صرف إلى ${disbursementRow.beneficiary_name_ar}` : '',
                    amount: String(disbursementRow.amount),
                    currency: disbursementRow.currency,
                    direction: 'outflow',
                    category: 'disbursement',
                    status: 'posted',
                    reference,
                    related_entity_id: disbursementRow.beneficiary_id,
                    related_entity_type: 'beneficiary',
                    related_entity_name: disbursementRow.beneficiary_name_en,
                    fund_id: disbursementRow.fund_id,
                    notes: disbursementRow.notes,
                    approved_by: user.email || user.id,
                    approved_date: new Date(),
                    posted_by: user.email || user.id,
                    posted_date: new Date(),
                    custom_fields: { source: 'disbursement_approval', disbursement_id: disbursementRow.id },
                }).returning();

                await db.update(disbursements).set({
                    status: 'completed',
                    approved_by: user.email || user.id,
                    processed_date: new Date(),
                    transaction_id: txn.id,
                    updated_at: new Date(),
                }).where(and(eq(disbursements.id, disbursementRow.id), eq(disbursements.org_id, orgId)));
            }
        }
    }

    return c.json(mapApproval(updated));
}

financialsRouter.put('/approvals/:id/approve', approveApproval);
financialsRouter.post('/approvals/:id/approve', approveApproval);

async function rejectApproval(c: any) {
    const user = c.get('user') as User;
    const orgId = c.get('orgId');

    const existing = await db.select().from(approval_items)
        .where(and(eq(approval_items.id, c.req.param('id')), eq(approval_items.org_id, orgId)));
    if (!existing.length) return c.json({ error: 'Not found' }, 404);
    if (existing[0].status !== 'pending') return c.json({ error: 'Can only reject pending items' }, 400);

    const body = await c.req.json().catch(() => ({}));
    const parsed = approveRejectSchema.safeParse(body);
    const notes = parsed.success && parsed.data.notes ? parsed.data.notes : undefined;

    const [updated] = await db.update(approval_items).set({
        status: 'rejected',
        rejected_by: user.email || user.id,
        rejected_date: new Date(),
        updated_at: new Date(),
        ...(notes ? { custom_fields: { ...(typeof existing[0].custom_fields === 'object' && existing[0].custom_fields ? existing[0].custom_fields : {}), rejection_notes: notes } } : {}),
    }).where(and(eq(approval_items.id, c.req.param('id')), eq(approval_items.org_id, orgId)))
        .returning();

    if (updated.type === 'disbursement' && updated.related_entity_id) {
        await db.update(disbursements).set({
            status: 'cancelled',
            updated_at: new Date(),
        }).where(and(eq(disbursements.id, updated.related_entity_id), eq(disbursements.org_id, orgId)));
    }

    return c.json(mapApproval(updated));
}

financialsRouter.put('/approvals/:id/reject', rejectApproval);
financialsRouter.post('/approvals/:id/reject', rejectApproval);

// ═══════════════════════════════════════════════════════════════════════════
// REPORTS
// ═══════════════════════════════════════════════════════════════════════════

financialsRouter.get('/reports', async (c) => {
    const orgId = c.get('orgId');

    const rows = await db.select().from(financial_reports)
        .where(eq(financial_reports.org_id, orgId));

    return c.json(rows.map(mapReport));
});

financialsRouter.post('/reports/:type/generate', async (c) => {
    const orgId = c.get('orgId');

    const reportType = c.req.param('type');
    const rows = await db.select().from(financial_reports)
        .where(and(eq(financial_reports.org_id, orgId), eq(financial_reports.type, reportType)));

    if (!rows.length) return c.json({ error: 'Report type not found' }, 404);

    // Stub: update last_generated timestamp. Actual file generation is out of scope.
    const [updated] = await db.update(financial_reports)
        .set({ last_generated: new Date() })
        .where(and(eq(financial_reports.id, rows[0].id), eq(financial_reports.org_id, orgId)))
        .returning();

    return c.json(mapReport(updated));
});

financialsRouter.get('/reports/:id/download', async (c) => {
    const orgId = c.get('orgId');

    const rows = await db.select().from(financial_reports)
        .where(and(eq(financial_reports.id, c.req.param('id')), eq(financial_reports.org_id, orgId)));

    if (!rows.length) return c.json({ error: 'Not found' }, 404);
    if (!rows[0].file_url) return c.json({ error: 'Report has not been generated yet' }, 404);

    // Stub: In production, this would stream the file. For now return the URL.
    return c.json({ url: rows[0].file_url, format: rows[0].format });
});

financialsRouter.get('/reports/:type/download', async (c) => {
    const orgId = c.get('orgId');

    const rows = await db.select().from(financial_reports)
        .where(and(eq(financial_reports.org_id, orgId), eq(financial_reports.type, c.req.param('type'))))
        .orderBy(desc(financial_reports.last_generated));

    if (!rows.length) return c.json({ error: 'Not found' }, 404);
    if (!rows[0].file_url) return c.json({ error: 'Report has not been generated yet' }, 404);
    return c.json({ url: rows[0].file_url, format: rows[0].format, reportId: rows[0].id });
});

// ═══════════════════════════════════════════════════════════════════════════
// ALERTS
// ═══════════════════════════════════════════════════════════════════════════

financialsRouter.get('/alerts', async (c) => {
    const orgId = c.get('orgId');

    const rows = await db.select().from(financial_alerts)
        .where(and(eq(financial_alerts.org_id, orgId), eq(financial_alerts.dismissed, false)))
        .orderBy(desc(financial_alerts.date));

    return c.json(rows.map(mapAlert));
});

financialsRouter.patch('/alerts/:id/dismiss', async (c) => {
    const orgId = c.get('orgId');

    const [updated] = await db.update(financial_alerts)
        .set({ dismissed: true })
        .where(and(eq(financial_alerts.id, c.req.param('id')), eq(financial_alerts.org_id, orgId)))
        .returning();

    if (!updated) return c.json({ error: 'Not found' }, 404);
    return c.json(mapAlert(updated));
});

export { financialsRouter };
