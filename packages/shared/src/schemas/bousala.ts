import { z } from 'zod/v4';

const bousalaKpiTrendSchema = z.enum(['up', 'down', 'stable']);
const bousalaTaskStatusSchema = z.enum(['in-progress', 'completed']);
const bousalaTaskPrioritySchema = z.enum(['high', 'medium', 'low']);

const bousalaKpiPredictionSchema = z.object({
    probability: z.number(),
    status: z.enum(['On Track', 'At Risk', 'Unlikely']),
});

const bousalaGoalPredictionSchema = z.object({
    probability: z.number(),
    trend: bousalaKpiTrendSchema,
    recommendation: z.string(),
});

export const createBousalaGoalSchema = z.object({
    title: z.string().min(1),
    description: z.string().default(''),
    responsible_person: z.string().default(''),
    deadline: z.string().nullable().optional(),
    progress: z.number().int().min(0).max(100).default(0),
    status: z.string().optional(),
    custom_fields: z.record(z.string(), z.unknown()).default({}),
});

export const updateBousalaGoalSchema = createBousalaGoalSchema.partial().extend({
    status: z.string().optional(),
});

export const createBousalaKpiSchema = z.object({
    title: z.string().min(1),
    value: z.number().default(0),
    target: z.number().default(0),
    unit: z.string().default(''),
    trend: bousalaKpiTrendSchema.default('stable'),
    kpi_description: z.string().default(''),
    custom_fields: z.record(z.string(), z.unknown()).default({}),
});

export const updateBousalaKpiSchema = createBousalaKpiSchema.partial().extend({
    kpi_description: z.string().optional(),
});

export const bousalaDirectionSchema = z.object({
    vision: z.string().default(''),
    mission: z.string().default(''),
    general: z.string().default(''),
});

export const updateBousalaDirectionSchema = bousalaDirectionSchema.partial();

export const updateBousalaGoalProjectSchema = z.object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    status: z.string().optional(),
    custom_fields: z.record(z.string(), z.unknown()).optional(),
});

export const linkBousalaProjectsSchema = z.object({
    projectIds: z.array(z.string().uuid()).min(1),
});

export const createBousalaTaskSchema = z.object({
    goal_project_id: z.string().uuid(),
    title: z.string().min(1),
    description: z.string().default(''),
    status: bousalaTaskStatusSchema.default('in-progress'),
    assignee: z.string().default(''),
    due_date: z.string().nullable().optional(),
    priority: bousalaTaskPrioritySchema.optional(),
    custom_fields: z.record(z.string(), z.unknown()).default({}),
});

export const updateBousalaTaskSchema = createBousalaTaskSchema
    .omit({ goal_project_id: true })
    .partial();

export { bousalaKpiPredictionSchema, bousalaGoalPredictionSchema };
