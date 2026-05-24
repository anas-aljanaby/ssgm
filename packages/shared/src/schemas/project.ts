import { z } from 'zod/v4';

const projectTypeSchema = z.enum(['humanitarian', 'development', 'health', 'education', 'infrastructure']);
const projectStageSchema = z.enum(['design', 'planning', 'implementation', 'monitoring', 'closure']);
const kpiUnitSchema = z.enum(['number', 'percentage', 'text']);
const riskLevelSchema = z.enum(['low', 'medium', 'high']);
const riskCategorySchema = z.enum(['financial', 'security', 'operational', 'political', 'reputational']);
const riskResponseSchema = z.enum(['avoid', 'mitigate', 'transfer', 'accept']);
const riskStatusSchema = z.enum(['open', 'in-progress', 'closed']);

const projectNameSchema = z.object({
    en: z.string().default(''),
    ar: z.string().default(''),
});

const projectLocationSchema = z.object({
    country: z.string().default(''),
    city: z.string().default(''),
    region: z.string().optional().default(''),
});

const projectStakeholdersSchema = z.object({
    donor: z.string().default(''),
    implementingPartner: z.string().optional().default(''),
    targetBeneficiaries: z.string().default(''),
    primaryContact: z.string().default(''),
});

const scopeStatementSchema = z.object({
    inScope: z.array(z.string()).default([]),
    outOfScope: z.array(z.string()).default([]),
    assumptions: z.array(z.string()).default([]),
    constraints: z.array(z.string()).default([]),
});

const projectKpiSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1),
    unit: kpiUnitSchema.default('number'),
    target: z.string().default(''),
});

const projectTaskPayloadSchema = z.object({
    name: z.string().min(1),
    start: z.string().default(''),
    end: z.string().default(''),
    progress: z.number().int().min(0).max(100).default(0),
});

const projectRiskPayloadSchema = z.object({
    description: z.string().min(1),
    category: riskCategorySchema.default('operational'),
    probability: riskLevelSchema.default('medium'),
    impact: riskLevelSchema.default('medium'),
    responseStrategy: riskResponseSchema.default('mitigate'),
    contingencyPlan: z.string().default(''),
    owner: z.string().default(''),
    status: riskStatusSchema.default('open'),
});

const projectExpensePayloadSchema = z.object({
    date: z.string().min(1),
    description: z.string().min(1),
    category: z.string().default('other'),
    amount: z.number().positive(),
});

export const createProjectSchema = z.object({
    name: projectNameSchema,
    type: projectTypeSchema.default('humanitarian'),
    stage: projectStageSchema.default('design'),
    sdgGoals: z.array(z.number().int().min(1).max(17)).optional().default([]),
    plannedStartDate: z.string().default(''),
    plannedEndDate: z.string().default(''),
    location: projectLocationSchema,
    stakeholders: projectStakeholdersSchema,
    goal: z.string().default(''),
    objectives: z.array(z.string()).default([]),
    expectedOutcomes: z.array(z.string()).default([]),
    kpis: z.array(projectKpiSchema).default([]),
    progress: z.number().int().min(0).max(100).default(0),
    budget: z.number().min(0).default(0),
    spent: z.number().min(0).default(0),
    scopeStatement: scopeStatementSchema.default({
        inScope: [],
        outOfScope: [],
        assumptions: [],
        constraints: [],
    }),
});

export const updateProjectSchema = createProjectSchema.partial();

export const createProjectTaskSchema = projectTaskPayloadSchema;
export const updateProjectTaskSchema = projectTaskPayloadSchema.partial();

export const createProjectRiskSchema = projectRiskPayloadSchema;
export const updateProjectRiskSchema = projectRiskPayloadSchema.partial();

export const createProjectExpenseSchema = projectExpensePayloadSchema;

export type CreateProject = z.infer<typeof createProjectSchema>;
export type UpdateProject = z.infer<typeof updateProjectSchema>;
export type CreateProjectTask = z.infer<typeof createProjectTaskSchema>;
export type UpdateProjectTask = z.infer<typeof updateProjectTaskSchema>;
export type CreateProjectRisk = z.infer<typeof createProjectRiskSchema>;
export type UpdateProjectRisk = z.infer<typeof updateProjectRiskSchema>;
export type CreateProjectExpense = z.infer<typeof createProjectExpenseSchema>;
