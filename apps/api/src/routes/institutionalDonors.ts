import { Hono } from 'hono';
import { and, desc, eq, sql } from 'drizzle-orm';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { db } from '../db';
import { assertBufferWithinLimit, buildStoredFilename, isUploadedFile, validateUpload } from '../lib/fileUpload';
import {
    grants,
    institutional_donor_contacts,
    institutional_donor_documents,
    institutional_donors,
} from '../db/schema';
import { authMiddleware } from '../middleware/auth';
import { OrgContextVars, orgContext, requireModuleAccess } from '../middleware/orgContext';
import {
    createInstitutionalDonorContactSchema,
    createInstitutionalDonorSchema,
    updateInstitutionalDonorContactSchema,
    updateInstitutionalDonorSchema,
} from '@gms/shared';

const institutionalDonorsRouter = new Hono<{ Variables: OrgContextVars }>();
institutionalDonorsRouter.use(authMiddleware);
institutionalDonorsRouter.use(orgContext);
institutionalDonorsRouter.use(requireModuleAccess('institutional_donors'));

const UPLOAD_DIR = process.env.INSTITUTIONAL_DONOR_UPLOAD_DIR || path.resolve(process.cwd(), 'uploads', 'institutional-donor-documents');
const UPLOAD_PUBLIC_PATH = '/uploads/institutional-donor-documents';

function asNumber(value: unknown): number {
    const num = Number(value);
    return Number.isFinite(num) ? num : 0;
}

function toIso(value: Date | string | null | undefined): string | null {
    if (!value) return null;
    return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return !!value && typeof value === 'object' && !Array.isArray(value);
}

function getCustomString(customFields: unknown, key: string): string | null {
    if (!isRecord(customFields)) return null;
    const value = customFields[key];
    return typeof value === 'string' && value.trim() ? value : null;
}

function getCustomNumber(customFields: unknown, key: string): number | null {
    if (!isRecord(customFields)) return null;
    const value = Number(customFields[key]);
    return Number.isFinite(value) ? value : null;
}

function getCustomObject(customFields: unknown, key: string): Record<string, unknown> | undefined {
    if (!isRecord(customFields)) return undefined;
    const value = customFields[key];
    return isRecord(value) ? value : undefined;
}

function asStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
}

async function getOrgInstitutionalDonor(donorId: string, orgId: string) {
    const rows = await db
        .select()
        .from(institutional_donors)
        .where(and(eq(institutional_donors.id, donorId), eq(institutional_donors.org_id, orgId)))
        .limit(1);
    return rows[0] ?? null;
}

function mapContact(row: typeof institutional_donor_contacts.$inferSelect) {
    return {
        id: row.id,
        name: row.name,
        position: row.position || '',
        email: row.email || '',
        phone: row.phone || '',
        whatsapp: row.whatsapp || '',
        isPrimary: row.is_primary,
        photoUrl: row.photo_url || '',
        custom_fields: row.custom_fields || {},
    };
}

function mapDocument(row: typeof institutional_donor_documents.$inferSelect) {
    return {
        id: row.id,
        filename: row.filename,
        file_url: row.file_url,
        label: row.label || 'Document',
        content_type: row.content_type,
        size_bytes: row.size_bytes,
        uploaded_at: toIso(row.uploaded_at),
        custom_fields: row.custom_fields || {},
    };
}

function computeGrantRollups(grantRows: Array<typeof grants.$inferSelect>) {
    const totalGrantsAwarded = grantRows.reduce((sum, grant) => sum + asNumber(grant.total_amount), 0);
    const activeGrants = grantRows.filter((grant) => grant.status === 'active').length;
    const now = Date.now();
    const nextDeadlineDate = grantRows
        .map((grant) => grant.end_date)
        .filter((date) => date instanceof Date && date.getTime() >= now)
        .sort((a, b) => a.getTime() - b.getTime())[0] || null;

    return {
        totalGrantsAwarded,
        activeGrants,
        nextDeadline: toIso(nextDeadlineDate),
    };
}

