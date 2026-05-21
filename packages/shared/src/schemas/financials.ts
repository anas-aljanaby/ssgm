import { z } from 'zod/v4';
import {
    TRANSACTION_STATUSES, TRANSACTION_DIRECTIONS, TRANSACTION_CATEGORIES, RELATED_ENTITY_TYPES,
    DONATION_METHODS, RECEIPT_STATUSES, DONOR_TYPES,
    PLEDGE_STATUSES, PLEDGE_INSTALLMENT_STATUSES, PLEDGE_FREQUENCIES,
    BUDGET_STATUSES,
    DISBURSEMENT_TYPES, DISBURSEMENT_STATUSES, DISBURSEMENT_METHODS,
    FUND_TYPES,
    GRANT_STATUSES, GRANT_INSTALLMENT_STATUSES,
    APPROVAL_ITEM_TYPES, APPROVAL_STATUSES, APPROVAL_PRIORITIES,
    FINANCIAL_REPORT_TYPES, REPORT_FORMATS,
    ALERT_TYPES,
} from '../constants/financialOptions';

// ─── Enum Schemas ───────────────────────────────────────────────────────────
export const transactionStatusSchema = z.enum(TRANSACTION_STATUSES);
export const transactionDirectionSchema = z.enum(TRANSACTION_DIRECTIONS);
export const transactionCategorySchema = z.enum(TRANSACTION_CATEGORIES);
export const relatedEntityTypeSchema = z.enum(RELATED_ENTITY_TYPES);
export const donationMethodSchema = z.enum(DONATION_METHODS);
export const receiptStatusSchema = z.enum(RECEIPT_STATUSES);
export const donorTypeSchema = z.enum(DONOR_TYPES);
export const pledgeStatusSchema = z.enum(PLEDGE_STATUSES);
export const pledgeInstallmentStatusSchema = z.enum(PLEDGE_INSTALLMENT_STATUSES);
export const pledgeFrequencySchema = z.enum(PLEDGE_FREQUENCIES);
export const budgetStatusSchema = z.enum(BUDGET_STATUSES);
export const disbursementTypeSchema = z.enum(DISBURSEMENT_TYPES);
export const disbursementStatusSchema = z.enum(DISBURSEMENT_STATUSES);
export const disbursementMethodSchema = z.enum(DISBURSEMENT_METHODS);
export const fundTypeSchema = z.enum(FUND_TYPES);
export const grantStatusSchema = z.enum(GRANT_STATUSES);
export const grantInstallmentStatusSchema = z.enum(GRANT_INSTALLMENT_STATUSES);
export const approvalItemTypeSchema = z.enum(APPROVAL_ITEM_TYPES);
export const approvalStatusSchema = z.enum(APPROVAL_STATUSES);
export const approvalPrioritySchema = z.enum(APPROVAL_PRIORITIES);
export const financialReportTypeSchema = z.enum(FINANCIAL_REPORT_TYPES);
export const reportFormatSchema = z.enum(REPORT_FORMATS);
export const alertTypeSchema = z.enum(ALERT_TYPES);

// ─── Transaction ────────────────────────────────────────────────────────────

const transactionFieldsSchema = z.object({
    date: z.string().min(1),
    description_en: z.string().default(''),
    description_ar: z.string().default(''),
    amount: z.number().positive(),
    currency: z.string().default('USD'),
    direction: transactionDirectionSchema,
    category: transactionCategorySchema,
    status: transactionStatusSchema.default('draft'),
    reference: z.string().optional().default(''),
    related_entity_id: z.string().optional(),
    related_entity_type: relatedEntityTypeSchema.optional(),
    related_entity_name: z.string().optional(),
    account_code: z.string().optional(),
    fund_id: z.string().optional(),
    bank_account_id: z.string().optional(),
    notes: z.string().optional(),
    custom_fields: z.record(z.string(), z.unknown()).default({}),
});

export const createTransactionSchema = transactionFieldsSchema.refine(
    (data) => data.description_en.trim().length > 0 || data.description_ar.trim().length > 0,
    { message: 'At least one description (English or Arabic) is required' },
);

export const updateTransactionSchema = transactionFieldsSchema.partial();

// ─── Donation Record ────────────────────────────────────────────────────────

export const createDonationRecordSchema = z.object({
    donor_id: z.string().min(1),
    donor_name_en: z.string().min(1),
    donor_name_ar: z.string().optional().default(''),
    donor_type: donorTypeSchema,
    date: z.string().min(1),
    amount: z.number().positive(),
    currency: z.string().default('USD'),
    method: donationMethodSchema,
    designation: z.string().optional(),
    project_id: z.string().optional(),
    project_name_en: z.string().optional(),
    project_name_ar: z.string().optional(),
    fund_id: z.string().optional(),
    campaign_id: z.string().optional(),
    campaign_name: z.string().optional(),
    receipt_status: receiptStatusSchema.default('pending'),
    is_recurring: z.boolean().default(false),
    recurring_frequency: z.enum(['monthly', 'quarterly', 'annually']).optional(),
    notes: z.string().optional(),
    transaction_id: z.string().optional(),
    custom_fields: z.record(z.string(), z.unknown()).default({}),
});

