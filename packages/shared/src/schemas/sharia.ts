import { z } from 'zod';

const localizedSchema = z.object({
    en: z.string(),
    ar: z.string().optional().default(''),
});

const shariaPrioritySchema = z.enum(['low', 'medium', 'high', 'critical']);
const fatwaStatusSchema = z.enum(['draft', 'submitted', 'underReview', 'issued', 'archived']);
const reviewStatusSchema = z.enum([
    'submitted',
    'underReview',
    'needsClarification',
    'approved',
    'approvedWithConditions',
    'rejected',
]);
const reviewTypeSchema = z.enum([
    'contract',
    'policy',
    'investmentProposal',
    'grantAgreement',
    'procurementContract',
    'financialProduct',
]);
const reviewDecisionSchema = z.enum(['approved', 'approvedWithConditions', 'rejected', 'needsClarification']);
const zakatEligibilitySchema = z.enum(['eligible', 'ineligible', 'needsReview', 'certified']);
const exceptionStatusSchema = z.enum(['open', 'inReview', 'resolved', 'closed']);
const exceptionSeveritySchema = z.enum(['critical', 'high', 'medium', 'low']);

const statusHistoryItemSchema = z.object({
    status: z.string(),
    actor: z.string(),
    date: z.string(),
});

const createFatwaBaseSchema = z.object({
    topic: localizedSchema,
    question: localizedSchema,
    requester: z.string().min(1),
    relatedModule: z.string().min(1),
    relatedRecord: z.string().optional().default(''),
    status: fatwaStatusSchema.optional().default('submitted'),
    priority: shariaPrioritySchema,
    assignedReviewerId: z.string().min(1),
    requestedDate: z.string().min(1),
    dueDate: z.string().min(1),
    issuedDate: z.string().optional(),
    rulingSummary: localizedSchema.optional().default({ en: '', ar: '' }),
    reviewNotes: localizedSchema.optional().default({ en: '', ar: '' }),
    attachmentsCount: z.number().int().min(0).optional().default(0),
    statusHistory: z.array(statusHistoryItemSchema).optional(),
    custom_fields: z.record(z.unknown()).optional().default({}),
});

export const createShariaFatwaSchema = createFatwaBaseSchema.superRefine((data, ctx) => {
    if (!data.topic.en.trim() && !data.topic.ar.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Topic is required', path: ['topic'] });
    }
    if (!data.question.en.trim() && !data.question.ar.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Question is required', path: ['question'] });
    }
});

export const updateShariaFatwaSchema = createFatwaBaseSchema.partial();

const createReviewBaseSchema = z.object({
    title: localizedSchema,
    type: reviewTypeSchema,
    description: localizedSchema,
    sourceModule: z.string().min(1),
    sourceRecord: z.string().optional().default(''),
    counterpartyOrProject: z.string().min(1),
    status: reviewStatusSchema.optional().default('submitted'),
    riskFlag: shariaPrioritySchema,
    priority: shariaPrioritySchema,
    assignedReviewerId: z.string().min(1),
    dueDate: z.string().min(1),
    submittedDate: z.string().min(1),
    decision: reviewDecisionSchema.optional(),
    conditions: localizedSchema.optional().default({ en: '', ar: '' }),
    reviewNotes: localizedSchema.optional().default({ en: '', ar: '' }),
    attachmentsCount: z.number().int().min(0).optional().default(0),
    activityHistory: z.array(statusHistoryItemSchema).optional(),
    custom_fields: z.record(z.unknown()).optional().default({}),
});

export const createShariaReviewSchema = createReviewBaseSchema.superRefine((data, ctx) => {
    if (!data.title.en.trim() && !data.title.ar.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Title is required', path: ['title'] });
    }
    if (!data.description.en.trim() && !data.description.ar.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Description is required', path: ['description'] });
    }
});

export const updateShariaReviewSchema = createReviewBaseSchema.partial();

const createZakatReviewBaseSchema = z.object({
    beneficiaryOrProgram: localizedSchema,
    category: z.string().min(1),
    amount: z.number().positive(),
    date: z.string().min(1),
    eligibilityStatus: zakatEligibilitySchema,
    financialTransaction: z.string().optional().default(''),
    financialTransactionId: z.string().uuid().optional().nullable(),
    reviewerId: z.string().min(1),
    notes: localizedSchema.optional().default({ en: '', ar: '' }),
    custom_fields: z.record(z.unknown()).optional().default({}),
});

export const createShariaZakatReviewSchema = createZakatReviewBaseSchema.superRefine((data, ctx) => {
    if (!data.beneficiaryOrProgram.en.trim() && !data.beneficiaryOrProgram.ar.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Beneficiary/program is required', path: ['beneficiaryOrProgram'] });
    }
});

export const updateShariaZakatReviewSchema = createZakatReviewBaseSchema.partial();

const createPolicyRuleBaseSchema = z.object({
    category: z.string().min(1),
    rule: localizedSchema,
    threshold: z.string().optional().default(''),
    effectiveDate: z.string().min(1),
    status: z.enum(['active', 'review']).optional().default('active'),
    custom_fields: z.record(z.unknown()).optional().default({}),
});

export const createShariaZakatPolicyRuleSchema = createPolicyRuleBaseSchema;
export const updateShariaZakatPolicyRuleSchema = createPolicyRuleBaseSchema.partial();

const createExceptionBaseSchema = z.object({
    title: localizedSchema,
    severity: exceptionSeveritySchema,
    source: z.string().min(1),
    linkedRecord: z.string().optional().default(''),
    owner: z.string().optional().default(''),
    status: exceptionStatusSchema.optional().default('open'),
    createdDate: z.string().min(1),
    resolutionNotes: localizedSchema.optional().default({ en: '', ar: '' }),
    followUpDate: z.string().optional(),
    custom_fields: z.record(z.unknown()).optional().default({}),
});

export const createShariaExceptionSchema = createExceptionBaseSchema.superRefine((data, ctx) => {
    if (!data.title.en.trim() && !data.title.ar.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Title is required', path: ['title'] });
    }
});

export const updateShariaExceptionSchema = createExceptionBaseSchema.partial();
