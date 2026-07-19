import { and, eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import {
    DEFAULT_ENABLED_MODULE_KEYS,
    DEFAULT_MODULE_ORDER,
    LOCKED_MODULE_KEYS,
    ModuleKey,
    normalizeModuleName,
} from '@gms/shared';
import { db } from '../db';
import * as schema from '../db/schema';

const { modules } = schema;
const SIDEBAR_ORDER_VERSION = 4;

type AppDb = PostgresJsDatabase<typeof schema>;

export { DEFAULT_ENABLED_MODULE_KEYS, DEFAULT_MODULE_ORDER, LOCKED_MODULE_KEYS };

export function isLockedModuleKey(name: string): boolean {
    return (LOCKED_MODULE_KEYS as readonly string[]).includes(name);
}

export function defaultSortOrder(name: ModuleKey): number {
    const idx = DEFAULT_MODULE_ORDER.indexOf(name);
    return idx === -1 ? DEFAULT_MODULE_ORDER.length : idx;
}

export function defaultEnabled(name: ModuleKey): boolean {
    return (DEFAULT_ENABLED_MODULE_KEYS as readonly string[]).includes(name);
}

async function migrateSidebarOrderVersion(orgId: string, database: AppDb = db) {
    const rows = await database
        .select({
            id: modules.id,
            name: modules.name,
            sort_order: modules.sort_order,
            config: modules.config,
        })
        .from(modules)
        .where(eq(modules.org_id, orgId));

    const settingsRow = rows.find((row) => row.name === 'settings');
    const config =
        settingsRow?.config && typeof settingsRow.config === 'object'
            ? (settingsRow.config as Record<string, unknown>)
            : {};
    const currentVersion =
        typeof config.sidebar_order_version === 'number' ? config.sidebar_order_version : 0;

    if (currentVersion >= SIDEBAR_ORDER_VERSION) return;

    const now = new Date();

    for (const [sort_order, name] of DEFAULT_MODULE_ORDER.entries()) {
        const row = rows.find((item) => item.name === name);
        if (!row || row.sort_order === sort_order) continue;

        await database
            .update(modules)
            .set({ sort_order, updated_at: now })
            .where(eq(modules.id, row.id));
    }

    if (settingsRow) {
        await database
            .update(modules)
            .set({
                config: {
                    ...config,
                    sidebar_order_version: SIDEBAR_ORDER_VERSION,
                },
                updated_at: now,
            })
            .where(eq(modules.id, settingsRow.id));
    }
}

/** Insert the full catalog for a new org (idempotent on conflict). */
export async function seedOrgModules(orgId: string, database: AppDb = db) {
    const values = DEFAULT_MODULE_ORDER.map((name) => ({
        org_id: orgId,
        name,
        enabled: defaultEnabled(name),
        sort_order: defaultSortOrder(name),
        label_en: null,
        label_ar: null,
        config: null,
    }));

    for (const row of values) {
        await database
            .insert(modules)
            .values(row)
            .onConflictDoNothing({ target: [modules.org_id, modules.name] });
    }
}

/** Ensure every catalog module exists for an org; backfill missing rows. */
export async function ensureOrgModuleCatalog(orgId: string, database: AppDb = db) {
    const existing = await database
        .select({ name: modules.name })
        .from(modules)
        .where(eq(modules.org_id, orgId));

    const existingKeys = new Set(existing.map((r) => r.name));
    const missing = DEFAULT_MODULE_ORDER.filter((key) => !existingKeys.has(key));

    if (missing.length > 0) {
        await database.insert(modules).values(
            missing.map((name) => ({
                org_id: orgId,
                name,
                enabled: defaultEnabled(name),
                sort_order: defaultSortOrder(name),
                label_en: null,
                label_ar: null,
                config: null,
            })),
        );
    }

    await migrateSidebarOrderVersion(orgId, database);
}

/** One-time normalization for orgs created before canonical keys. */
export async function migrateLegacyModuleRows(orgId: string, database: AppDb = db) {
    const rows = await database.select().from(modules).where(eq(modules.org_id, orgId));

    for (const row of rows) {
        const canonical = normalizeModuleName(row.name);
        if (!canonical || canonical === row.name) continue;

        const [conflict] = await database
            .select({ id: modules.id })
            .from(modules)
            .where(and(eq(modules.org_id, orgId), eq(modules.name, canonical)))
            .limit(1);

        if (conflict) {
            await database.delete(modules).where(eq(modules.id, row.id));
        } else {
            await database
                .update(modules)
                .set({ name: canonical, updated_at: new Date() })
                .where(eq(modules.id, row.id));
        }
    }
}

export function mapOrgModule(row: typeof modules.$inferSelect) {
    return {
        id: row.id,
        name: row.name,
        enabled: row.enabled,
        sort_order: row.sort_order,
        label_en: row.label_en,
        label_ar: row.label_ar,
        locked: isLockedModuleKey(row.name),
        config: (row.config as Record<string, unknown> | null) ?? null,
        created_at: row.created_at?.toISOString() ?? null,
        updated_at: row.updated_at?.toISOString() ?? null,
    };
}
