import { Hono } from 'hono';
import { and, desc, eq } from 'drizzle-orm';
import {
    createGrcAssessmentSchema,
    createGrcDecisionSchema,
    createGrcPolicySchema,
    createGrcRequirementSchema,
    createGrcRiskSchema,
    screenEntitySchema,
    updateGrcDecisionSchema,
    updateGrcPolicySchema,
    updateGrcRequirementSchema,
    updateGrcRiskSchema,
} from '@gms/shared';
import { db } from '../db';
import {
    audit_log,
    grc_compliance_assessments,
    grc_compliance_requirements,
    grc_decisions,
    grc_policies,
    grc_risks,
    grc_screening_alerts,
    grc_screening_entities,
    memberships,
} from '../db/schema';
import { authMiddleware } from '../middleware/auth';
import { OrgContextVars, orgContext } from '../middleware/orgContext';
import { writeAuditLog } from '../lib/auditLog';

const grcRouter = new Hono<{ Variables: OrgContextVars }>();
grcRouter.use(authMiddleware);
grcRouter.use(orgContext);

type PolicyRow = typeof grc_policies.$inferSelect;
type DecisionRow = typeof grc_decisions.$inferSelect;
type RiskRow = typeof grc_risks.$inferSelect;
type RequirementRow = typeof grc_compliance_requirements.$inferSelect;
type AssessmentRow = typeof grc_compliance_assessments.$inferSelect;
type ScreeningEntityRow = typeof grc_screening_entities.$inferSelect;
type ScreeningAlertRow = typeof grc_screening_alerts.$inferSelect;
type AuditRow = typeof audit_log.$inferSelect;

