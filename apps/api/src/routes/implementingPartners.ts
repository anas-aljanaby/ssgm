import { Hono } from 'hono';
import { and, desc, eq } from 'drizzle-orm';
import { createPartnerSchema, updatePartnerSchema } from '@gms/shared';
import { db } from '../db';
import { implementing_partners } from '../db/schema';
import { authMiddleware } from '../middleware/auth';
import { OrgContextVars, orgContext } from '../middleware/orgContext';

const implementingPartnersRouter = new Hono<{ Variables: OrgContextVars }>();
implementingPartnersRouter.use(authMiddleware);
implementingPartnersRouter.use(orgContext);

function isRecord(value: unknown): value is Record<string, unknown> {
    return !!value && typeof value === 'object' && !Array.isArray(value);
}

function asNumber(value: unknown): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
}

function defaultLogo(nameEn: string, nameAr: string): string {
    const source = (nameAr || nameEn || 'IP').trim();
    return source.slice(0, 2).toUpperCase();
}

function mapContacts(value: unknown) {
    if (!Array.isArray(value)) return [];
    return value
        .filter((item): item is Record<string, unknown> => isRecord(item))
        .map((item) => ({
            id: typeof item.id === 'string' ? item.id : '',
            name: typeof item.name === 'string' ? item.name : '',
            position: typeof item.position === 'string' ? item.position : '',
            email: typeof item.email === 'string' ? item.email : '',
            phone: typeof item.phone === 'string' ? item.phone : undefined,
            whatsapp: typeof item.whatsapp === 'string' ? item.whatsapp : undefined,
            isPrimary: item.isPrimary === true,
            photoUrl: typeof item.photoUrl === 'string' ? item.photoUrl : '',
        }))
        .filter((contact) => contact.id && contact.name);
}

function mapCoordinates(value: unknown): { lat: number; lng: number } | null {
    if (!isRecord(value)) return null;
    const lat = asNumber(value.lat);
    const lng = asNumber(value.lng);
    if (!lat && !lng) return null;
    return { lat, lng };
}

function mapPartner(row: typeof implementing_partners.$inferSelect) {
    return {
        id: row.id,
        name_en: row.name_en,
        name_ar: row.name_ar || row.name_en,
        logo: row.logo || defaultLogo(row.name_en, row.name_ar || ''),
        sector: row.sector,
        status: row.status,
        country: row.country || '',
        city: row.city || '',
        description: row.description || '',
        phone: row.phone || '',
        email: row.email || '',
        website: row.website || '',
        address: row.address || '',
        coordinates: mapCoordinates(row.coordinates),
        rating: asNumber(row.rating),
        budget: asNumber(row.budget),
        projectsCompleted: row.projects_completed,
        projectsInProgress: row.projects_in_progress,
        contacts: mapContacts(row.contacts),
        custom_fields: isRecord(row.custom_fields) ? row.custom_fields : {},
        created_at: row.created_at?.toISOString() ?? new Date().toISOString(),
        updated_at: row.updated_at?.toISOString() ?? new Date().toISOString(),
    };
}

async function getOrgPartner(id: string, orgId: string) {
    const rows = await db
        .select()
        .from(implementing_partners)
        .where(and(eq(implementing_partners.id, id), eq(implementing_partners.org_id, orgId)))
        .limit(1);
    return rows[0] ?? null;
}

implementingPartnersRouter.get('/', async (c) => {
    const orgId = c.get('orgId');

    const rows = await db
        .select()
        .from(implementing_partners)
        .where(eq(implementing_partners.org_id, orgId))
        .orderBy(desc(implementing_partners.created_at));

    return c.json(rows.map(mapPartner));
});

implementingPartnersRouter.get('/:id', async (c) => {
    const orgId = c.get('orgId');

    const row = await getOrgPartner(c.req.param('id'), orgId);
    if (!row) return c.json({ error: 'Not found' }, 404);
    return c.json(mapPartner(row));
});

