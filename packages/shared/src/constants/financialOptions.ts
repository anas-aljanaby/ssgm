// ─── Transaction ────────────────────────────────────────────────────────────
export const TRANSACTION_STATUSES = ['draft', 'pending', 'approved', 'posted', 'reconciled', 'voided'] as const;
export const TRANSACTION_DIRECTIONS = ['inflow', 'outflow'] as const;
export const TRANSACTION_CATEGORIES = [
    'donation', 'grant_income', 'sponsorship_income', 'investment_income', 'other_income',
    'project_expense', 'operational_expense', 'disbursement', 'payroll', 'procurement', 'refund',
] as const;
export const RELATED_ENTITY_TYPES = ['donor', 'project', 'beneficiary', 'institutional_donor', 'vendor'] as const;

// ─── Donation ───────────────────────────────────────────────────────────────
export const DONATION_METHODS = ['bank_transfer', 'credit_card', 'cash', 'check', 'online_gateway', 'in_kind'] as const;
export const RECEIPT_STATUSES = ['pending', 'generated', 'sent', 'voided'] as const;
export const DONOR_TYPES = ['individual', 'institutional'] as const;

// ─── Pledge ─────────────────────────────────────────────────────────────────
export const PLEDGE_STATUSES = ['active', 'fulfilled', 'partially_fulfilled', 'overdue', 'cancelled', 'written_off'] as const;
export const PLEDGE_INSTALLMENT_STATUSES = ['pending', 'paid', 'overdue', 'partial'] as const;
export const PLEDGE_FREQUENCIES = ['one_time', 'monthly', 'quarterly', 'annually'] as const;

// ─── Budget ─────────────────────────────────────────────────────────────────
export const BUDGET_STATUSES = ['draft', 'approved', 'active', 'closed', 'over_budget'] as const;

// ─── Disbursement ───────────────────────────────────────────────────────────
export const DISBURSEMENT_TYPES = ['aid_payment', 'sponsorship_stipend', 'emergency_relief', 'project_grant', 'scholarship'] as const;
export const DISBURSEMENT_STATUSES = ['scheduled', 'pending_approval', 'approved', 'processing', 'completed', 'failed', 'cancelled'] as const;
export const DISBURSEMENT_METHODS = ['bank_transfer', 'cash', 'mobile_money', 'voucher'] as const;

// ─── Fund ───────────────────────────────────────────────────────────────────
export const FUND_TYPES = ['unrestricted', 'temporarily_restricted', 'permanently_restricted'] as const;

// ─── Grant ──────────────────────────────────────────────────────────────────
export const GRANT_STATUSES = ['active', 'completed', 'pending', 'suspended'] as const;
export const GRANT_INSTALLMENT_STATUSES = ['pending', 'received', 'overdue'] as const;

// ─── Approval ───────────────────────────────────────────────────────────────
export const APPROVAL_ITEM_TYPES = ['expense', 'disbursement', 'purchase_requisition', 'journal_entry', 'budget_amendment', 'refund'] as const;
export const APPROVAL_STATUSES = ['pending', 'approved', 'rejected', 'escalated'] as const;
export const APPROVAL_PRIORITIES = ['high', 'medium', 'low'] as const;

// ─── Report ─────────────────────────────────────────────────────────────────
export const FINANCIAL_REPORT_TYPES = [
    'income_statement', 'balance_sheet', 'cash_flow', 'donor_report',
    'project_financial', 'fund_utilization', 'budget_variance', 'aging_report',
] as const;
export const REPORT_FORMATS = ['pdf', 'xlsx', 'csv'] as const;

// ─── Alert ──────────────────────────────────────────────────────────────────
export const ALERT_TYPES = ['warning', 'danger', 'info'] as const;