function toIso(value: Date | string | null | undefined): string | null {
    if (!value) return null;
    return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function toDateOnly(value: Date | string | null | undefined): string {
    const iso = toIso(value);
    return iso ? iso.slice(0, 10) : '';
}

function asMitigation(value: unknown): { en: string; ar: string }[] {
    if (!Array.isArray(value)) return [];
    return value
        .filter((item): item is { en?: string; ar?: string } => !!item && typeof item === 'object')
        .map((item) => ({
            en: typeof item.en === 'string' ? item.en : '',
            ar: typeof item.ar === 'string' ? item.ar : (typeof item.en === 'string' ? item.en : ''),
        }));
}

function computeRiskLevel(score: number): 'Critical' | 'High' | 'Medium' | 'Low' {
    if (score >= 20) return 'Critical';
    if (score >= 15) return 'High';
    if (score >= 8) return 'Medium';
    return 'Low';
}

function mapPolicy(row: PolicyRow) {
    return {
        id: row.id,
        title: { en: row.title_en, ar: row.title_ar || row.title_en },
        category: row.category,
        status: row.status,
        version: row.version || '1.0',
        effectiveDate: toDateOnly(row.effective_date),
        reviewDate: toDateOnly(row.review_date),
        ownerUserId: row.owner_user_id || '',
    };
}

function mapDecision(row: DecisionRow) {
    return {
        id: row.id,
        title: { en: row.title_en, ar: row.title_ar || row.title_en },
        date: toDateOnly(row.decision_date),
        status: row.status,
        impact: row.impact,
        relatedPolicyId: row.related_policy_id ?? undefined,
    };
}

function mapRisk(row: RiskRow) {
    return {
        id: row.id,
        risk: { en: row.risk_en, ar: row.risk_ar || row.risk_en },
        category: row.category,
        probability: row.probability,
        impact: row.impact,
        score: row.score,
        level: row.level,
        scope: row.scope,
        mitigation: asMitigation(row.mitigation),
        status: row.status,
    };
}

function mapRequirement(row: RequirementRow) {
    return {
        id: row.id,
        code: row.code,
        title: { en: row.title_en, ar: row.title_ar || row.title_en },
        source: row.source,
        sourceName: { en: row.source_name_en, ar: row.source_name_ar || row.source_name_en },
        priority: row.priority,
        nextDueDate: toDateOnly(row.next_due_date),
        status: row.status,
    };
}

function mapAssessment(row: AssessmentRow) {
    const findings =
        row.findings_en || row.findings_ar
            ? { en: row.findings_en || '', ar: row.findings_ar || row.findings_en || '' }
            : undefined;
    return {
        id: row.id,
        requirementId: row.requirement_id,
        date: toDateOnly(row.assessment_date),
        status: row.status,
        score: row.score,
        assessorId: row.assessor_id || '',
        findings,
    };
}

function mapScreeningEntity(row: ScreeningEntityRow) {
    return {
        id: row.id,
        name: row.name,
        type: row.entity_type,
        country: row.country,
        riskLevel: row.risk_level,
        lastScreened: toIso(row.last_screened) || new Date().toISOString(),
        createdAt: toIso(row.created_at) || new Date().toISOString(),
    };
}

function mapScreeningAlert(row: ScreeningAlertRow) {
    return {
        id: row.id,
        entityId: row.entity_id || '',
        entityName: row.entity_name,
        matchDetails: row.match_details,
        listSource: row.list_source || '',
        status: row.status,
        createdAt: toIso(row.created_at) || new Date().toISOString(),
    };
}

function mapAuditEntry(row: AuditRow, userLabel: string) {
    const payload = row.payload && typeof row.payload === 'object' && !Array.isArray(row.payload)
        ? row.payload as Record<string, unknown>
        : {};
    const recordType = typeof payload.recordType === 'string' ? payload.recordType : 'Record';
    return {
        id: row.id,
        module: row.table_name,
        recordType,
        recordId: row.record_id || '',
        action: row.action,
        userId: userLabel,
        timestamp: toIso(row.created_at) || new Date().toISOString(),
    };
}

function simulateScreening(name: string, country: string) {
    const nameLower = name.trim().toLowerCase();
    const countryTrimmed = country.trim();

    if (!nameLower || !countryTrimmed) {
        return {
            risk_score: 10,
            risk_level: 'low' as const,
            recommendation: 'approve' as const,
            reasoning_en: 'Insufficient data provided for a meaningful match. No watchlist hits detected in simulated screening.',
            reasoning_ar: 'البيانات المقدمة غير كافية لمطابقة ذات معنى. لم يتم رصد أي تطابق في الفحص المحاكى.',
            matchDetails: null as string | null,
        };
    }

    const highKeywords = ['sanction', 'sanctions', 'terror', 'ofac', 'blocked', 'embargo'];
    if (highKeywords.some((k) => nameLower.includes(k) || countryTrimmed.toLowerCase().includes(k))) {
        return {
            risk_score: 88,
            risk_level: 'high' as const,
            recommendation: 'reject' as const,
            reasoning_en: `Strong simulated match for "${name}" on international sanctions lists (OFAC/UN). Direct name similarity requires rejection pending manual review.`,
            reasoning_ar: `تطابق محاكى قوي لـ "${name}" مع قوائم العقوبات الدولية (OFAC/UN). يتطلب التشابه المباشر الرفض بانتظار المراجعة اليدوية.`,
            matchDetails: `Potential OFAC SDN match: ${name} (${countryTrimmed})`,
        };
    }

    const mediumKeywords = ['global', 'international', 'trading', 'holdings', 'group'];
    if (mediumKeywords.some((k) => nameLower.includes(k)) || nameLower.split(/\s+/).length === 1) {
        return {
            risk_score: 55,
            risk_level: 'medium' as const,
            recommendation: 'review' as const,
            reasoning_en: `Partial or ambiguous simulated match for "${name}". Common name or corporate structure warrants enhanced due diligence.`,
            reasoning_ar: `تطابق محاكى جزئي أو غامض لـ "${name}". الاسم الشائع أو الهيكل المؤسسي يستدعي عناية واجبة معززة.`,
            matchDetails: `Ambiguous PEP/adverse media partial match: ${name}`,
        };
    }

    return {
        risk_score: 18,
        risk_level: 'low' as const,
        recommendation: 'approve' as const,
        reasoning_en: `No significant matches found for "${name}" in simulated OFAC, UN, EU, PEP, or adverse media lists.`,
        reasoning_ar: `لم يتم العثور على تطابقات مهمة لـ "${name}" في قوائم OFAC وUN وEU وPEP أو وسائل الإعلام السلبية المحاكاة.`,
        matchDetails: null as string | null,
    };
}

async function resolveUserLabels(orgId: string, userIds: string[]) {
    const unique = [...new Set(userIds.filter(Boolean))];
    if (unique.length === 0) return new Map<string, string>();

    const rows = await db
        .select({
            user_id: memberships.user_id,
            full_name_en: memberships.full_name_en,
            email: memberships.email,
        })
        .from(memberships)
        .where(eq(memberships.org_id, orgId));

    const map = new Map<string, string>();
    for (const row of rows) {
        const label = row.full_name_en?.trim() || row.email?.trim() || row.user_id;
        map.set(row.user_id, label);
    }
    return map;
}

async function audit(
    c: { get: (key: 'orgId' | 'user') => string | { id: string } },
    action: 'create' | 'update' | 'delete',
    module: string,
    recordType: string,
    recordId: string,
) {
    const user = c.get('user') as { id: string };
    await writeAuditLog({
        orgId: c.get('orgId') as string,
        userId: user.id,
        action,
        module,
        recordType,
        recordId,
    });
}

grcRouter.get('/', async (c) => {
    const orgId = c.get('orgId');

    const [policies, decisions, risks, requirements, assessments, auditRows] = await Promise.all([
        db.select().from(grc_policies).where(eq(grc_policies.org_id, orgId)).orderBy(desc(grc_policies.created_at)),
        db.select().from(grc_decisions).where(eq(grc_decisions.org_id, orgId)).orderBy(desc(grc_decisions.decision_date)),
        db.select().from(grc_risks).where(eq(grc_risks.org_id, orgId)).orderBy(desc(grc_risks.created_at)),
        db.select().from(grc_compliance_requirements).where(eq(grc_compliance_requirements.org_id, orgId)).orderBy(desc(grc_compliance_requirements.created_at)),
        db.select().from(grc_compliance_assessments).where(eq(grc_compliance_assessments.org_id, orgId)).orderBy(desc(grc_compliance_assessments.assessment_date)),
        db.select().from(audit_log).where(eq(audit_log.org_id, orgId)).orderBy(desc(audit_log.created_at)).limit(200),
    ]);

    const userLabels = await resolveUserLabels(orgId, auditRows.map((row) => row.user_id));

    return c.json({
        policies: policies.map(mapPolicy),
        decisions: decisions.map(mapDecision),
        risks: risks.map(mapRisk),
        requirements: requirements.map(mapRequirement),
        assessments: assessments.map(mapAssessment),
        auditLog: auditRows.map((row) => mapAuditEntry(row, userLabels.get(row.user_id) || row.user_id)),
    });
});

grcRouter.get('/screening', async (c) => {
    const orgId = c.get('orgId');

    const [entities, alerts] = await Promise.all([
        db.select().from(grc_screening_entities).where(eq(grc_screening_entities.org_id, orgId)).orderBy(desc(grc_screening_entities.last_screened)),
        db.select().from(grc_screening_alerts).where(eq(grc_screening_alerts.org_id, orgId)).orderBy(desc(grc_screening_alerts.created_at)),
    ]);

    const mappedEntities = entities.map(mapScreeningEntity);
    const mappedAlerts = alerts.map(mapScreeningAlert);

    return c.json({
        entities: mappedEntities,
        alerts: mappedAlerts,
        stats: {
            totalEntities: mappedEntities.length,
            highRisk: mappedEntities.filter((e) => e.riskLevel === 'high').length,
            mediumRisk: mappedEntities.filter((e) => e.riskLevel === 'medium').length,
            lowRisk: mappedEntities.filter((e) => e.riskLevel === 'low').length,
            openAlerts: mappedAlerts.filter((a) => a.status === 'open' || a.status === 'in-review').length,
        },
    });
});

grcRouter.post('/policies', async (c) => {
    const orgId = c.get('orgId');
    const body = await c.req.json();
    const parsed = createGrcPolicySchema.safeParse(body);
    if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);

    const data = parsed.data;
    const titleEn = data.title.en.trim() || data.title.ar.trim();
    const titleAr = data.title.ar.trim() || titleEn;

    const [row] = await db.insert(grc_policies).values({
        org_id: orgId,
        title_en: titleEn,
        title_ar: titleAr,
        category: data.category,
        status: data.status,
        version: data.version,
        effective_date: data.effectiveDate ? new Date(data.effectiveDate) : null,
        review_date: data.reviewDate ? new Date(data.reviewDate) : null,
        owner_user_id: data.ownerUserId,
        custom_fields: data.custom_fields,
    }).returning();

    await audit(c, 'create', 'governance', 'Policy', row.id);
    return c.json(mapPolicy(row), 201);
});

