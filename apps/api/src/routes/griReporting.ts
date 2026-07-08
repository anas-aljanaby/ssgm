import { Hono } from 'hono';
import { and, desc, eq } from 'drizzle-orm';
import { createGriReportSchema, griDisclosureStatusSchema, updateGriReportSchema } from '@gms/shared';
import { db } from '../db';
import { gri_disclosure_responses, gri_reports } from '../db/schema';
import { authMiddleware } from '../middleware/auth';
import { OrgContextVars, orgContext, requireModuleAccess } from '../middleware/orgContext';

const griReportingRouter = new Hono<{ Variables: OrgContextVars }>();
griReportingRouter.use(authMiddleware);
griReportingRouter.use(orgContext);
griReportingRouter.use(requireModuleAccess('gri_reporting'));

type GriReportRow = typeof gri_reports.$inferSelect;
type GriResponseRow = typeof gri_disclosure_responses.$inferSelect;

function asStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is string => typeof item === 'string');
}

function asRecord(value: unknown): Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    return value as Record<string, unknown>;
}

function mapResponse(row: GriResponseRow) {
    return {
        disclosureNumber: row.disclosure_number,
        narrative: row.narrative || '',
        status: griDisclosureStatusSchema.safeParse(row.status).success ? row.status : 'not_started',
        reference: row.reference || '',
        custom_fields: asRecord(row.custom_fields),
        created_at: row.created_at?.toISOString() ?? new Date().toISOString(),
        updated_at: row.updated_at?.toISOString() ?? new Date().toISOString(),
    };
}

function mapReport(report: GriReportRow, responses: GriResponseRow[]) {
    return {
        id: report.id,
        reportPeriod: report.report_period || '',
        frameworkVersion: report.framework_version || 'GRI Standards 2021',
        materialTopics: asStringArray(report.material_topics),
        responses: responses.map(mapResponse),
        custom_fields: asRecord(report.custom_fields),
        created_at: report.created_at?.toISOString() ?? new Date().toISOString(),
        updated_at: report.updated_at?.toISOString() ?? new Date().toISOString(),
    };
}

async function getOrgReport(reportId: string, orgId: string) {
    const rows = await db
        .select()
        .from(gri_reports)
        .where(and(eq(gri_reports.id, reportId), eq(gri_reports.org_id, orgId)))
        .limit(1);
    return rows[0] ?? null;
}

async function getResponses(reportId: string, orgId: string) {
    return db
        .select()
        .from(gri_disclosure_responses)
        .where(and(eq(gri_disclosure_responses.report_id, reportId), eq(gri_disclosure_responses.org_id, orgId)));
}

async function upsertResponses(
    reportId: string,
    orgId: string,
    responses: Array<{
        disclosureNumber: string;
        narrative: string;
        status: 'not_started' | 'in_progress' | 'complete';
        reference: string;
        custom_fields?: Record<string, unknown>;
    }>,
) {
    for (const response of responses) {
        const existing = await db
            .select({ id: gri_disclosure_responses.id })
            .from(gri_disclosure_responses)
            .where(and(
                eq(gri_disclosure_responses.report_id, reportId),
                eq(gri_disclosure_responses.org_id, orgId),
                eq(gri_disclosure_responses.disclosure_number, response.disclosureNumber),
            ))
            .limit(1);

        if (existing[0]) {
            await db
                .update(gri_disclosure_responses)
                .set({
                    narrative: response.narrative,
                    status: response.status,
                    reference: response.reference,
                    custom_fields: response.custom_fields ?? {},
                    updated_at: new Date(),
                })
                .where(and(eq(gri_disclosure_responses.id, existing[0].id), eq(gri_disclosure_responses.org_id, orgId)));
            continue;
        }

        await db.insert(gri_disclosure_responses).values({
            org_id: orgId,
            report_id: reportId,
            disclosure_number: response.disclosureNumber,
            narrative: response.narrative,
            status: response.status,
            reference: response.reference,
            custom_fields: response.custom_fields ?? {},
        });
    }
}

griReportingRouter.get('/', async (c) => {
    const orgId = c.get('orgId');
    const reports = await db
        .select()
        .from(gri_reports)
        .where(eq(gri_reports.org_id, orgId))
        .orderBy(desc(gri_reports.created_at));

    if (reports.length === 0) return c.json([]);

    const reportIds = reports.map((report) => report.id);
    const responses = await db
        .select()
        .from(gri_disclosure_responses)
        .where(eq(gri_disclosure_responses.org_id, orgId));

    return c.json(
        reports.map((report) =>
            mapReport(report, responses.filter((response) => reportIds.includes(response.report_id) && response.report_id === report.id)),
        ),
    );
});

griReportingRouter.get('/:id', async (c) => {
    const orgId = c.get('orgId');
    const report = await getOrgReport(c.req.param('id'), orgId);
    if (!report) return c.json({ error: 'Not found' }, 404);

    const responses = await getResponses(report.id, orgId);
    return c.json(mapReport(report, responses));
});

griReportingRouter.post('/', async (c) => {
    const orgId = c.get('orgId');
    const body = await c.req.json();
    const parsed = createGriReportSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);

    const [report] = await db
        .insert(gri_reports)
        .values({
            org_id: orgId,
            report_period: parsed.data.reportPeriod,
            framework_version: parsed.data.frameworkVersion,
            material_topics: parsed.data.materialTopics,
            custom_fields: parsed.data.custom_fields,
        })
        .returning();

    await upsertResponses(report.id, orgId, parsed.data.responses);
    const responses = await getResponses(report.id, orgId);
    return c.json(mapReport(report, responses), 201);
});

griReportingRouter.patch('/:id', async (c) => {
    const orgId = c.get('orgId');
    const report = await getOrgReport(c.req.param('id'), orgId);
    if (!report) return c.json({ error: 'Not found' }, 404);

    const body = await c.req.json();
    const parsed = updateGriReportSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);

    const values: Partial<typeof gri_reports.$inferInsert> = { updated_at: new Date() };
    if (parsed.data.reportPeriod !== undefined) values.report_period = parsed.data.reportPeriod;
    if (parsed.data.frameworkVersion !== undefined) values.framework_version = parsed.data.frameworkVersion;
    if (parsed.data.materialTopics !== undefined) values.material_topics = parsed.data.materialTopics;
    if (parsed.data.custom_fields !== undefined) values.custom_fields = parsed.data.custom_fields;

    const [updated] = await db
        .update(gri_reports)
        .set(values)
        .where(and(eq(gri_reports.id, report.id), eq(gri_reports.org_id, orgId)))
        .returning();

    if (parsed.data.responses !== undefined) {
        await upsertResponses(report.id, orgId, parsed.data.responses);
    }

    const responses = await getResponses(report.id, orgId);
    return c.json(mapReport(updated, responses));
});

griReportingRouter.delete('/:id', async (c) => {
    const orgId = c.get('orgId');
    const report = await getOrgReport(c.req.param('id'), orgId);
    if (!report) return c.json({ error: 'Not found' }, 404);

    await db.delete(gri_disclosure_responses).where(and(
        eq(gri_disclosure_responses.org_id, orgId),
        eq(gri_disclosure_responses.report_id, report.id),
    ));
    await db.delete(gri_reports).where(and(eq(gri_reports.id, report.id), eq(gri_reports.org_id, orgId)));
    return c.json({ ok: true });
});

export { griReportingRouter };
