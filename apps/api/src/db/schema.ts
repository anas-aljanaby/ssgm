import { boolean, integer, jsonb, numeric, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const organizations = pgTable('organizations', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    created_at: timestamp('created_at').defaultNow()
});

export const memberships = pgTable('memberships', {
    id: uuid('id').primaryKey().defaultRandom(),
    org_id: uuid('org_id').notNull().references(() => organizations.id),
    user_id: uuid('user_id').notNull(),
    role: text('role').notNull(),
    created_at: timestamp('created_at').defaultNow()
});

// Per-org registry of enabled modules. config stores module-specific settings.
// Convention: every domain table must have org_id (FK to organizations) and
// custom_fields jsonb for client-specific extensions.
export const modules = pgTable('modules', {
    id: uuid('id').primaryKey().defaultRandom(),
    org_id: uuid('org_id').notNull().references(() => organizations.id),
    name: text('name').notNull(),
    config: jsonb('config'),
    created_at: timestamp('created_at').defaultNow()
});

export const audit_log = pgTable('audit_log', {
    id: uuid('id').primaryKey().defaultRandom(),
    org_id: uuid('org_id').notNull().references(() => organizations.id),
    user_id: uuid('user_id').notNull(),
    action: text('action').notNull(),
    table_name: text('table_name').notNull(),
    record_id: uuid('record_id'),
    payload: jsonb('payload'),
    created_at: timestamp('created_at').defaultNow()
});

export const individual_donors = pgTable('individual_donors', {
    id: uuid('id').primaryKey().defaultRandom(),
    org_id: uuid('org_id').notNull().references(() => organizations.id),
    full_name_en: text('full_name_en').notNull(),
    full_name_ar: text('full_name_ar').default(''),
    email: text('email').notNull(),
    phone: text('phone').default(''),
    total_donations: numeric('total_donations', { precision: 12, scale: 2 }).default('0'),
    last_donation_date: timestamp('last_donation_date'),
    status: text('status').notNull().default('Active'),
    tier: text('tier').notNull().default('Bronze'),
    country: text('country').default(''),
    tags: jsonb('tags').default([]),
    assigned_manager: text('assigned_manager').default(''),
    avatar: text('avatar').default(''),
    donor_since: timestamp('donor_since'),
    donor_category: text('donor_category'),
    donations_count: integer('donations_count').default(0),
    avg_gift: numeric('avg_gift', { precision: 12, scale: 2 }),
    avg_days_between_donations: numeric('avg_days_between_donations', { precision: 8, scale: 1 }),
    primary_program_interest: text('primary_program_interest'),
    custom_fields: jsonb('custom_fields').default({}),
    created_at: timestamp('created_at').defaultNow(),
});

export const donations = pgTable('donations', {
    id: uuid('id').primaryKey().defaultRandom(),
    org_id: uuid('org_id').notNull().references(() => organizations.id),
    donor_id: uuid('donor_id').notNull().references(() => individual_donors.id),
    amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
    date: timestamp('date').notNull(),
    program: text('program').default(''),
    custom_fields: jsonb('custom_fields').default({}),
    created_at: timestamp('created_at').defaultNow(),
});

export const donor_tasks = pgTable('donor_tasks', {
    id: uuid('id').primaryKey().defaultRandom(),
    org_id: uuid('org_id').notNull().references(() => organizations.id),
    donor_id: uuid('donor_id').notNull().references(() => individual_donors.id),
    text: text('text').notNull(),
    type: text('type').notNull().default('Follow-up'),
    assigned_to: text('assigned_to').default(''),
    due_date: timestamp('due_date').notNull(),
    completed: boolean('completed').notNull().default(false),
    custom_fields: jsonb('custom_fields').default({}),
    created_at: timestamp('created_at').defaultNow(),
    updated_at: timestamp('updated_at').defaultNow(),
});

export const donor_interactions = pgTable('donor_interactions', {
    id: uuid('id').primaryKey().defaultRandom(),
    org_id: uuid('org_id').notNull().references(() => organizations.id),
    donor_id: uuid('donor_id').notNull().references(() => individual_donors.id),
    interaction_type: text('interaction_type').notNull().default('note'),
    occurred_at: timestamp('occurred_at').notNull().defaultNow(),
    subject: text('subject').notNull(),
    status: text('status').default('logged'),
    notes: text('notes').default(''),
    custom_fields: jsonb('custom_fields').default({}),
    created_at: timestamp('created_at').defaultNow(),
});