grcRouter.patch('/policies/:id', async (c) => {
    const orgId = c.get('orgId');
    const id = c.req.param('id');
    const existing = await db.select().from(grc_policies).where(and(eq(grc_policies.id, id), eq(grc_policies.org_id, orgId))).limit(1);
    if (!existing[0]) return c.json({ error: 'Not found' }, 404);

    const body = await c.req.json();
    const parsed = updateGrcPolicySchema.safeParse(body);
    if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);

    const data = parsed.data;
    const values: Partial<typeof grc_policies.$inferInsert> = {};
    if (data.title !== undefined) {
        values.title_en = data.title.en.trim() || data.title.ar.trim() || existing[0].title_en;
        values.title_ar = data.title.ar.trim() || values.title_en;
    }
    if (data.category !== undefined) values.category = data.category;
    if (data.status !== undefined) values.status = data.status;
    if (data.version !== undefined) values.version = data.version;
    if (data.effectiveDate !== undefined) values.effective_date = data.effectiveDate ? new Date(data.effectiveDate) : null;
    if (data.reviewDate !== undefined) values.review_date = data.reviewDate ? new Date(data.reviewDate) : null;
    if (data.ownerUserId !== undefined) values.owner_user_id = data.ownerUserId;
    if (data.custom_fields !== undefined) values.custom_fields = data.custom_fields;

    const [row] = await db.update(grc_policies).set(values).where(eq(grc_policies.id, id)).returning();
    await audit(c, 'update', 'governance', 'Policy', id);
    return c.json(mapPolicy(row));
});