function mapInstitutionalDonor(
    donor: typeof institutional_donors.$inferSelect,
    grantRows: Array<typeof grants.$inferSelect>,
    contactRows: Array<typeof institutional_donor_contacts.$inferSelect>,
) {
    const rollups = computeGrantRollups(grantRows);
    const socialMedia = getCustomObject(donor.custom_fields, 'social_media');
    const coordinates = getCustomObject(donor.custom_fields, 'coordinates');

    return {
        id: donor.id,
        organizationName: {
            en: donor.name_en,
            ar: donor.name_ar || donor.name_en,
        },
        logo: getCustomString(donor.custom_fields, 'logo') || '',
        type: donor.type,
        primaryContact: {
            name: donor.primary_contact_name || '',
            email: donor.primary_contact_email || '',
        },
        totalGrantsAwarded: rollups.totalGrantsAwarded,
        activeGrants: rollups.activeGrants,
        nextDeadline: rollups.nextDeadline || '',
        relationshipStatus: donor.relationship_status,
        focusAreas: asStringArray(donor.focus_areas),
        geographicFocus: asStringArray(donor.geographic_focus),
        assignedManager: donor.assigned_manager || '',
        priority: donor.priority,
        country: donor.country || '',
        lastContactDate: getCustomString(donor.custom_fields, 'last_contact_date') || toIso(donor.updated_at) || toIso(donor.created_at) || '',
        createdDate: toIso(donor.created_at) || '',
        registrationNumber: getCustomString(donor.custom_fields, 'registration_number') || undefined,
        city: getCustomString(donor.custom_fields, 'city') || undefined,
        establishmentDate: getCustomString(donor.custom_fields, 'establishment_date') || undefined,
        phone: getCustomString(donor.custom_fields, 'phone') || undefined,
        website: getCustomString(donor.custom_fields, 'website') || undefined,
        socialMedia: socialMedia ? {
            linkedin: typeof socialMedia.linkedin === 'string' ? socialMedia.linkedin : undefined,
            twitter: typeof socialMedia.twitter === 'string' ? socialMedia.twitter : undefined,
            facebook: typeof socialMedia.facebook === 'string' ? socialMedia.facebook : undefined,
        } : undefined,
        address: getCustomString(donor.custom_fields, 'address') || undefined,
        coordinates: coordinates ? {
            lat: getCustomNumber({ ...coordinates }, 'lat') ?? 0,
            lng: getCustomNumber({ ...coordinates }, 'lng') ?? 0,
        } : undefined,
        contacts: contactRows.map(mapContact),
    };
}

institutionalDonorsRouter.get('/', async (c) => {
    const orgId = c.get('orgId');

    const donorRows = await db
        .select()
        .from(institutional_donors)
        .where(eq(institutional_donors.org_id, orgId))
        .orderBy(desc(institutional_donors.created_at));

    const [grantRows, contactRows] = await Promise.all([
        db.select().from(grants).where(eq(grants.org_id, orgId)),
        db.select().from(institutional_donor_contacts).where(eq(institutional_donor_contacts.org_id, orgId)),
    ]);

    const grantsByDonorId = new Map<string, Array<typeof grants.$inferSelect>>();
    for (const row of grantRows) {
        const current = grantsByDonorId.get(row.grantor_id) || [];
        current.push(row);
        grantsByDonorId.set(row.grantor_id, current);
    }

    const contactsByDonorId = new Map<string, Array<typeof institutional_donor_contacts.$inferSelect>>();
    for (const row of contactRows) {
        const current = contactsByDonorId.get(row.institutional_donor_id) || [];
        current.push(row);
        contactsByDonorId.set(row.institutional_donor_id, current);
    }

    return c.json(
        donorRows.map((row) => mapInstitutionalDonor(
            row,
            grantsByDonorId.get(row.id) || [],
            contactsByDonorId.get(row.id) || [],
        )),
    );
});

institutionalDonorsRouter.get('/:id', async (c) => {
    const orgId = c.get('orgId');

    const donor = await getOrgInstitutionalDonor(c.req.param('id'), orgId);
    if (!donor) return c.json({ error: 'Not found' }, 404);

    const [grantRows, contactRows] = await Promise.all([
        db.select().from(grants).where(and(eq(grants.org_id, orgId), eq(grants.grantor_id, donor.id))),
        db.select().from(institutional_donor_contacts).where(and(
            eq(institutional_donor_contacts.org_id, orgId),
            eq(institutional_donor_contacts.institutional_donor_id, donor.id),
        )),
    ]);

    return c.json(mapInstitutionalDonor(donor, grantRows, contactRows));
});