export const updateDonationRecordSchema = createDonationRecordSchema.partial();

// ─── Pledge ─────────────────────────────────────────────────────────────────

export const createPledgeSchema = z.object({
    donor_id: z.string().min(1),
    donor_name_en: z.string().min(1),
    donor_name_ar: z.string().optional().default(''),
    donor_type: donorTypeSchema,
    pledge_date: z.string().min(1),
    total_amount: z.number().positive(),
    paid_amount: z.number().default(0),
    currency: z.string().default('USD'),
    status: pledgeStatusSchema.default('active'),
    designation: z.string().optional(),
    project_id: z.string().optional(),
    project_name_en: z.string().optional(),
    project_name_ar: z.string().optional(),
    fund_id: z.string().optional(),
    start_date: z.string().min(1),
    end_date: z.string().min(1),
    frequency: pledgeFrequencySchema,
    notes: z.string().optional(),
    custom_fields: z.record(z.string(), z.unknown()).default({}),
});

export const updatePledgeSchema = createPledgeSchema.partial();

export const createPledgeInstallmentSchema = z.object({
    due_date: z.string().min(1),
    amount: z.number().positive(),
    paid_amount: z.number().default(0),
    paid_date: z.string().optional(),
    status: pledgeInstallmentStatusSchema.default('pending'),
    transaction_id: z.string().optional(),
    custom_fields: z.record(z.string(), z.unknown()).default({}),
});

// ─── Budget ─────────────────────────────────────────────────────────────────

export const createBudgetSchema = z.object({
    project_id: z.string().min(1),
    project_name_en: z.string().min(1),
    project_name_ar: z.string().optional().default(''),
    fiscal_year: z.string().min(1),
    total_planned: z.number().default(0),
    total_actual: z.number().default(0),
    total_committed: z.number().default(0),
    currency: z.string().default('USD'),
    status: budgetStatusSchema.default('draft'),
    custom_fields: z.record(z.string(), z.unknown()).default({}),
});

export const updateBudgetSchema = createBudgetSchema.partial();

export const createBudgetLineSchema = z.object({
    account_code: z.string().min(1),
    account_name_en: z.string().min(1),
    account_name_ar: z.string().optional().default(''),
    category: z.string().min(1),
    planned: z.number().default(0),
    actual: z.number().default(0),
    committed: z.number().default(0),
    custom_fields: z.record(z.string(), z.unknown()).default({}),
});

export const updateBudgetLineSchema = createBudgetLineSchema.partial();

// ─── Disbursement ───────────────────────────────────────────────────────────

export const createDisbursementSchema = z.object({
    beneficiary_id: z.string().min(1),
    beneficiary_name_en: z.string().min(1),
    beneficiary_name_ar: z.string().optional().default(''),
    type: disbursementTypeSchema,
    amount: z.number().positive(),
    currency: z.string().default('USD'),
    status: disbursementStatusSchema.default('scheduled'),
    scheduled_date: z.string().min(1),
    processed_date: z.string().optional(),
    project_id: z.string().optional(),
    project_name_en: z.string().optional(),
    project_name_ar: z.string().optional(),
    fund_id: z.string().optional(),
    method: disbursementMethodSchema,
    approved_by: z.string().optional(),
    notes: z.string().optional(),
    transaction_id: z.string().optional(),
    custom_fields: z.record(z.string(), z.unknown()).default({}),
});

export const updateDisbursementSchema = createDisbursementSchema.partial();

// ─── Fund ───────────────────────────────────────────────────────────────────

export const createFundSchema = z.object({
    name_en: z.string().min(1),
    name_ar: z.string().optional().default(''),
    type: fundTypeSchema,
    balance: z.number().default(0),
    currency: z.string().default('USD'),
    donor_restriction: z.string().optional(),
    project_id: z.string().optional(),
    project_name_en: z.string().optional(),
    project_name_ar: z.string().optional(),
    institutional_donor_id: z.string().optional(),
    institutional_donor_name: z.string().optional(),
    start_date: z.string().min(1),
    end_date: z.string().optional(),
    total_received: z.number().default(0),
    total_spent: z.number().default(0),
    total_committed: z.number().default(0),
    custom_fields: z.record(z.string(), z.unknown()).default({}),
});

export const updateFundSchema = createFundSchema.partial();

// ─── Grant ──────────────────────────────────────────────────────────────────