grcRouter.delete('/policies/:id', async (c) => {
    const orgId = c.get('orgId');
    const id = c.req.param('id');
    const existing = await db.select().from(grc_policies).where(and(eq(grc_policies.id, id), eq(grc_policies.org_id, orgId))).limit(1);
    if (!existing[0]) return c.json({ error: 'Not found' }, 404);

    await db.delete(grc_policies).where(eq(grc_policies.id, id));
    await audit(c, 'delete', 'governance', 'Policy', id);
    return c.json({ ok: true });
});

grcRouter.post('/decisions', async (c) => {
    const orgId = c.get('orgId');
    const body = await c.req.json();
    const parsed = createGrcDecisionSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);

    const data = parsed.data;
    const titleEn = data.title.en.trim() || data.title.ar.trim();
    const titleAr = data.title.ar.trim() || titleEn;

    const [row] = await db.insert(grc_decisions).values({
        org_id: orgId,
        title_en: titleEn,
        title_ar: titleAr,
        decision_date: new Date(data.date),
        status: data.status,
        impact: data.impact,
        related_policy_id: data.relatedPolicyId ?? null,
        custom_fields: data.custom_fields,
    }).returning();

    await audit(c, 'create', 'governance', 'Decision', row.id);
    return c.json(mapDecision(row), 201);
});