institutionalDonorsRouter.post('/', async (c) => {
    const orgId = c.get('orgId');

    const body = await c.req.json();
    const parsed = createInstitutionalDonorSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);

    const data = parsed.data;
    const customFields = isRecord(data.custom_fields) ? data.custom_fields : {};
    const [donor] = await db.insert(institutional_donors).values({
        org_id: orgId,
        name_en: data.name_en.trim() || data.name_ar.trim(),
        name_ar: data.name_ar.trim() || data.name_en.trim(),
        type: data.type,
        relationship_status: data.relationship_status,
        priority: data.priority,
        assigned_manager: data.assigned_manager || '',
        primary_contact_name: data.primary_contact_name || '',
        primary_contact_email: data.primary_contact_email || '',
        focus_areas: data.focus_areas ?? [],
        geographic_focus: data.geographic_focus ?? [],
        country: data.country || '',
        custom_fields: customFields,
    }).returning();

    return c.json(mapInstitutionalDonor(donor, [], []), 201);
});

institutionalDonorsRouter.patch('/:id', async (c) => {
    const orgId = c.get('orgId');

    const existing = await getOrgInstitutionalDonor(c.req.param('id'), orgId);
    if (!existing) return c.json({ error: 'Not found' }, 404);

    const body = await c.req.json();
    const parsed = updateInstitutionalDonorSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);

    const data = parsed.data;
    const values: Record<string, unknown> = { updated_at: new Date() };
    if (data.name_en !== undefined) values.name_en = data.name_en;
    if (data.name_ar !== undefined) values.name_ar = data.name_ar;
    if (data.type !== undefined) values.type = data.type;
    if (data.relationship_status !== undefined) values.relationship_status = data.relationship_status;
    if (data.priority !== undefined) values.priority = data.priority;
    if (data.assigned_manager !== undefined) values.assigned_manager = data.assigned_manager;
    if (data.primary_contact_name !== undefined) values.primary_contact_name = data.primary_contact_name;
    if (data.primary_contact_email !== undefined) values.primary_contact_email = data.primary_contact_email;
    if (data.focus_areas !== undefined) values.focus_areas = data.focus_areas;
    if (data.geographic_focus !== undefined) values.geographic_focus = data.geographic_focus;
    if (data.country !== undefined) values.country = data.country;
    if (data.custom_fields !== undefined) {
        values.custom_fields = {
            ...(isRecord(existing.custom_fields) ? existing.custom_fields : {}),
            ...data.custom_fields,
        };
    }

    const [updated] = await db.update(institutional_donors).set(values)
        .where(and(eq(institutional_donors.id, existing.id), eq(institutional_donors.org_id, orgId)))
        .returning();

    const [grantRows, contactRows] = await Promise.all([
        db.select().from(grants).where(and(eq(grants.org_id, orgId), eq(grants.grantor_id, updated.id))),
        db.select().from(institutional_donor_contacts).where(and(
            eq(institutional_donor_contacts.org_id, orgId),
            eq(institutional_donor_contacts.institutional_donor_id, updated.id),
        )),
    ]);

    return c.json(mapInstitutionalDonor(updated, grantRows, contactRows));
});

institutionalDonorsRouter.delete('/:id', async (c) => {
    const orgId = c.get('orgId');

    const donor = await getOrgInstitutionalDonor(c.req.param('id'), orgId);
    if (!donor) return c.json({ error: 'Not found' }, 404);

    const documentRows = await db.select().from(institutional_donor_documents).where(and(
        eq(institutional_donor_documents.org_id, orgId),
        eq(institutional_donor_documents.institutional_donor_id, donor.id),
    ));
    await Promise.all(documentRows.map((doc) => {
        if (!doc.file_url?.startsWith(`${UPLOAD_PUBLIC_PATH}/`)) return Promise.resolve();
        const filename = path.basename(doc.file_url);
        return unlink(path.join(UPLOAD_DIR, filename)).catch(() => undefined);
    }));

    await db.delete(institutional_donor_documents).where(and(
        eq(institutional_donor_documents.org_id, orgId),
        eq(institutional_donor_documents.institutional_donor_id, donor.id),
    ));
    await db.delete(institutional_donor_contacts).where(and(
        eq(institutional_donor_contacts.org_id, orgId),
        eq(institutional_donor_contacts.institutional_donor_id, donor.id),
    ));
    await db.delete(institutional_donors).where(and(
        eq(institutional_donors.id, donor.id),
        eq(institutional_donors.org_id, orgId),
    ));

    return c.json({ ok: true });
});

