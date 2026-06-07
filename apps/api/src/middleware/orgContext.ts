import { Context, Next } from 'hono';
import { User } from '@supabase/supabase-js';
import { and, eq } from 'drizzle-orm';
import { can, OrgRole, PermissionAction, RbacModule } from '@gms/shared';
import { db } from '../db';
import { memberships, platform_admins } from '../db/schema';

export type OrgContextVars = {
    user: User;
    orgId: string;
    role: OrgRole;
    isPlatformAdmin: boolean;
};

function resolveRequestedOrg(c: Context): string | undefined {
    return c.req.header('x-org-id') || c.req.query('org_id') || undefined;
}

async function isPlatformAdmin(userId: string): Promise<boolean> {
    const rows = await db
        .select({ user_id: platform_admins.user_id })
        .from(platform_admins)
        .where(eq(platform_admins.user_id, userId))
        .limit(1);
    return rows.length > 0;
}

/**
 * Resolves the active org and the caller's role within it.
 * - Active org: x-org-id header, else ?org_id=, else the user's first membership.
 * - Platform admins may operate in ANY org with admin-level access (impersonation).
 * - Everyone else must have a membership in the resolved org.
 *
 * Must run after authMiddleware. Sets `orgId`, `role`, `isPlatformAdmin` on the context.
 * Returns a 403 if no valid org can be resolved.
 */
export async function orgContext(c: Context, next: Next) {
    const user = c.get('user') as User;
    const requestedOrg = resolveRequestedOrg(c);
    const platformAdmin = await isPlatformAdmin(user.id);

    const where = requestedOrg
        ? and(eq(memberships.user_id, user.id), eq(memberships.org_id, requestedOrg))
        : eq(memberships.user_id, user.id);

    const rows = await db
        .select({ org_id: memberships.org_id, role: memberships.role })
        .from(memberships)
        .where(where)
        .limit(1);

    const membership = rows[0];

    if (membership) {
        c.set('orgId', membership.org_id);
        c.set('role', membership.role as OrgRole);
        c.set('isPlatformAdmin', platformAdmin);
        await next();
        return;
    }

    // Platform admin entering an org they are not a member of (impersonation).
    if (platformAdmin && requestedOrg) {
        c.set('orgId', requestedOrg);
        c.set('role', 'admin' as OrgRole);
        c.set('isPlatformAdmin', true);
        await next();
        return;
    }

    return c.json({ error: 'No organization found' }, 403);
}

/**
 * Middleware factory that enforces the fixed permission matrix.
 * Platform admins bypass the check. Must run after orgContext.
 */
export function requirePermission(module: RbacModule, action: PermissionAction) {
    return async (c: Context, next: Next) => {
        if (c.get('isPlatformAdmin')) {
            await next();
            return;
        }
        const role = c.get('role') as OrgRole | undefined;
        if (!role || !can(role, module, action)) {
            return c.json({ error: 'Forbidden' }, 403);
        }
        await next();
    };
}

/** Guards platform-only routes. Must run after authMiddleware. */
export async function requirePlatformAdmin(c: Context, next: Next) {
    const user = c.get('user') as User;
    if (!(await isPlatformAdmin(user.id))) {
        return c.json({ error: 'Forbidden' }, 403);
    }
    c.set('isPlatformAdmin', true);
    await next();
}