grcRouter.patch('/decisions/:id', async (c) => {
    const orgId = c.get('orgId');
    const id = c.req.param('id');
    const existing = await db.select().from(grc_decisions).where(and(eq(grc_decisions.id, id), eq(grc_decisions.org_id, orgId))).limit(1);
    if (!existing[0]) return c.json({ error: 'Not found' }, 404);

    const body = await c.req.json();
    const parsed = updateGrcDecisionSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);

    const data = parsed.data;
    const values: Partial<typeof grc_decisions.$inferInsert> = {};
    if (data.title !== undefined) {
        values.title_en = data.title.en.trim() || data.title.ar.trim() || existing[0].title_en;
        values.title_ar = data.title.ar.trim() || values.title_en;
    }
    if (data.date !== undefined) values.decision_date = new Date(data.date);
    if (data.status !== undefined) values.status = data.status;
    if (data.impact !== undefined) values.impact = data.impact;
    if (data.relatedPolicyId !== undefined) values.related_policy_id = data.relatedPolicyId ?? null;
    if (data.custom_fields !== undefined) values.custom_fields = data.custom_fields;

    const [row] = await db.update(grc_decisions).set(values).where(eq(grc_decisions.id, id)).returning();
    await audit(c, 'update', 'governance', 'Decision', id);
    return c.json(mapDecision(row));
});

grcRouter.delete('/decisions/:id', async (c) => {
    const orgId = c.get('orgId');
    const id = c.req.param('id');
    const existing = await db.select().from(grc_decisions).where(and(eq(grc_decisions.id, id), eq(grc_decisions.org_id, orgId))).limit(1);
    if (!existing[0]) return c.json({ error: 'Not found' }, 404);

    await db.delete(grc_decisions).where(eq(grc_decisions.id, id));
    await audit(c, 'delete', 'governance', 'Decision', id);
    return c.json({ ok: true });
});

grcRouter.post('/risks', async (c) => {
    const orgId = c.get('orgId');
    const body = await c.req.json();
    const parsed = createGrcRiskSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);

    const data = parsed.data;
    const riskEn = data.risk.en.trim() || data.risk.ar.trim();
    const riskAr = data.risk.ar.trim() || riskEn;
    const score = data.score ?? data.probability * data.impact;
    const level = data.level ?? computeRiskLevel(score);

    const [row] = await db.insert(grc_risks).values({
        org_id: orgId,
        risk_en: riskEn,
        risk_ar: riskAr,
        category: data.category,
        probability: data.probability,
        impact: data.impact,
        score,
        level,
        scope: data.scope,
        mitigation: data.mitigation,
        status: data.status,
        custom_fields: data.custom_fields,
    }).returning();

    await audit(c, 'create', 'risk', 'Risk', row.id);
    return c.json(mapRisk(row), 201);
});

