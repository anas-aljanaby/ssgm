import { z } from 'zod/v4';

export const griDisclosureStatusSchema = z.enum(['not_started', 'in_progress', 'complete']);

export const griDisclosureResponseSchema = z.object({
    disclosureNumber: z.string().min(1),
    narrative: z.string().default(''),
    status: griDisclosureStatusSchema.default('not_started'),
    reference: z.string().default(''),
    custom_fields: z.record(z.string(), z.unknown()).default({}),
});

export const createGriReportSchema = z.object({
    reportPeriod: z.string().default(''),
    frameworkVersion: z.string().default('GRI Standards 2021'),
    materialTopics: z.array(z.string()).default([]),
    responses: z.array(griDisclosureResponseSchema).default([]),
    custom_fields: z.record(z.string(), z.unknown()).default({}),
});

export const updateGriReportSchema = createGriReportSchema.partial();

export type GriDisclosureStatus = z.infer<typeof griDisclosureStatusSchema>;
export type GriDisclosureResponse = z.infer<typeof griDisclosureResponseSchema>;
export type CreateGriReport = z.infer<typeof createGriReportSchema>;
export type UpdateGriReport = z.infer<typeof updateGriReportSchema>;