export const donor_documents = pgTable('donor_documents', {
    id: uuid('id').primaryKey().defaultRandom(),
    org_id: uuid('org_id').notNull().references(() => organizations.id),
    donor_id: uuid('donor_id').notNull().references(() => individual_donors.id),
    filename: text('filename').notNull(),
    file_url: text('file_url').notNull(),
    label: text('label').default('Document'),
    content_type: text('content_type'),
    size_bytes: integer('size_bytes'),
    custom_fields: jsonb('custom_fields').default({}),
    uploaded_at: timestamp('uploaded_at').defaultNow(),
});

// ═══════════════════════════════════════════════════════════════════════════
// FINANCIALS MODULE
// ═══════════════════════════════════════════════════════════════════════════

export const financial_transactions = pgTable('financial_transactions', {
    id: uuid('id').primaryKey().defaultRandom(),
    org_id: uuid('org_id').notNull().references(() => organizations.id),
    date: timestamp('date').notNull(),
    description_en: text('description_en').notNull(),
    description_ar: text('description_ar').default(''),
    amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
    currency: text('currency').notNull().default('USD'),
    direction: text('direction').notNull(),
    category: text('category').notNull(),
    status: text('status').notNull().default('draft'),
    reference: text('reference').notNull().default(''),
    related_entity_id: text('related_entity_id'),
    related_entity_type: text('related_entity_type'),
    related_entity_name: text('related_entity_name'),
    account_code: text('account_code'),
    fund_id: text('fund_id'),
    bank_account_id: text('bank_account_id'),
    approved_by: text('approved_by'),
    approved_date: timestamp('approved_date'),
    posted_by: text('posted_by'),
    posted_date: timestamp('posted_date'),
    notes: text('notes'),
    attachments_count: integer('attachments_count').default(0),
    custom_fields: jsonb('custom_fields').default({}),
    created_at: timestamp('created_at').defaultNow(),
    updated_at: timestamp('updated_at').defaultNow(),
});

export const transaction_attachments = pgTable('transaction_attachments', {
    id: uuid('id').primaryKey().defaultRandom(),
    org_id: uuid('org_id').notNull().references(() => organizations.id),
    transaction_id: uuid('transaction_id').notNull().references(() => financial_transactions.id),
    filename: text('filename').notNull(),
    file_url: text('file_url').notNull(),
    content_type: text('content_type'),
    size_bytes: integer('size_bytes'),
    custom_fields: jsonb('custom_fields').default({}),
    uploaded_at: timestamp('uploaded_at').defaultNow(),
});

export const donation_records = pgTable('donation_records', {
    id: uuid('id').primaryKey().defaultRandom(),
    org_id: uuid('org_id').notNull().references(() => organizations.id),
    donor_id: text('donor_id').notNull(),
    donor_name_en: text('donor_name_en').notNull(),
    donor_name_ar: text('donor_name_ar').default(''),
    donor_type: text('donor_type').notNull(),
    date: timestamp('date').notNull(),
    amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
    currency: text('currency').notNull().default('USD'),
    method: text('method').notNull(),
    designation: text('designation'),
    project_id: text('project_id'),
    project_name_en: text('project_name_en'),
    project_name_ar: text('project_name_ar'),
    fund_id: text('fund_id'),
    campaign_id: text('campaign_id'),
    campaign_name: text('campaign_name'),
    receipt_id: text('receipt_id'),
    receipt_status: text('receipt_status').notNull().default('pending'),
    receipt_number: text('receipt_number'),
    is_recurring: boolean('is_recurring').notNull().default(false),
    recurring_frequency: text('recurring_frequency'),
    notes: text('notes'),
    transaction_id: text('transaction_id'),
    custom_fields: jsonb('custom_fields').default({}),
    created_at: timestamp('created_at').defaultNow(),
});

export const financial_pledges = pgTable('financial_pledges', {
    id: uuid('id').primaryKey().defaultRandom(),
    org_id: uuid('org_id').notNull().references(() => organizations.id),
    donor_id: text('donor_id').notNull(),
    donor_name_en: text('donor_name_en').notNull(),
    donor_name_ar: text('donor_name_ar').default(''),
    donor_type: text('donor_type').notNull(),
    pledge_date: timestamp('pledge_date').notNull(),
    total_amount: numeric('total_amount', { precision: 12, scale: 2 }).notNull(),
    paid_amount: numeric('paid_amount', { precision: 12, scale: 2 }).notNull().default('0'),
    currency: text('currency').notNull().default('USD'),
    status: text('status').notNull().default('active'),
    designation: text('designation'),
    project_id: text('project_id'),
    project_name_en: text('project_name_en'),
    project_name_ar: text('project_name_ar'),
    fund_id: text('fund_id'),
    start_date: timestamp('start_date').notNull(),
    end_date: timestamp('end_date').notNull(),
    frequency: text('frequency').notNull(),
    notes: text('notes'),
    custom_fields: jsonb('custom_fields').default({}),
    created_at: timestamp('created_at').defaultNow(),
    updated_at: timestamp('updated_at').defaultNow(),
});