implementingPartnersRouter.post('/', async (c) => {
    const orgId = c.get('orgId');

    const body = await c.req.json();
    const parsed = createPartnerSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);

    const data = parsed.data;
    const nameEn = data.name_en.trim() || data.name_ar.trim();
    const nameAr = data.name_ar.trim() || data.name_en.trim();

    const [row] = await db
        .insert(implementing_partners)
        .values({
            org_id: orgId,
            name_en: nameEn,
            name_ar: nameAr,
            logo: data.logo || defaultLogo(nameEn, nameAr),
            sector: data.sector,
            status: data.status,
            country: data.country.trim(),
            city: data.city.trim(),
            description: data.description,
            phone: data.phone,
            email: data.email,
            website: data.website,
            address: data.address,
            coordinates: data.coordinates ?? null,
            rating: String(data.rating),
            budget: String(data.budget),
            projects_completed: data.projectsCompleted,
            projects_in_progress: data.projectsInProgress,
            contacts: data.contacts,
            custom_fields: data.custom_fields,
        })
        .returning();

    return c.json(mapPartner(row), 201);
});

implementingPartnersRouter.patch('/:id', async (c) => {
    const orgId = c.get('orgId');

    const existing = await getOrgPartner(c.req.param('id'), orgId);
    if (!existing) return c.json({ error: 'Not found' }, 404);

    const body = await c.req.json();
    const parsed = updatePartnerSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);

    const data = parsed.data;
    const values: Record<string, unknown> = { updated_at: new Date() };

    if (data.name_en !== undefined || data.name_ar !== undefined) {
        const nameEn = (data.name_en ?? existing.name_en).trim() || (data.name_ar ?? existing.name_ar).trim();
        const nameAr = (data.name_ar ?? existing.name_ar).trim() || nameEn;
        values.name_en = nameEn;
        values.name_ar = nameAr;
    }
    if (data.logo !== undefined) values.logo = data.logo;
    if (data.sector !== undefined) values.sector = data.sector;
    if (data.status !== undefined) values.status = data.status;
    if (data.country !== undefined) values.country = data.country;
    if (data.city !== undefined) values.city = data.city;
    if (data.description !== undefined) values.description = data.description;
    if (data.phone !== undefined) values.phone = data.phone;
    if (data.email !== undefined) values.email = data.email;
    if (data.website !== undefined) values.website = data.website;
    if (data.address !== undefined) values.address = data.address;
    if (data.coordinates !== undefined) values.coordinates = data.coordinates;
    if (data.rating !== undefined) values.rating = String(data.rating);
    if (data.budget !== undefined) values.budget = String(data.budget);
    if (data.projectsCompleted !== undefined) values.projects_completed = data.projectsCompleted;
    if (data.projectsInProgress !== undefined) values.projects_in_progress = data.projectsInProgress;
    if (data.contacts !== undefined) values.contacts = data.contacts;
    if (data.custom_fields !== undefined) {
        values.custom_fields = {
            ...(isRecord(existing.custom_fields) ? existing.custom_fields : {}),
            ...data.custom_fields,
        };
    }

    if (Object.keys(values).length === 1) return c.json(mapPartner(existing));

    const [updated] = await db
        .update(implementing_partners)
        .set(values)
        .where(and(eq(implementing_partners.id, existing.id), eq(implementing_partners.org_id, orgId)))
        .returning();

    return c.json(mapPartner(updated));
});

implementingPartnersRouter.delete('/:id', async (c) => {
    const orgId = c.get('orgId');

    const existing = await getOrgPartner(c.req.param('id'), orgId);
    if (!existing) return c.json({ error: 'Not found' }, 404);

    await db
        .delete(implementing_partners)
        .where(and(eq(implementing_partners.id, existing.id), eq(implementing_partners.org_id, orgId)));

    return c.json({ ok: true });
});

export { implementingPartnersRouter };
