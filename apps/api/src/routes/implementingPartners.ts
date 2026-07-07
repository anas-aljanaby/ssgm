import { Hono } from 'hono';
import { and, desc, eq, or } from 'drizzle-orm';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createPartnerEvaluationSchema, createPartnerSchema, partnerDocumentCategorySchema, updatePartnerSchema } from '@gms/shared';
import { db } from '../db';
import { implementing_partners, partner_documents, partner_evaluations, projects } from '../db/schema';
import { assertBufferWithinLimit, buildStoredFilename, isUploadedFile, validateUpload } from '../lib/fileUpload';
import { authMiddleware } from '../middleware/auth';
import { OrgContextVars, orgContext } from '../middleware/orgContext';

const implementingPartnersRouter = new Hono<{ Variables: OrgContextVars }>();
implementingPartnersRouter.use(authMiddleware);
implementingPartnersRouter.use(orgContext);

const UPLOAD_DIR = process.env.PARTNER_UPLOAD_DIR || path.resolve(process.cwd(), 'uploads', 'partner-documents');
const UPLOAD_PUBLIC_PATH = '/uploads/partner-documents';

function isRecord(value: unknown): value is Record<string, unknown> {
    return !!value && typeof value === 'object' && !Array.isArray(value);
}

function asNumber(value: unknown): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
}