export const createGrantSchema = z.object({
    grantor_id: z.string().min(1),
    grantor_name: z.string().min(1),
    grant_number: z.string().min(1),
    title_en: z.string().min(1),
    title_ar: z.string().optional().default(''),
    total_amount: z.number().positive(),
    received_amount: z.number().default(0),
    currency: z.string().default('USD'),
    start_date: z.string().min(1),
    end_date: z.string().min(1),
    status: grantStatusSchema.default('pending'),
    fund_id: z.string().min(1),
    project_id: z.string().optional(),
    project_name_en: z.string().optional(),
    project_name_ar: z.string().optional(),
    reporting_requirements: z.string().optional(),
    custom_fields: z.record(z.string(), z.unknown()).default({}),
});

export const updateGrantSchema = createGrantSchema.partial();

export const createGrantInstallmentSchema = z.object({
    due_date: z.string().min(1),
    amount: z.number().positive(),
    received_amount: z.number().default(0),
    received_date: z.string().optional(),
    status: grantInstallmentStatusSchema.default('pending'),
    custom_fields: z.record(z.string(), z.unknown()).default({}),
});

// ─── Approval ───────────────────────────────────────────────────────────────

export const createApprovalItemSchema = z.object({
    type: approvalItemTypeSchema,
    title: z.string().min(1),
    description: z.string().min(1),
    amount: z.number().positive(),
    currency: z.string().default('USD'),
    requested_by: z.string().min(1),
    requested_date: z.string().min(1),
    priority: approvalPrioritySchema.default('medium'),
    status: approvalStatusSchema.default('pending'),
    related_entity_id: z.string().optional(),
    related_entity_name: z.string().optional(),
    current_step: z.number().int().min(1).default(1),
    total_steps: z.number().int().min(1).default(1),
    workflow_id: z.string().min(1),
    due_date: z.string().optional(),
    custom_fields: z.record(z.string(), z.unknown()).default({}),
});

export const approveRejectSchema = z.object({
    notes: z.string().optional(),
});

export const approvalActionSchema = approveRejectSchema;

// ─── Report ─────────────────────────────────────────────────────────────────

export const createFinancialReportSchema = z.object({
    type: financialReportTypeSchema,
    name_en: z.string().min(1),
    name_ar: z.string().optional().default(''),
    description_en: z.string().min(1),
    description_ar: z.string().optional().default(''),
    format: reportFormatSchema.default('pdf'),
    period: z.string().optional(),
    custom_fields: z.record(z.string(), z.unknown()).default({}),
});

export const generateReportSchema = z.object({
    type: financialReportTypeSchema.optional(),
    period: z.string().optional(),
});

// ─── Alert ──────────────────────────────────────────────────────────────────

export const createFinancialAlertSchema = z.object({
    type: alertTypeSchema,
    message_en: z.string().min(1),
    message_ar: z.string().optional().default(''),
    date: z.string().min(1),
    related_entity_id: z.string().optional(),
    action_required: z.boolean().default(false),
    custom_fields: z.record(z.string(), z.unknown()).default({}),
});

// ─── Type Exports ───────────────────────────────────────────────────────────
export type CreateTransaction = z.infer<typeof createTransactionSchema>;
export type UpdateTransaction = z.infer<typeof updateTransactionSchema>;
export type CreateDonationRecord = z.infer<typeof createDonationRecordSchema>;
export type UpdateDonationRecord = z.infer<typeof updateDonationRecordSchema>;
export type CreatePledge = z.infer<typeof createPledgeSchema>;
export type UpdatePledge = z.infer<typeof updatePledgeSchema>;
export type CreatePledgeInstallment = z.infer<typeof createPledgeInstallmentSchema>;
export type CreateBudget = z.infer<typeof createBudgetSchema>;
export type UpdateBudget = z.infer<typeof updateBudgetSchema>;
export type CreateBudgetLine = z.infer<typeof createBudgetLineSchema>;
export type UpdateBudgetLine = z.infer<typeof updateBudgetLineSchema>;
export type CreateDisbursement = z.infer<typeof createDisbursementSchema>;
export type UpdateDisbursement = z.infer<typeof updateDisbursementSchema>;
export type CreateFund = z.infer<typeof createFundSchema>;
export type UpdateFund = z.infer<typeof updateFundSchema>;
export type CreateGrant = z.infer<typeof createGrantSchema>;
export type UpdateGrant = z.infer<typeof updateGrantSchema>;
export type CreateGrantInstallment = z.infer<typeof createGrantInstallmentSchema>;
export type CreateApprovalItem = z.infer<typeof createApprovalItemSchema>;
export type ApproveReject = z.infer<typeof approveRejectSchema>;
export type ApprovalAction = z.infer<typeof approvalActionSchema>;
export type CreateFinancialReport = z.infer<typeof createFinancialReportSchema>;
export type GenerateReport = z.infer<typeof generateReportSchema>;
export type CreateFinancialAlert = z.infer<typeof createFinancialAlertSchema>;
