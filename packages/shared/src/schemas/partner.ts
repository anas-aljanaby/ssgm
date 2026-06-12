import { z } from 'zod/v4';

export const partnerSectorSchema = z.enum(['التعليم', 'الصحة', 'الإغاثة', 'التنمية', 'البيئة']);
export const partnerStatusSchema = z.enum(['نشط', 'غير نشط', 'قيد المراجعة']);

export const partnerContactSchema = z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    position: z.string().default(''),
    email: z.string().default(''),
    phone: z.string().optional(),
    whatsapp: z.string().optional(),
    isPrimary: z.boolean().default(false),
    photoUrl: z.string().default(''),
});

export const partnerCoordinatesSchema = z.object({
    lat: z.number(),
    lng: z.number(),
});

const partnerBaseSchema = z.object({
    name_en: z.string().default(''),
    name_ar: z.string().default(''),
    logo: z.string().default(''),
    sector: partnerSectorSchema,
    status: partnerStatusSchema.default('قيد المراجعة'),
    country: z.string().default(''),
    city: z.string().default(''),
    description: z.string().default(''),
    phone: z.string().default(''),
    email: z.union([z.literal(''), z.string().email()]).default(''),
    website: z.string().default(''),
    address: z.string().default(''),
    coordinates: partnerCoordinatesSchema.nullable().optional(),
    rating: z.number().min(0).max(5).default(0),
    budget: z.number().nonnegative().default(0),
    projectsCompleted: z.number().int().nonnegative().default(0),
    projectsInProgress: z.number().int().nonnegative().default(0),
    contacts: z.array(partnerContactSchema).default([]),
    custom_fields: z.record(z.string(), z.unknown()).default({}),
});

export const createPartnerSchema = partnerBaseSchema.superRefine((data, ctx) => {
    const en = data.name_en.trim();
    const ar = data.name_ar.trim();
    if (!en && !ar) {
        ctx.addIssue({
            code: 'custom',
            message: 'at_least_one_name_required',
            path: ['name_ar'],
        });
    }
    if (!data.country.trim()) {
        ctx.addIssue({
            code: 'custom',
            message: 'country_required',
            path: ['country'],
        });
    }
});

export const updatePartnerSchema = partnerBaseSchema.partial();

export const partnerDocumentCategorySchema = z.enum([
    'agreements',
    'legalCompliance',
    'reports',
    'correspondence',
    'media',
    'projectReports',
]);

export const createPartnerEvaluationSchema = z.object({
    reviewer: z.string().min(1),
    project: z.string().min(1),
    rating: z.number().int().min(1).max(5),
    comment: z.string().min(1),
});

export type CreatePartner = z.infer<typeof createPartnerSchema>;
export type UpdatePartner = z.infer<typeof updatePartnerSchema>;
export type CreatePartnerEvaluation = z.infer<typeof createPartnerEvaluationSchema>;
