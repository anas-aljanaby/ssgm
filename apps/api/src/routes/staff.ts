import { Hono } from 'hono';
import { User } from '@supabase/supabase-js';
import { and, desc, eq, ne } from 'drizzle-orm';
import { randomBytes } from 'node:crypto';
import { createStaffSchema, updateStaffSchema } from '@gms/shared';
import { db } from '../db';
import { memberships } from '../db/schema';
import { supabaseAdmin } from '../lib/supabaseAdmin';
import { authMiddleware } from '../middleware/auth';
import { OrgContextVars, orgContext, requirePermission } from '../middleware/orgContext';

const staffRouter = new Hono<{ Variables: OrgContextVars }>();

staffRouter.use(authMiddleware);
staffRouter.use(orgContext);

type MembershipRow = typeof memberships.$inferSelect;

function isRecord(value: unknown): value is Record<string, unknown> {
    return !!value && typeof value === 'object' && !Array.isArray(value);
}

function sanitizeCustomFields(value: unknown): Record<string, unknown> {
    if (!isRecord(value)) return {};
    const { demo_password: _removed, ...rest } = value;
    return rest;
}

function mapStaff(row: MembershipRow) {
    const custom_fields = sanitizeCustomFields(row.custom_fields);
    return {
        id: row.id,
        user_id: row.user_id,
        role: row.role,
        email: row.email,
        name: { en: row.full_name_en, ar: row.full_name_ar || row.full_name_en },
        title: row.title,
        department: row.department,
        phone: row.phone,
        avatar: row.avatar,
        status: row.status,
        custom_fields,
        created_at: row.created_at?.toISOString() ?? null,
    };
}

const PLACEHOLDER_USER_ID = '00000000-0000-0000-0000-000000000000';

function generatePassword(): string {
    // 16 url-safe chars; enough entropy for a temporary credential.
    return randomBytes(12).toString('base64url');
}

async function deleteAuthUserIfOrphaned(userId: string) {
    if (!userId || userId === PLACEHOLDER_USER_ID) return;

    const otherMemberships = await db
        .select({ id: memberships.id })
        .from(memberships)
        .where(eq(memberships.user_id, userId))
        .limit(1);

    if (otherMemberships.length > 0) return;

    await supabaseAdmin.auth.admin.deleteUser(userId);
}

async function getOrgMembership(id: string, orgId: string) {
    const rows = await db
        .select()
        .from(memberships)
        .where(and(eq(memberships.id, id), eq(memberships.org_id, orgId)))
        .limit(1);
    return rows[0] ?? null;
}

// Counts admins in the org other than the given membership id.
async function countOtherAdmins(orgId: string, exceptId: string): Promise<number> {
    const rows = await db
        .select({ id: memberships.id })
        .from(memberships)
        .where(
            and(eq(memberships.org_id, orgId), eq(memberships.role, 'admin'), ne(memberships.id, exceptId)),
        );
    return rows.length;
}

staffRouter.get('/', requirePermission('staff', 'read'), async (c) => {
    const orgId = c.get('orgId');
    const rows = await db
        .select()
        .from(memberships)
        .where(eq(memberships.org_id, orgId))
        .orderBy(desc(memberships.created_at));
    return c.json(rows.map(mapStaff));
});

staffRouter.post('/', requirePermission('staff', 'write'), async (c) => {
    const orgId = c.get('orgId');
    const body = await c.req.json();
    const parsed = createStaffSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);
    const data = parsed.data;

    const password = data.password ?? generatePassword();

    // Create the auth user. If the email already exists this errors — surface it.
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
        email: data.email,
        password,
        email_confirm: true,
        user_metadata: { name: data.full_name_en },
    });
    if (error || !created?.user) {
        return c.json({ error: error?.message || 'Could not create user' }, 400);
    }

    const [row] = await db
        .insert(memberships)
        .values({
            org_id: orgId,
            user_id: created.user.id,
            role: data.role,
            email: data.email,
            full_name_en: data.full_name_en,
            full_name_ar: data.full_name_ar,
            title: data.title,
            department: data.department,
            phone: data.phone,
            avatar: data.avatar,
            status: data.status,
            custom_fields: sanitizeCustomFields(data.custom_fields),
        })
        .returning();

    // Return the temp password once when the server auto-generated it.
    return c.json({ ...mapStaff(row), temp_password: data.password ? undefined : password }, 201);
});

staffRouter.patch('/:id', requirePermission('staff', 'write'), async (c) => {
    const orgId = c.get('orgId');
    const existing = await getOrgMembership(c.req.param('id')!, orgId);
    if (!existing) return c.json({ error: 'Not found' }, 404);

    const body = await c.req.json();
    const parsed = updateStaffSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);
    const data = parsed.data;

    // Guard: never leave an org without an admin.
    const losesAdmin =
        existing.role === 'admin' &&
        ((data.role !== undefined && data.role !== 'admin') || data.status === 'disabled');
    if (losesAdmin && (await countOtherAdmins(orgId, existing.id)) === 0) {
        return c.json({ error: 'last_admin' }, 409);
    }

    const values: Record<string, unknown> = {};
    if (data.role !== undefined) values.role = data.role;
    if (data.full_name_en !== undefined) values.full_name_en = data.full_name_en;
    if (data.full_name_ar !== undefined) values.full_name_ar = data.full_name_ar;
    if (data.title !== undefined) values.title = data.title;
    if (data.department !== undefined) values.department = data.department;
    if (data.phone !== undefined) values.phone = data.phone;
    if (data.avatar !== undefined) values.avatar = data.avatar;
    if (data.status !== undefined) values.status = data.status;
    if (data.custom_fields !== undefined) {
        values.custom_fields = sanitizeCustomFields({
            ...(isRecord(existing.custom_fields) ? existing.custom_fields : {}),
            ...data.custom_fields,
        });
    }

    if (data.password !== undefined) {
        if (existing.user_id && existing.user_id !== PLACEHOLDER_USER_ID) {
            const { error } = await supabaseAdmin.auth.admin.updateUserById(existing.user_id, {
                password: data.password,
            });
            if (error) return c.json({ error: error.message || 'Could not update password' }, 400);
        }
    }

    if (Object.keys(values).length === 0) return c.json(mapStaff(existing));

    const [updated] = await db
        .update(memberships)
        .set(values)
        .where(and(eq(memberships.id, existing.id), eq(memberships.org_id, orgId)))
        .returning();
    return c.json(mapStaff(updated));
});

staffRouter.delete('/:id', requirePermission('staff', 'write'), async (c) => {
    const orgId = c.get('orgId');
    const user = c.get('user') as User;
    const existing = await getOrgMembership(c.req.param('id')!, orgId);
    if (!existing) return c.json({ ok: true, alreadyDeleted: true });

    if (existing.user_id === user.id) {
        return c.json({ error: 'cannot_remove_self' }, 409);
    }
    if (existing.role === 'admin' && (await countOtherAdmins(orgId, existing.id)) === 0) {
        return c.json({ error: 'last_admin' }, 409);
    }

    const userId = existing.user_id;
    await db.delete(memberships).where(and(eq(memberships.id, existing.id), eq(memberships.org_id, orgId)));
    await deleteAuthUserIfOrphaned(userId);

    return c.json({ ok: true });
});

export { staffRouter };