grcRouter.patch('/risks/:id', async (c) => {
    const orgId = c.get('orgId');
    const id = c.req.param('id');
    const existing = await db.select().from(grc_risks).where(and(eq(grc_risks.id, id), eq(grc_risks.org_id, orgId))).limit(1);
    if (!existing[0]) return c.json({ error: 'Not found' }, 404);

    const body = await c.req.json();
    const parsed = updateGrcRiskSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);

    const data = parsed.data;
    const values: Partial<typeof grc_risks.$inferInsert> = { updated_at: new Date() };
    if (data.risk !== undefined) {
        values.risk_en = data.risk.en.trim() || data.risk.ar.trim() || existing[0].risk_en;
        values.risk_ar = data.risk.ar.trim() || values.risk_en;
    }
    if (data.category !== undefined) values.category = data.category;
    if (data.probability !== undefined) values.probability = data.probability;
    if (data.impact !== undefined) values.impact = data.impact;
    if (data.probability !== undefined || data.impact !== undefined) {
        const probability = data.probability ?? existing[0].probability;
        const impact = data.impact ?? existing[0].impact;
        values.score = probability * impact;
        values.level = computeRiskLevel(values.score);
    }
    if (data.score !== undefined) {
        values.score = data.score;
        values.level = data.level ?? computeRiskLevel(data.score);
    }
    if (data.level !== undefined) values.level = data.level;
    if (data.scope !== undefined) values.scope = data.scope;
    if (data.mitigation !== undefined) values.mitigation = data.mitigation;
    if (data.status !== undefined) values.status = data.status;
    if (data.custom_fields !== undefined) values.custom_fields = data.custom_fields;

    const [row] = await db.update(grc_risks).set(values).where(eq(grc_risks.id, id)).returning();
    await audit(c, 'update', 'risk', 'Risk', id);
    return c.json(mapRisk(row));
});

grcRouter.delete('/risks/:id', async (c) => {
    const orgId = c.get('orgId');
    const id = c.req.param('id');
    const existing = await db.select().from(grc_risks).where(and(eq(grc_risks.id, id), eq(grc_risks.org_id, orgId))).limit(1);
    if (!existing[0]) return c.json({ error: 'Not found' }, 404);

    await db.delete(grc_risks).where(eq(grc_risks.id, id));
    await audit(c, 'delete', 'risk', 'Risk', id);
    return c.json({ ok: true });
});

grcRouter.post('/requirements', async (c) => {
    const orgId = c.get('orgId');
    const body = await c.req.json();
    const parsed = createGrcRequirementSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);

    const data = parsed.data;
    const titleEn = data.title.en.trim() || data.title.ar.trim();
    const titleAr = data.title.ar.trim() || titleEn;
    const sourceNameEn = data.sourceName.en.trim() || data.sourceName.ar.trim();
    const sourceNameAr = data.sourceName.ar.trim() || sourceNameEn;

    const [row] = await db.insert(grc_compliance_requirements).values({
        org_id: orgId,
        code: data.code.trim(),
        title_en: titleEn,
        title_ar: titleAr,
        source: data.source,
        source_name_en: sourceNameEn,
        source_name_ar: sourceNameAr,
        priority: data.priority,
        next_due_date: new Date(data.nextDueDate),
        status: data.status,
        custom_fields: data.custom_fields,
    }).returning();

    await audit(c, 'create', 'compliance', 'Requirement', row.id);
    return c.json(mapRequirement(row), 201);
});

grcRouter.patch('/requirements/:id', async (c) => {
    const orgId = c.get('orgId');
    const id = c.req.param('id');
    const existing = await db.select().from(grc_compliance_requirements).where(and(eq(grc_compliance_requirements.id, id), eq(grc_compliance_requirements.org_id, orgId))).limit(1);
    if (!existing[0]) return c.json({ error: 'Not found' }, 404);

    const body = await c.req.json();
    const parsed = updateGrcRequirementSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);

    const data = parsed.data;
    const values: Partial<typeof grc_compliance_requirements.$inferInsert> = {};
    if (data.code !== undefined) values.code = data.code.trim();
    if (data.title !== undefined) {
        values.title_en = data.title.en.trim() || data.title.ar.trim() || existing[0].title_en;
        values.title_ar = data.title.ar.trim() || values.title_en;
    }
    if (data.source !== undefined) values.source = data.source;
    if (data.sourceName !== undefined) {
        values.source_name_en = data.sourceName.en.trim() || data.sourceName.ar.trim() || existing[0].source_name_en;
        values.source_name_ar = data.sourceName.ar.trim() || values.source_name_en;
    }
    if (data.priority !== undefined) values.priority = data.priority;
    if (data.nextDueDate !== undefined) values.next_due_date = new Date(data.nextDueDate);
    if (data.status !== undefined) values.status = data.status;
    if (data.custom_fields !== undefined) values.custom_fields = data.custom_fields;

    const [row] = await db.update(grc_compliance_requirements).set(values).where(eq(grc_compliance_requirements.id, id)).returning();
    await audit(c, 'update', 'compliance', 'Requirement', id);
    return c.json(mapRequirement(row));
});