function toIso(value: Date | string | null | undefined): string | null {
    if (!value) return null;
    return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
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

function mapDocument(row: typeof partner_documents.$inferSelect) {
    return {
        id: row.id,
        filename: row.filename,
        file_url: row.file_url,
        label: row.label || 'Document',
        category: row.category || 'reports',
        content_type: row.content_type,
        size_bytes: row.size_bytes,
        uploaded_at: toIso(row.uploaded_at),
        custom_fields: row.custom_fields || {},
    };
}

function mapEvaluation(row: typeof partner_evaluations.$inferSelect) {
    return {
        id: row.id,
        reviewer: row.reviewer,
        project: row.project || '',
        rating: row.rating,
        comment: row.comment || '',
        date: toIso(row.evaluated_at) ?? new Date().toISOString(),
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

async function computePartnerProjectStats(partner: typeof implementing_partners.$inferSelect, orgId: string) {
    const projectRows = await db
        .select()
        .from(projects)
        .where(and(
            eq(projects.org_id, orgId),
            or(
                eq(projects.implementing_partner_id, partner.id),
                eq(projects.implementing_partner, partner.id),
                eq(projects.implementing_partner, partner.name_en),
                eq(projects.implementing_partner, partner.name_ar),
            ),
        ));

    const activeProjects = projectRows.filter(
        (row) => row.stage === 'implementation' || row.stage === 'monitoring' || row.stage === 'planning',
    ).length;
    const completedProjects = projectRows.filter((row) => row.stage === 'closure').length;
    const totalBudget = projectRows.reduce((sum, row) => sum + asNumber(row.budget), 0);

    return {
        activeProjects,
        completedProjects,
        totalBudget,
        linkedCount: projectRows.length,
    };
}

async function syncPartnerRatingFromEvaluations(partnerId: string, orgId: string) {
    const evaluations = await db
        .select()
        .from(partner_evaluations)
        .where(and(eq(partner_evaluations.partner_id, partnerId), eq(partner_evaluations.org_id, orgId)));

    const rating = evaluations.length === 0
        ? 0
        : Number((evaluations.reduce((sum, row) => sum + row.rating, 0) / evaluations.length).toFixed(1));

    await db
        .update(implementing_partners)
        .set({ rating: String(rating), updated_at: new Date() })
        .where(and(eq(implementing_partners.id, partnerId), eq(implementing_partners.org_id, orgId)));

    return rating;
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

implementingPartnersRouter.get('/:id/project-stats', async (c) => {
    const orgId = c.get('orgId');
    const partner = await getOrgPartner(c.req.param('id'), orgId);
    if (!partner) return c.json({ error: 'Not found' }, 404);
    return c.json(await computePartnerProjectStats(partner, orgId));
});

implementingPartnersRouter.get('/:id/documents', async (c) => {
    const orgId = c.get('orgId');
    const partner = await getOrgPartner(c.req.param('id'), orgId);
    if (!partner) return c.json({ error: 'Not found' }, 404);

    const rows = await db
        .select()
        .from(partner_documents)
        .where(and(eq(partner_documents.org_id, orgId), eq(partner_documents.partner_id, partner.id)))
        .orderBy(desc(partner_documents.uploaded_at));

    return c.json(rows.map(mapDocument));
});

implementingPartnersRouter.post('/:id/documents', async (c) => {
    const orgId = c.get('orgId');
    const partner = await getOrgPartner(c.req.param('id'), orgId);
    if (!partner) return c.json({ error: 'Not found' }, 404);

    const body = await c.req.parseBody();
    const file = body.file;
    if (!isUploadedFile(file)) return c.json({ error: 'A file field is required.' }, 400);

    const uploadCheck = validateUpload(file);
    if (!uploadCheck.ok) {
        return c.json({ error: uploadCheck.error }, uploadCheck.status);
    }

    const labelValue = body.label;
    const label = typeof labelValue === 'string' && labelValue.trim() ? labelValue.trim() : file.name || 'Document';
    const categoryValue = body.category;
    const categoryParsed = partnerDocumentCategorySchema.safeParse(categoryValue);
    const category = categoryParsed.success ? categoryParsed.data : 'reports';
    const storedFilename = buildStoredFilename(partner.id, uploadCheck.ext);

    await mkdir(UPLOAD_DIR, { recursive: true });
    const buffer = await file.arrayBuffer();
    const bufferCheck = assertBufferWithinLimit(buffer);
    if (!bufferCheck.ok) {
        return c.json({ error: bufferCheck.error }, bufferCheck.status);
    }
    await writeFile(path.join(UPLOAD_DIR, storedFilename), Buffer.from(buffer));

    const [document] = await db.insert(partner_documents).values({
        org_id: orgId,
        partner_id: partner.id,
        filename: uploadCheck.safeName,
        file_url: `${UPLOAD_PUBLIC_PATH}/${storedFilename}`,
        label,
        category,
        content_type: file.type || null,
        size_bytes: buffer.byteLength,
        custom_fields: {},
    }).returning();

    return c.json(mapDocument(document), 201);
});

implementingPartnersRouter.delete('/:id/documents/:documentId', async (c) => {
    const orgId = c.get('orgId');
    const partner = await getOrgPartner(c.req.param('id'), orgId);
    if (!partner) return c.json({ error: 'Not found' }, 404);

    const [deleted] = await db.delete(partner_documents).where(and(
        eq(partner_documents.id, c.req.param('documentId')),
        eq(partner_documents.org_id, orgId),
        eq(partner_documents.partner_id, partner.id),
    )).returning();

    if (!deleted) return c.json({ error: 'Not found' }, 404);
    if (deleted.file_url?.startsWith(`${UPLOAD_PUBLIC_PATH}/`)) {
        const filename = path.basename(deleted.file_url);
        await unlink(path.join(UPLOAD_DIR, filename)).catch(() => undefined);
    }
    return c.json({ ok: true });
});

implementingPartnersRouter.get('/:id/evaluations', async (c) => {
    const orgId = c.get('orgId');
    const partner = await getOrgPartner(c.req.param('id'), orgId);
    if (!partner) return c.json({ error: 'Not found' }, 404);

    const rows = await db
        .select()
        .from(partner_evaluations)
        .where(and(eq(partner_evaluations.org_id, orgId), eq(partner_evaluations.partner_id, partner.id)))
        .orderBy(desc(partner_evaluations.evaluated_at));

    return c.json(rows.map(mapEvaluation));
});

implementingPartnersRouter.post('/:id/evaluations', async (c) => {
    const orgId = c.get('orgId');
    const partner = await getOrgPartner(c.req.param('id'), orgId);
    if (!partner) return c.json({ error: 'Not found' }, 404);

    const body = await c.req.json();
    const parsed = createPartnerEvaluationSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);

    const data = parsed.data;
    const [evaluation] = await db.insert(partner_evaluations).values({
        org_id: orgId,
        partner_id: partner.id,
        reviewer: data.reviewer.trim(),
        project: data.project.trim(),
        rating: data.rating,
        comment: data.comment.trim(),
        custom_fields: {},
    }).returning();

    const rating = await syncPartnerRatingFromEvaluations(partner.id, orgId);
    return c.json({ ...mapEvaluation(evaluation), partnerRating: rating }, 201);
});

implementingPartnersRouter.get('/:id', async (c) => {
    const orgId = c.get('orgId');

    const row = await getOrgPartner(c.req.param('id'), orgId);
    if (!row) return c.json({ error: 'Not found' }, 404);
    return c.json(mapPartner(row));
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

    const documentRows = await db
        .select()
        .from(partner_documents)
        .where(and(eq(partner_documents.org_id, orgId), eq(partner_documents.partner_id, existing.id)));

    for (const document of documentRows) {
        if (document.file_url?.startsWith(`${UPLOAD_PUBLIC_PATH}/`)) {
            const filename = path.basename(document.file_url);
            await unlink(path.join(UPLOAD_DIR, filename)).catch(() => undefined);
        }
    }

    await db.delete(partner_evaluations).where(and(
        eq(partner_evaluations.org_id, orgId),
        eq(partner_evaluations.partner_id, existing.id),
    ));
    await db.delete(partner_documents).where(and(
        eq(partner_documents.org_id, orgId),
        eq(partner_documents.partner_id, existing.id),
    ));
    await db
        .update(projects)
        .set({ implementing_partner_id: null, implementing_partner: '', updated_at: new Date() })
        .where(and(eq(projects.org_id, orgId), eq(projects.implementing_partner_id, existing.id)));
    await db
        .delete(implementing_partners)
        .where(and(eq(implementing_partners.id, existing.id), eq(implementing_partners.org_id, orgId)));

    return c.json({ ok: true });
});

export { implementingPartnersRouter };