institutionalDonorsRouter.get('/:id/grants', async (c) => {
    const orgId = c.get('orgId');

    const donor = await getOrgInstitutionalDonor(c.req.param('id'), orgId);
    if (!donor) return c.json({ error: 'Not found' }, 404);

    const rows = await db.select().from(grants).where(and(
        eq(grants.org_id, orgId),
        eq(grants.grantor_id, donor.id),
    )).orderBy(desc(grants.end_date));

    return c.json(rows.map((row) => ({
        id: row.id,
        date: toIso(row.start_date),
        end_date: toIso(row.end_date),
        amount: asNumber(row.total_amount),
        received_amount: asNumber(row.received_amount),
        currency: row.currency,
        type: row.status === 'pending' ? 'Unrestricted' : 'Restricted',
        title: row.title_en,
        project_beneficiary: row.project_name_en || row.title_en,
        status: row.status,
    })));
});

institutionalDonorsRouter.get('/:id/contacts', async (c) => {
    const orgId = c.get('orgId');

    const donor = await getOrgInstitutionalDonor(c.req.param('id'), orgId);
    if (!donor) return c.json({ error: 'Not found' }, 404);

    const rows = await db.select().from(institutional_donor_contacts).where(and(
        eq(institutional_donor_contacts.org_id, orgId),
        eq(institutional_donor_contacts.institutional_donor_id, donor.id),
    ));

    return c.json(rows.map(mapContact));
});

institutionalDonorsRouter.post('/:id/contacts', async (c) => {
    const orgId = c.get('orgId');

    const donor = await getOrgInstitutionalDonor(c.req.param('id'), orgId);
    if (!donor) return c.json({ error: 'Not found' }, 404);

    const body = await c.req.json();
    const parsed = createInstitutionalDonorContactSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);

    const [created] = await db.insert(institutional_donor_contacts).values({
        org_id: orgId,
        institutional_donor_id: donor.id,
        name: parsed.data.name,
        position: parsed.data.position,
        email: parsed.data.email,
        phone: parsed.data.phone,
        whatsapp: parsed.data.whatsapp,
        is_primary: parsed.data.is_primary,
        photo_url: parsed.data.photo_url,
        custom_fields: parsed.data.custom_fields,
    }).returning();

    return c.json(mapContact(created), 201);
});

institutionalDonorsRouter.patch('/:id/contacts/:contactId', async (c) => {
    const orgId = c.get('orgId');

    const donor = await getOrgInstitutionalDonor(c.req.param('id'), orgId);
    if (!donor) return c.json({ error: 'Not found' }, 404);

    const body = await c.req.json();
    const parsed = updateInstitutionalDonorContactSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);

    const values: Record<string, unknown> = {};
    if (parsed.data.name !== undefined) values.name = parsed.data.name;
    if (parsed.data.position !== undefined) values.position = parsed.data.position;
    if (parsed.data.email !== undefined) values.email = parsed.data.email;
    if (parsed.data.phone !== undefined) values.phone = parsed.data.phone;
    if (parsed.data.whatsapp !== undefined) values.whatsapp = parsed.data.whatsapp;
    if (parsed.data.is_primary !== undefined) values.is_primary = parsed.data.is_primary;
    if (parsed.data.photo_url !== undefined) values.photo_url = parsed.data.photo_url;
    if (parsed.data.custom_fields !== undefined) values.custom_fields = parsed.data.custom_fields;

    const [updated] = await db.update(institutional_donor_contacts).set(values).where(and(
        eq(institutional_donor_contacts.id, c.req.param('contactId')),
        eq(institutional_donor_contacts.org_id, orgId),
        eq(institutional_donor_contacts.institutional_donor_id, donor.id),
    )).returning();

    if (!updated) return c.json({ error: 'Not found' }, 404);
    return c.json(mapContact(updated));
});

