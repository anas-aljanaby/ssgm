import { z } from 'zod/v4';

const bilingualTextSchema = z.object({
    en: z.string().default(''),
    ar: z.string().default(''),
});

const mitigationItemSchema = z.object({
    en: z.string().default(''),
    ar: z.string().default(''),
});

const grcPolicyBaseSchema = z.object({
    title: bilingualTextSchema,
    category: z.string().default('compliance'),
    status: z.enum(['draft', 'active', 'archived']).default('draft'),
    version: z.string().default('1.0'),
    effectiveDate: z.string().optional(),
    reviewDate: z.string().optional(),
    ownerUserId: z.string().default(''),
    custom_fields: z.record(z.string(), z.unknown()).default({}),
});

export const createGrcPolicySchema = grcPolicyBaseSchema.superRefine((data, ctx) => {
    if (!data.title.en.trim() && !data.title.ar.trim()) {
        ctx.addIssue({ code: 'custom', message: 'title_required', path: ['title', 'en'] });
    }
});

export const updateGrcPolicySchema = grcPolicyBaseSchema.partial();

const grcDecisionBaseSchema = z.object({
    title: bilingualTextSchema,
    date: z.string().min(1),
    status: z.enum(['pending', 'approved', 'rejected', 'implemented']).default('pending'),
    impact: z.enum(['high', 'medium', 'low']).default('medium'),
    relatedPolicyId: z.string().uuid().optional(),
    custom_fields: z.record(z.string(), z.unknown()).default({}),
});

export const createGrcDecisionSchema = grcDecisionBaseSchema.superRefine((data, ctx) => {
    if (!data.title.en.trim() && !data.title.ar.trim()) {
        ctx.addIssue({ code: 'custom', message: 'title_required', path: ['title', 'en'] });
    }
});

export const updateGrcDecisionSchema = grcDecisionBaseSchema.partial();

const grcRiskBaseSchema = z.object({
    risk: bilingualTextSchema,
    category: z.string().default('operational'),
    probability: z.number().int().min(1).max(5).default(3),
    impact: z.number().int().min(1).max(5).default(3),
    score: z.number().int().min(1).max(25).optional(),
    level: z.enum(['Critical', 'High', 'Medium', 'Low']).optional(),
    scope: z.string().default('organization'),
    mitigation: z.array(mitigationItemSchema).default([]),
    status: z.enum(['identified', 'mitigating', 'monitored', 'closed']).default('identified'),
    custom_fields: z.record(z.string(), z.unknown()).default({}),
});

export const createGrcRiskSchema = grcRiskBaseSchema.superRefine((data, ctx) => {
    if (!data.risk.en.trim() && !data.risk.ar.trim()) {
        ctx.addIssue({ code: 'custom', message: 'risk_required', path: ['risk', 'en'] });
    }
});

export const updateGrcRiskSchema = grcRiskBaseSchema.partial();

const grcRequirementBaseSchema = z.object({
    code: z.string().min(1),
    title: bilingualTextSchema,
    source: z.string().default('regulatory'),
    sourceName: bilingualTextSchema,
    priority: z.enum(['high', 'medium', 'low']).default('medium'),
    nextDueDate: z.string().min(1),
    status: z.enum(['active', 'inactive']).default('active'),
    custom_fields: z.record(z.string(), z.unknown()).default({}),
});

export const createGrcRequirementSchema = grcRequirementBaseSchema;
export const updateGrcRequirementSchema = grcRequirementBaseSchema.partial();

export const createGrcAssessmentSchema = z.object({
    requirementId: z.string().uuid(),
    date: z.string().min(1),
    status: z.enum(['compliant', 'partially-compliant', 'non-compliant', 'not-assessed']).default('compliant'),
    score: z.number().int().min(0).max(100).default(100),
    assessorId: z.string().default(''),
    findings: bilingualTextSchema.optional(),
    custom_fields: z.record(z.string(), z.unknown()).default({}),
});

export const screenEntitySchema = z.object({
    name: z.string().min(1),
    type: z.enum(['individual', 'organization', 'vendor', 'partner']).default('individual'),
    country: z.string().min(1),
    listSourceLabel: z.string().default('Simulated watchlist'),
});

export type CreateGrcPolicy = z.infer<typeof createGrcPolicySchema>;
export type UpdateGrcPolicy = z.infer<typeof updateGrcPolicySchema>;
export type CreateGrcDecision = z.infer<typeof createGrcDecisionSchema>;
export type UpdateGrcDecision = z.infer<typeof updateGrcDecisionSchema>;
export type CreateGrcRisk = z.infer<typeof createGrcRiskSchema>;
export type UpdateGrcRisk = z.infer<typeof updateGrcRiskSchema>;
export type CreateGrcRequirement = z.infer<typeof createGrcRequirementSchema>;
export type UpdateGrcRequirement = z.infer<typeof updateGrcRequirementSchema>;
export type CreateGrcAssessment = z.infer<typeof createGrcAssessmentSchema>;
export type ScreenEntity = z.infer<typeof screenEntitySchema>;
