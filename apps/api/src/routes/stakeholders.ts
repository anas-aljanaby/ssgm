import { Hono } from 'hono';
import { and, desc, eq } from 'drizzle-orm';
import { createStakeholderSchema, updateStakeholderSchema } from '@gms/shared';
import { db } from '../db';
import { stakeholders } from '../db/schema';
import { authMiddleware } from '../middleware/auth';
import { OrgContextVars, orgContext } from '../middleware/orgContext';

const stakeholdersRouter = new Hono<{ Variables: OrgContextVars }>();
stakeholdersRouter.use(authMiddleware);
stakeholdersRouter.use(orgContext);

function isRecord(value: unknown): value is Record<string, unknown> {
    return !!value && typeof value === 'object' && !Array.isArray(value);
}

function asStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is string => typeof item === 'string');
}

function asNumber(value: unknown): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
}

function toIso(value: Date | string | null | undefined): string {
    if (!value) return new Date().toISOString();
    return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function mapStakeholder(row: typeof stakeholders.$inferSelect) {
    return {
        id: row.id,
        name: {
            en: row.name_en,
            ar: row.name_ar || row.name_en,
        },
        type: row.type,
        category: row.category,
        status: row.status,
        classification: row.classification,
        email: row.email || '',
        phone: row.phone || '',
        country: row.country || '',
        healthScore: row.health_score,
        engagementScore: row.engagement_score,
        relationshipLevel: row.relationship_level,
        riskLevel: row.risk_level,
        riskProfile: row.risk_profile,
        power: row.power,
        interest: row.interest,
        aiInsights: row.ai_insights,
        lastContact: toIso(row.last_contact),
        needs: asStringArray(row.needs),
        totalDonations: row.total_donations === null ? undefined : asNumber(row.total_donations),
        supportReceived: row.support_received === null ? undefined : asNumber(row.support_received),
        partnershipValue: row.partnership_value === null ? undefined : asNumber(row.partnership_value),
        custom_fields: isRecord(row.custom_fields) ? row.custom_fields : {},
    };
}

async function getOrgStakeholder(id: string, orgId: string) {
    const rows = await db
        .select()
        .from(stakeholders)
        .where(and(eq(stakeholders.id, id), eq(stakeholders.org_id, orgId)))
        .limit(1);
    return rows[0] ?? null;
}

stakeholdersRouter.get('/', async (c) => {
    const orgId = c.get('orgId');

    const rows = await db
        .select()
        .from(stakeholders)
        .where(eq(stakeholders.org_id, orgId))
        .orderBy(desc(stakeholders.created_at));

    return c.json(rows.map(mapStakeholder));
});

stakeholdersRouter.get('/:id', async (c) => {
    const orgId = c.get('orgId');

    const row = await getOrgStakeholder(c.req.param('id'), orgId);
    if (!row) return c.json({ error: 'Not found' }, 404);
    return c.json(mapStakeholder(row));
});

stakeholdersRouter.post('/', async (c) => {
    const orgId = c.get('orgId');

    const body = await c.req.json();
    const parsed = createStakeholderSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);

    const data = parsed.data;
    const nameEn = data.name.en.trim() || data.name.ar.trim();
    const nameAr = data.name.ar.trim() || data.name.en.trim();

    const [row] = await db
        .insert(stakeholders)
        .values({
            org_id: orgId,
            name_en: nameEn,
            name_ar: nameAr,
            type: data.type,
            category: data.category,
            status: data.status,
            classification: data.classification,
            email: data.email,
            phone: data.phone,
            country: data.country,
            health_score: data.healthScore,
            engagement_score: data.engagementScore,
            relationship_level: data.relationshipLevel,
            risk_level: data.riskLevel,
            risk_profile: data.riskProfile,
            power: data.power,
            interest: data.interest,
            ai_insights: data.aiInsights,
            last_contact: data.lastContact ? new Date(data.lastContact) : new Date(),
            needs: data.needs,
            total_donations: data.totalDonations !== undefined ? String(data.totalDonations) : null,
            support_received: data.supportReceived !== undefined ? String(data.supportReceived) : null,
            partnership_value: data.partnershipValue !== undefined ? String(data.partnershipValue) : null,
            custom_fields: data.custom_fields,
        })
        .returning();

    return c.json(mapStakeholder(row), 201);
});

stakeholdersRouter.patch('/:id', async (c) => {
    const orgId = c.get('orgId');

    const existing = await getOrgStakeholder(c.req.param('id'), orgId);
    if (!existing) return c.json({ error: 'Not found' }, 404);

    const body = await c.req.json();
    const parsed = updateStakeholderSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);

    const data = parsed.data;
    const values: Record<string, unknown> = { updated_at: new Date() };

    if (data.name !== undefined) {
        values.name_en = data.name.en || data.name.ar || existing.name_en;
        values.name_ar = data.name.ar || data.name.en || existing.name_ar;
    }
    if (data.type !== undefined) values.type = data.type;
    if (data.category !== undefined) values.category = data.category;
    if (data.status !== undefined) values.status = data.status;
    if (data.classification !== undefined) values.classification = data.classification;
    if (data.email !== undefined) values.email = data.email;
    if (data.phone !== undefined) values.phone = data.phone;
    if (data.country !== undefined) values.country = data.country;
    if (data.healthScore !== undefined) values.health_score = data.healthScore;
    if (data.engagementScore !== undefined) values.engagement_score = data.engagementScore;
    if (data.relationshipLevel !== undefined) values.relationship_level = data.relationshipLevel;
    if (data.riskLevel !== undefined) values.risk_level = data.riskLevel;
    if (data.riskProfile !== undefined) values.risk_profile = data.riskProfile;
    if (data.power !== undefined) values.power = data.power;
    if (data.interest !== undefined) values.interest = data.interest;
    if (data.aiInsights !== undefined) values.ai_insights = data.aiInsights;
    if (data.lastContact !== undefined) values.last_contact = new Date(data.lastContact);
    if (data.needs !== undefined) values.needs = data.needs;
    if (data.totalDonations !== undefined) values.total_donations = String(data.totalDonations);
    if (data.supportReceived !== undefined) values.support_received = String(data.supportReceived);
    if (data.partnershipValue !== undefined) values.partnership_value = String(data.partnershipValue);
    if (data.custom_fields !== undefined) {
        values.custom_fields = {
            ...(isRecord(existing.custom_fields) ? existing.custom_fields : {}),
            ...data.custom_fields,
        };
    }

    if (Object.keys(values).length === 1) return c.json(mapStakeholder(existing));

    const [updated] = await db
        .update(stakeholders)
        .set(values)
        .where(and(eq(stakeholders.id, existing.id), eq(stakeholders.org_id, orgId)))
        .returning();

    return c.json(mapStakeholder(updated));
});

stakeholdersRouter.delete('/:id', async (c) => {
    const orgId = c.get('orgId');

    const existing = await getOrgStakeholder(c.req.param('id'), orgId);
    if (!existing) return c.json({ error: 'Not found' }, 404);

    await db
        .delete(stakeholders)
        .where(and(eq(stakeholders.id, existing.id), eq(stakeholders.org_id, orgId)));

    return c.json({ ok: true });
});

export { stakeholdersRouter };