grcRouter.delete('/requirements/:id', async (c) => {
    const orgId = c.get('orgId');
    const id = c.req.param('id');
    const existing = await db.select().from(grc_compliance_requirements).where(and(eq(grc_compliance_requirements.id, id), eq(grc_compliance_requirements.org_id, orgId))).limit(1);
    if (!existing[0]) return c.json({ error: 'Not found' }, 404);

    await db.delete(grc_compliance_requirements).where(eq(grc_compliance_requirements.id, id));
    await audit(c, 'delete', 'compliance', 'Requirement', id);
    return c.json({ ok: true });
});

grcRouter.post('/assessments', async (c) => {
    const orgId = c.get('orgId');
    const user = c.get('user');
    const body = await c.req.json();
    const parsed = createGrcAssessmentSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);

    const data = parsed.data;
    const requirement = await db.select().from(grc_compliance_requirements).where(and(eq(grc_compliance_requirements.id, data.requirementId), eq(grc_compliance_requirements.org_id, orgId))).limit(1);
    if (!requirement[0]) return c.json({ error: 'Requirement not found' }, 404);

    const [row] = await db.insert(grc_compliance_assessments).values({
        org_id: orgId,
        requirement_id: data.requirementId,
        assessment_date: new Date(data.date),
        status: data.status,
        score: data.score,
        assessor_id: data.assessorId || user.id,
        findings_en: data.findings?.en ?? '',
        findings_ar: data.findings?.ar ?? '',
        custom_fields: data.custom_fields,
    }).returning();

    await audit(c, 'create', 'compliance', 'Assessment', row.id);
    return c.json(mapAssessment(row), 201);
});

grcRouter.post('/screening/screen', async (c) => {
    const orgId = c.get('orgId');
    const body = await c.req.json();
    const parsed = screenEntitySchema.safeParse(body);
    if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);

    const data = parsed.data;
    const result = simulateScreening(data.name, data.country);

    const [entity] = await db.insert(grc_screening_entities).values({
        org_id: orgId,
        name: data.name.trim(),
        entity_type: data.type,
        country: data.country.trim(),
        risk_level: result.risk_level,
        risk_score: result.risk_score,
        recommendation: result.recommendation,
        reasoning_en: result.reasoning_en,
        reasoning_ar: result.reasoning_ar,
        match_details: result.matchDetails,
        last_screened: new Date(),
    }).returning();

    let alert = null;
    if (result.risk_level === 'high' || result.risk_level === 'medium') {
        const [alertRow] = await db.insert(grc_screening_alerts).values({
            org_id: orgId,
            entity_id: entity.id,
            entity_name: entity.name,
            match_details: result.matchDetails || result.reasoning_en,
            list_source: data.listSourceLabel,
            status: 'open',
        }).returning();
        alert = mapScreeningAlert(alertRow);
    }

    await audit(c, 'create', 'screening', 'ScreeningEntity', entity.id);

    return c.json({
        entity: mapScreeningEntity(entity),
        result: {
            risk_score: result.risk_score,
            risk_level: result.risk_level,
            recommendation: result.recommendation,
            reasoning_en: result.reasoning_en,
            reasoning_ar: result.reasoning_ar,
            matchDetails: result.matchDetails,
        },
        alert,
    }, 201);
});

export { grcRouter };