export const pledge_installments = pgTable('pledge_installments', {
    id: uuid('id').primaryKey().defaultRandom(),
    org_id: uuid('org_id').notNull().references(() => organizations.id),
    pledge_id: uuid('pledge_id').notNull().references(() => financial_pledges.id),
    due_date: timestamp('due_date').notNull(),
    amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
    paid_amount: numeric('paid_amount', { precision: 12, scale: 2 }).notNull().default('0'),
    paid_date: timestamp('paid_date'),
    status: text('status').notNull().default('pending'),
    transaction_id: text('transaction_id'),
    custom_fields: jsonb('custom_fields').default({}),
    created_at: timestamp('created_at').defaultNow(),
});

export const project_budgets = pgTable('project_budgets', {
    id: uuid('id').primaryKey().defaultRandom(),
    org_id: uuid('org_id').notNull().references(() => organizations.id),
    project_id: text('project_id').notNull(),
    project_name_en: text('project_name_en').notNull(),
    project_name_ar: text('project_name_ar').default(''),
    fiscal_year: text('fiscal_year').notNull(),
    total_planned: numeric('total_planned', { precision: 12, scale: 2 }).notNull().default('0'),
    total_actual: numeric('total_actual', { precision: 12, scale: 2 }).notNull().default('0'),
    total_committed: numeric('total_committed', { precision: 12, scale: 2 }).notNull().default('0'),
    currency: text('currency').notNull().default('USD'),
    status: text('status').notNull().default('draft'),
    custom_fields: jsonb('custom_fields').default({}),
    created_at: timestamp('created_at').defaultNow(),
    updated_at: timestamp('updated_at').defaultNow(),
});

export const budget_lines = pgTable('budget_lines', {
    id: uuid('id').primaryKey().defaultRandom(),
    org_id: uuid('org_id').notNull().references(() => organizations.id),
    budget_id: uuid('budget_id').notNull().references(() => project_budgets.id),
    account_code: text('account_code').notNull(),
    account_name_en: text('account_name_en').notNull(),
    account_name_ar: text('account_name_ar').default(''),
    category: text('category').notNull(),
    planned: numeric('planned', { precision: 12, scale: 2 }).notNull().default('0'),
    actual: numeric('actual', { precision: 12, scale: 2 }).notNull().default('0'),
    committed: numeric('committed', { precision: 12, scale: 2 }).notNull().default('0'),
    custom_fields: jsonb('custom_fields').default({}),
    created_at: timestamp('created_at').defaultNow(),
});

export const disbursements = pgTable('disbursements', {
    id: uuid('id').primaryKey().defaultRandom(),
    org_id: uuid('org_id').notNull().references(() => organizations.id),
    beneficiary_id: text('beneficiary_id').notNull(),
    beneficiary_name_en: text('beneficiary_name_en').notNull(),
    beneficiary_name_ar: text('beneficiary_name_ar').default(''),
    type: text('type').notNull(),
    amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
    currency: text('currency').notNull().default('USD'),
    status: text('status').notNull().default('scheduled'),
    scheduled_date: timestamp('scheduled_date').notNull(),
    processed_date: timestamp('processed_date'),
    project_id: text('project_id'),
    project_name_en: text('project_name_en'),
    project_name_ar: text('project_name_ar'),
    fund_id: text('fund_id'),
    method: text('method').notNull(),
    approved_by: text('approved_by'),
    notes: text('notes'),
    transaction_id: text('transaction_id'),
    custom_fields: jsonb('custom_fields').default({}),
    created_at: timestamp('created_at').defaultNow(),
    updated_at: timestamp('updated_at').defaultNow(),
});

export const funds = pgTable('funds', {
    id: uuid('id').primaryKey().defaultRandom(),
    org_id: uuid('org_id').notNull().references(() => organizations.id),
    name_en: text('name_en').notNull(),
    name_ar: text('name_ar').default(''),
    type: text('type').notNull(),
    balance: numeric('balance', { precision: 14, scale: 2 }).notNull().default('0'),
    currency: text('currency').notNull().default('USD'),
    donor_restriction: text('donor_restriction'),
    project_id: text('project_id'),
    project_name_en: text('project_name_en'),
    project_name_ar: text('project_name_ar'),
    institutional_donor_id: text('institutional_donor_id'),
    institutional_donor_name: text('institutional_donor_name'),
    start_date: timestamp('start_date').notNull(),
    end_date: timestamp('end_date'),
    total_received: numeric('total_received', { precision: 14, scale: 2 }).notNull().default('0'),
    total_spent: numeric('total_spent', { precision: 14, scale: 2 }).notNull().default('0'),
    total_committed: numeric('total_committed', { precision: 14, scale: 2 }).notNull().default('0'),
    custom_fields: jsonb('custom_fields').default({}),
    created_at: timestamp('created_at').defaultNow(),
    updated_at: timestamp('updated_at').defaultNow(),
});

