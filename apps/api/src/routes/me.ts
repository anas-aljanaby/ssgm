import { Hono } from 'hono';
import { User } from '@supabase/supabase-js';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { memberships, organizations, platform_admins } from '../db/schema';
import { authMiddleware } from '../middleware/auth';

type Variables = { user: User };

const me = new Hono<{ Variables: Variables }>();

me.use(authMiddleware);

me.get('/', async (c) => {
    const user = c.get('user');

    const rows = await db
        .select({
            membership_id: memberships.id,
            role: memberships.role,
            org_id: organizations.id,
            org_name: organizations.name,
        })
        .from(memberships)
        .innerJoin(organizations, eq(memberships.org_id, organizations.id))
        .where(eq(memberships.user_id, user.id));

    const platformAdminRows = await db
        .select({ user_id: platform_admins.user_id })
        .from(platform_admins)
        .where(eq(platform_admins.user_id, user.id))
        .limit(1);

    return c.json({
        id: user.id,
        email: user.email,
        is_platform_admin: platformAdminRows.length > 0,
        organizations: rows.map((r) => ({
            id: r.org_id,
            name: r.org_name,
            role: r.role,
            membership_id: r.membership_id,
        })),
    });
});

export { me };