institutionalDonorsRouter.delete('/:id/contacts/:contactId', async (c) => {
    const orgId = c.get('orgId');

    const donor = await getOrgInstitutionalDonor(c.req.param('id'), orgId);
    if (!donor) return c.json({ error: 'Not found' }, 404);

    const [deleted] = await db.delete(institutional_donor_contacts).where(and(
        eq(institutional_donor_contacts.id, c.req.param('contactId')),
        eq(institutional_donor_contacts.org_id, orgId),
        eq(institutional_donor_contacts.institutional_donor_id, donor.id),
    )).returning();
    if (!deleted) return c.json({ error: 'Not found' }, 404);
    return c.json({ ok: true });
});

institutionalDonorsRouter.get('/:id/documents', async (c) => {
    const orgId = c.get('orgId');

    const donor = await getOrgInstitutionalDonor(c.req.param('id'), orgId);
    if (!donor) return c.json({ error: 'Not found' }, 404);

    const rows = await db.select().from(institutional_donor_documents).where(and(
        eq(institutional_donor_documents.org_id, orgId),
        eq(institutional_donor_documents.institutional_donor_id, donor.id),
    )).orderBy(desc(institutional_donor_documents.uploaded_at));

    return c.json(rows.map(mapDocument));
});

institutionalDonorsRouter.post('/:id/documents', async (c) => {
    const orgId = c.get('orgId');

    const donor = await getOrgInstitutionalDonor(c.req.param('id'), orgId);
    if (!donor) return c.json({ error: 'Not found' }, 404);

    const body = await c.req.parseBody();
    const file = body.file;
    if (!isUploadedFile(file)) return c.json({ error: 'A file field is required.' }, 400);

    const uploadCheck = validateUpload(file);
    if (!uploadCheck.ok) {
        return c.json({ error: uploadCheck.error }, uploadCheck.status);
    }

    const labelValue = body.label;
    const label = typeof labelValue === 'string' && labelValue.trim() ? labelValue.trim() : 'Document';
    const storedFilename = buildStoredFilename(donor.id, uploadCheck.ext);

    await mkdir(UPLOAD_DIR, { recursive: true });
    const buffer = await file.arrayBuffer();
    const bufferCheck = assertBufferWithinLimit(buffer);
    if (!bufferCheck.ok) {
        return c.json({ error: bufferCheck.error }, bufferCheck.status);
    }
    await writeFile(path.join(UPLOAD_DIR, storedFilename), Buffer.from(buffer));

    const [document] = await db.insert(institutional_donor_documents).values({
        org_id: orgId,
        institutional_donor_id: donor.id,
        filename: uploadCheck.safeName,
        file_url: `${UPLOAD_PUBLIC_PATH}/${storedFilename}`,
        label,
        content_type: file.type || null,
        size_bytes: buffer.byteLength,
        custom_fields: {},
    }).returning();

    return c.json(mapDocument(document), 201);
});

institutionalDonorsRouter.delete('/:id/documents/:documentId', async (c) => {
    const orgId = c.get('orgId');

    const donor = await getOrgInstitutionalDonor(c.req.param('id'), orgId);
    if (!donor) return c.json({ error: 'Not found' }, 404);

    const [deleted] = await db.delete(institutional_donor_documents).where(and(
        eq(institutional_donor_documents.id, c.req.param('documentId')),
        eq(institutional_donor_documents.org_id, orgId),
        eq(institutional_donor_documents.institutional_donor_id, donor.id),
    )).returning();

    if (!deleted) return c.json({ error: 'Not found' }, 404);
    if (deleted.file_url?.startsWith(`${UPLOAD_PUBLIC_PATH}/`)) {
        const filename = path.basename(deleted.file_url);
        await unlink(path.join(UPLOAD_DIR, filename)).catch(() => undefined);
    }
    return c.json({ ok: true });
});

institutionalDonorsRouter.get('/debug/orphan-grantors', async (c) => {
    const orgId = c.get('orgId');

    const orphanRows = await db.execute(sql`
        select g.grantor_id, g.grantor_name, count(*)::int as grants_count
        from grants g
        left join institutional_donors d
            on d.org_id = g.org_id
            and d.id = g.grantor_id
        where g.org_id = ${orgId}
          and d.id is null
        group by g.grantor_id, g.grantor_name
        order by grants_count desc
    `);

    return c.json(orphanRows.rows);
});

export { institutionalDonorsRouter };
