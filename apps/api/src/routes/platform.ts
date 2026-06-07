import { Hono } from 'hono';
import { User } from '@supabase/supabase-js';
import { count, eq } from 'drizzle-orm';
import { z } from 'zod/v4';
import { db } from '../db';
import {
    beneficiaries,
    individual_donors,
    memberships,
    modules,
    organizations,
    projects,
} from '../db/schema';
import { DEFAULT_ORG_MODULES, deleteOrgData } from '../lib/deleteOrgData';
import { authMiddleware } from '../middleware/auth';
import { requirePlatformAdmin } from '../middleware/orgContext';

type Variables = { user: User; isPlatformAdmin: boolean };

const platformRouter = new Hono<{ Variables: Variables }>();

platformRouter.use(authMiddleware);
platformRouter.use(requirePlatformAdmin);

const createOrgSchema = z.object({
    name: z.string().trim().min(1, 'name_required'),
});

function creatorProfile(user: User) {
    const email = user.email ?? '';
    const metaName = typeof user.user_metadata?.name === 'string' ? user.user_metadata.name.trim() : '';
    const fallbackName = email.split('@')[0] || 'Administrator';
    const fullName = metaName || fallbackName;
    return {
        email,
        full_name_en: fullName,
        full_name_ar: fullName,
        title: 'Administrator',
        department: '',
    };
}

// List all organizations with their member counts (cross-tenant).
platformRouter.get('/orgs', async (c) => {
    const orgs = await db
        .select({ id: organizations.id, name: organizations.name, created_at: organizations.created_at })
        .from(organizations)
        .orderBy(organizations.created_at);

    const memberCounts = await db
        .select({ org_id: memberships.org_id, total: count() })
        .from(memberships)
        .groupBy(memberships.org_id);

    const countByOrg = new Map(memberCounts.map((r) => [r.org_id, Number(r.total)]));

    return c.json(
        orgs.map((o) => ({
            id: o.id,
            name: o.name,
            created_at: o.created_at?.toISOString() ?? null,
            member_count: countByOrg.get(o.id) ?? 0,
        })),
    );
});

// Create a new organization with default modules.
platformRouter.post('/orgs', async (c) => {
    const body = await c.req.json().catch(() => null);
    const parsed = createOrgSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);

    const [org] = await db
        .insert(organizations)
        .values({ name: parsed.data.name, custom_fields: {} })
        .returning();

    await db.insert(modules).values(
        DEFAULT_ORG_MODULES.map((name) => ({ org_id: org.id, name })),
    );

    const user = c.get('user');
    const profile = creatorProfile(user);
    await db.insert(memberships).values({
        org_id: org.id,
        user_id: user.id,
        role: 'admin',
        email: profile.email,
        full_name_en: profile.full_name_en,
        full_name_ar: profile.full_name_ar,
        title: profile.title,
        department: profile.department,
        status: 'active',
    });

    return c.json(
        {
            id: org.id,
            name: org.name,
            created_at: org.created_at?.toISOString() ?? null,
            member_count: 1,
        },
        201,
    );
});

// Single-org detail with high-level entity counts.
platformRouter.get('/orgs/:id', async (c) => {
    const id = c.req.param('id');
    const [org] = await db
        .select({ id: organizations.id, name: organizations.name, created_at: organizations.created_at })
        .from(organizations)
        .where(eq(organizations.id, id))
        .limit(1);
    if (!org) return c.json({ error: 'Not found' }, 404);

    const [memberRow] = await db.select({ total: count() }).from(memberships).where(eq(memberships.org_id, id));
    const [donorRow] = await db.select({ total: count() }).from(individual_donors).where(eq(individual_donors.org_id, id));
    const [projectRow] = await db.select({ total: count() }).from(projects).where(eq(projects.org_id, id));
    const [beneficiaryRow] = await db.select({ total: count() }).from(beneficiaries).where(eq(beneficiaries.org_id, id));

    return c.json({
        id: org.id,
        name: org.name,
        created_at: org.created_at?.toISOString() ?? null,
        counts: {
            members: Number(memberRow?.total ?? 0),
            donors: Number(donorRow?.total ?? 0),
            projects: Number(projectRow?.total ?? 0),
            beneficiaries: Number(beneficiaryRow?.total ?? 0),
        },
    });
});

// Delete an organization and all of its data. At least one org must remain.
platformRouter.delete('/orgs/:id', async (c) => {
    const id = c.req.param('id');

    const [totalRow] = await db.select({ total: count() }).from(organizations);
    if (Number(totalRow?.total ?? 0) <= 1) {
        return c.json({ error: 'last_org' }, 409);
    }

    await deleteOrgData(id);
    const deleted = await db
        .delete(organizations)
        .where(eq(organizations.id, id))
        .returning({ id: organizations.id });

    return c.json({ ok: true, alreadyDeleted: deleted.length === 0 });
});

export { platformRouter };
