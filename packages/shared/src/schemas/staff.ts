import { z } from 'zod/v4';
import { orgRoleSchema } from '../constants/rbac';

export const staffStatusSchema = z.enum(['active', 'disabled']);

const staffProfileSchema = z.object({
    full_name_en: z.string().trim().min(1, 'name_required'),
    full_name_ar: z.string().trim().default(''),
    role: orgRoleSchema,
    title: z.string().trim().default(''),
    department: z.string().trim().default(''),
    phone: z.string().trim().default(''),
    avatar: z.string().trim().default(''),
    status: staffStatusSchema.default('active'),
    custom_fields: z.record(z.string(), z.unknown()).default({}),
});

export const createStaffSchema = staffProfileSchema.extend({
    email: z.string().email(),
    // Optional: if omitted, the server generates a temporary password.
    password: z.string().min(8).optional(),
});

// Email is immutable after creation (it identifies the auth user), so it is not updatable here.
export const updateStaffSchema = staffProfileSchema.partial().extend({
    password: z.string().min(8).optional(),
});

export type CreateStaff = z.infer<typeof createStaffSchema>;
export type UpdateStaff = z.infer<typeof updateStaffSchema>;