export const grants = pgTable('grants', {
    id: uuid('id').primaryKey().defaultRandom(),
    org_id: uuid('org_id').notNull().references(() => organizations.id),
    grantor_id: text('grantor_id').notNull(),
    grantor_name: text('grantor_name').notNull(),
    grant_number: text('grant_number').notNull(),
    title_en: text('title_en').notNull(),
    title_ar: text('title_ar').default(''),
    total_amount: numeric('total_amount', { precision: 14, scale: 2 }).notNull(),
    received_amount: numeric('received_amount', { precision: 14, scale: 2 }).notNull().default('0'),
    currency: text('currency').notNull().default('USD'),
    start_date: timestamp('start_date').notNull(),
    end_date: timestamp('end_date').notNull(),
    status: text('status').notNull().default('pending'),
    fund_id: text('fund_id').notNull(),
    project_id: text('project_id'),
    project_name_en: text('project_name_en'),
    project_name_ar: text('project_name_ar'),
    reporting_requirements: text('reporting_requirements'),
    custom_fields: jsonb('custom_fields').default({}),
    created_at: timestamp('created_at').defaultNow(),
    updated_at: timestamp('updated_at').defaultNow(),
});

export const grant_installments = pgTable('grant_installments', {
    id: uuid('id').primaryKey().defaultRandom(),
    org_id: uuid('org_id').notNull().references(() => organizations.id),
    grant_id: uuid('grant_id').notNull().references(() => grants.id),
    due_date: timestamp('due_date').notNull(),
    amount: numeric('amount', { precision: 14, scale: 2 }).notNull(),
    received_amount: numeric('received_amount', { precision: 14, scale: 2 }).notNull().default('0'),
    received_date: timestamp('received_date'),
    status: text('status').notNull().default('pending'),
    custom_fields: jsonb('custom_fields').default({}),
    created_at: timestamp('created_at').defaultNow(),
});

export const approval_items = pgTable('approval_items', {
    id: uuid('id').primaryKey().defaultRandom(),
    org_id: uuid('org_id').notNull().references(() => organizations.id),
    type: text('type').notNull(),
    title: text('title').notNull(),
    description: text('description').notNull(),
    amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
    currency: text('currency').notNull().default('USD'),
    requested_by: text('requested_by').notNull(),
    requested_date: timestamp('requested_date').notNull(),
    priority: text('priority').notNull().default('medium'),
    status: text('status').notNull().default('pending'),
    related_entity_id: text('related_entity_id'),
    related_entity_name: text('related_entity_name'),
    current_step: integer('current_step').notNull().default(1),
    total_steps: integer('total_steps').notNull().default(1),
    workflow_id: text('workflow_id').notNull(),
    due_date: timestamp('due_date'),
    approved_by: text('approved_by'),
    approved_date: timestamp('approved_date'),
    rejected_by: text('rejected_by'),
    rejected_date: timestamp('rejected_date'),
    custom_fields: jsonb('custom_fields').default({}),
    created_at: timestamp('created_at').defaultNow(),
    updated_at: timestamp('updated_at').defaultNow(),
});

export const financial_reports = pgTable('financial_reports', {
    id: uuid('id').primaryKey().defaultRandom(),
    org_id: uuid('org_id').notNull().references(() => organizations.id),
    type: text('type').notNull(),
    name_en: text('name_en').notNull(),
    name_ar: text('name_ar').default(''),
    description_en: text('description_en').notNull(),
    description_ar: text('description_ar').default(''),
    last_generated: timestamp('last_generated'),
    format: text('format').notNull().default('pdf'),
    period: text('period'),
    file_url: text('file_url'),
    custom_fields: jsonb('custom_fields').default({}),
    created_at: timestamp('created_at').defaultNow(),
});

export const financial_alerts = pgTable('financial_alerts', {
    id: uuid('id').primaryKey().defaultRandom(),
    org_id: uuid('org_id').notNull().references(() => organizations.id),
    type: text('type').notNull(),
    message_en: text('message_en').notNull(),
    message_ar: text('message_ar').default(''),
    date: timestamp('date').notNull(),
    related_entity_id: text('related_entity_id'),
    action_required: boolean('action_required').notNull().default(false),
    dismissed: boolean('dismissed').notNull().default(false),
    custom_fields: jsonb('custom_fields').default({}),
    created_at: timestamp('created_at').defaultNow(),
});
