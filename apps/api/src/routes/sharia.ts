import { Hono } from 'hono';
import { and, desc, eq, ilike, or, sql } from 'drizzle-orm';
import {
    createShariaExceptionSchema,
    createShariaFatwaSchema,
    createShariaReviewSchema,
    createShariaZakatPolicyRuleSchema,
    createShariaZakatReviewSchema,
    updateShariaExceptionSchema,
    updateShariaFatwaSchema,
    updateShariaReviewSchema,
    updateShariaZakatPolicyRuleSchema,
    updateShariaZakatReviewSchema,
} from '@gms/shared';
import { db } from '../db';
import {
    funds,
    sharia_activities,
    sharia_exceptions,
    sharia_fatwas,
    sharia_reviews,
    sharia_zakat_policy_rules,
    sharia_zakat_reviews,
} from '../db/schema';
import { authMiddleware } from '../middleware/auth';
import { OrgContextVars, orgContext, requireModuleAccess } from '../middleware/orgContext';

const shariaRouter = new Hono<{ Variables: OrgContextVars }>();
shariaRouter.use(authMiddleware);
shariaRouter.use(orgContext);
shariaRouter.use(requireModuleAccess('sharia_compliance'));

type FatwaRow = typeof sharia_fatwas.$inferSelect;
type ReviewRow = typeof sharia_reviews.$inferSelect;
type ZakatReviewRow = typeof sharia_zakat_reviews.$inferSelect;
type PolicyRuleRow = typeof sharia_zakat_policy_rules.$inferSelect;
type ExceptionRow = typeof sharia_exceptions.$inferSelect;
type ActivityRow = typeof sharia_activities.$inferSelect;

interface StatusHistoryItem {
    status: string;
    actor: string;
    date: string;
}

function toIso(value: Date | string | null | undefined): string | null {
    if (!value) return null;
    return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function toDateOnly(value: Date | string | null | undefined): string {
    const iso = toIso(value);
    return iso ? iso.slice(0, 10) : '';
}

function asNumber(value: unknown): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
}

function localized(en: string, ar: string) {
    return { en, ar: ar || en };
}

function pickLocalized(value: { en: string; ar?: string }) {
    const en = value.en.trim();
    const ar = (value.ar || '').trim();
    return { en, ar: ar || en };
}

function asStatusHistory(value: unknown): StatusHistoryItem[] {
    if (!Array.isArray(value)) return [];
    return value
        .filter((item): item is StatusHistoryItem => !!item && typeof item === 'object')
        .map((item) => ({
            status: typeof item.status === 'string' ? item.status : '',
            actor: typeof item.actor === 'string' ? item.actor : '',
            date: typeof item.date === 'string' ? item.date : '',
        }));
}

async function appendActivity(
    orgId: string,
    event: {
        eventType: string;
        actor: string;
        linkedRecord: string;
        description: { en: string; ar: string };
    },
) {
    const desc = pickLocalized(event.description);
    await db.insert(sharia_activities).values({
        org_id: orgId,
        event_type: event.eventType,
        actor: event.actor,
        linked_record: event.linkedRecord,
        description_en: desc.en,
        description_ar: desc.ar,
        timestamp: new Date(),
    });
}

function mapFatwa(row: FatwaRow) {
    return {
        id: row.id,
        referenceNumber: row.reference_number,
        topic: localized(row.topic_en, row.topic_ar || row.topic_en),
        question: localized(row.question_en, row.question_ar || row.question_en),
        requester: row.requester,
        relatedModule: row.related_module,
        relatedRecord: row.related_record || '',
        status: row.status,
        priority: row.priority,
        assignedReviewerId: row.assigned_reviewer_id,
        requestedDate: toDateOnly(row.requested_date),
        dueDate: toDateOnly(row.due_date),
        issuedDate: row.issued_date ? toDateOnly(row.issued_date) : undefined,
        rulingSummary: localized(row.ruling_summary_en || '', row.ruling_summary_ar || row.ruling_summary_en || ''),
        reviewNotes: localized(row.review_notes_en || '', row.review_notes_ar || row.review_notes_en || ''),
        attachmentsCount: row.attachments_count,
        statusHistory: asStatusHistory(row.status_history),
    };
}

function mapReview(row: ReviewRow) {
    return {
        id: row.id,
        title: localized(row.title_en, row.title_ar || row.title_en),
        type: row.type,
        description: localized(row.description_en, row.description_ar || row.description_en),
        sourceModule: row.source_module,
        sourceRecord: row.source_record || '',
        counterpartyOrProject: row.counterparty_or_project,
        status: row.status,
        riskFlag: row.risk_flag,
        priority: row.priority,
        assignedReviewerId: row.assigned_reviewer_id,
        dueDate: toDateOnly(row.due_date),
        submittedDate: toDateOnly(row.submitted_date),
        decision: row.decision || undefined,
        conditions: localized(row.conditions_en || '', row.conditions_ar || row.conditions_en || ''),
        reviewNotes: localized(row.review_notes_en || '', row.review_notes_ar || row.review_notes_en || ''),
        attachmentsCount: row.attachments_count,
        activityHistory: asStatusHistory(row.activity_history),
    };
}

function mapZakatReview(row: ZakatReviewRow) {
    return {
        id: row.id,
        beneficiaryOrProgram: localized(row.beneficiary_en, row.beneficiary_ar || row.beneficiary_en),
        category: row.category,
        amount: asNumber(row.amount),
        date: toDateOnly(row.review_date),
        eligibilityStatus: row.eligibility_status,
        financialTransaction: row.financial_transaction || '',
        financialTransactionId: row.financial_transaction_id || undefined,
        reviewerId: row.reviewer_id,
        notes: localized(row.notes_en || '', row.notes_ar || row.notes_en || ''),
    };
}

function mapPolicyRule(row: PolicyRuleRow) {
    return {
        id: row.id,
        category: row.category,
        rule: localized(row.rule_en, row.rule_ar || row.rule_en),
        threshold: row.threshold || '',
        effectiveDate: toDateOnly(row.effective_date),
        status: row.status,
    };
}

function mapException(row: ExceptionRow) {
    return {
        id: row.id,
        title: localized(row.title_en, row.title_ar || row.title_en),
        severity: row.severity,
        source: row.source,
        linkedRecord: row.linked_record || '',
        owner: row.owner || '',
        status: row.status,
        createdDate: toDateOnly(row.created_date),
        resolutionNotes: localized(row.resolution_notes_en || '', row.resolution_notes_ar || row.resolution_notes_en || ''),
        followUpDate: row.follow_up_date ? toDateOnly(row.follow_up_date) : undefined,
    };
}

function mapActivity(row: ActivityRow) {
    return {
        id: row.id,
        eventType: row.event_type,
        actor: row.actor,
        timestamp: toIso(row.timestamp) || new Date().toISOString(),
        linkedRecord: row.linked_record || '',
        description: localized(row.description_en, row.description_ar || row.description_en),
    };
}

async function nextFatwaReference(orgId: string) {
    const year = new Date().getFullYear();
    const rows = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(sharia_fatwas)
        .where(and(eq(sharia_fatwas.org_id, orgId), ilike(sharia_fatwas.reference_number, `FTW-${year}-%`)));
    const next = (rows[0]?.count ?? 0) + 1;
    return `FTW-${year}-${String(next).padStart(3, '0')}`;
}

async function resolveZakatTarget(orgId: string) {
    const fundRows = await db
        .select()
        .from(funds)
        .where(and(
            eq(funds.org_id, orgId),
            or(
                ilike(funds.type, '%zakat%'),
                ilike(funds.name_en, '%zakat%'),
                ilike(funds.name_ar, '%زكاة%'),
            ),
        ));

    if (!fundRows.length) return null;

    return fundRows.reduce((sum, row) => sum + asNumber(row.total_received), 0);
}

function computeTrend(activities: ActivityRow[]) {
    const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun'] as const;
    const now = new Date();
    const buckets = months.map((month, index) => {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - (months.length - 1 - index), 1);
        const key = `${monthDate.getFullYear()}-${monthDate.getMonth()}`;
        const label = month;
        const monthActivities = activities.filter((activity) => {
            const ts = activity.timestamp instanceof Date ? activity.timestamp : new Date(activity.timestamp);
            return ts.getFullYear() === monthDate.getFullYear() && ts.getMonth() === monthDate.getMonth();
        });
        const resolvedExceptions = monthActivities.filter((item) => item.event_type === 'exceptionResolved').length;
        const completedReviews = monthActivities.filter((item) =>
            ['reviewUpdated', 'reviewSubmitted'].includes(item.event_type),
        ).length;
        const compliance = Math.min(100, Math.max(90, 94 + completedReviews * 0.4 + resolvedExceptions * 0.6));
        return { month: label, compliance: Math.round(compliance * 10) / 10, resolvedExceptions, completedReviews };
    });
    return buckets;
}

shariaRouter.get('/', async (c) => {
    const orgId = c.get('orgId');

    const [fatwaRows, reviewRows, zakatRows, policyRows, exceptionRows, activityRows, zakatTarget] = await Promise.all([
        db.select().from(sharia_fatwas).where(eq(sharia_fatwas.org_id, orgId)).orderBy(desc(sharia_fatwas.created_at)),
        db.select().from(sharia_reviews).where(eq(sharia_reviews.org_id, orgId)).orderBy(desc(sharia_reviews.created_at)),
        db.select().from(sharia_zakat_reviews).where(eq(sharia_zakat_reviews.org_id, orgId)).orderBy(desc(sharia_zakat_reviews.review_date)),
        db.select().from(sharia_zakat_policy_rules).where(eq(sharia_zakat_policy_rules.org_id, orgId)).orderBy(desc(sharia_zakat_policy_rules.effective_date)),
        db.select().from(sharia_exceptions).where(eq(sharia_exceptions.org_id, orgId)).orderBy(desc(sharia_exceptions.created_date)),
        db.select().from(sharia_activities).where(eq(sharia_activities.org_id, orgId)).orderBy(desc(sharia_activities.timestamp)).limit(200),
        resolveZakatTarget(orgId),
    ]);

    return c.json({
        fatwas: fatwaRows.map(mapFatwa),
        reviews: reviewRows.map(mapReview),
        zakatReviews: zakatRows.map(mapZakatReview),
        policyRules: policyRows.map(mapPolicyRule),
        exceptions: exceptionRows.map(mapException),
        activities: activityRows.map(mapActivity),
        trend: computeTrend(activityRows),
        zakatTarget,
    });
});

shariaRouter.post('/fatwas', async (c) => {
    const orgId = c.get('orgId');
    const body = await c.req.json();
    const parsed = createShariaFatwaSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);

    const data = parsed.data;
    const topic = pickLocalized(data.topic);
    const question = pickLocalized(data.question);
    const ruling = pickLocalized(data.rulingSummary || { en: '', ar: '' });
    const notes = pickLocalized(data.reviewNotes || { en: '', ar: '' });
    const referenceNumber = await nextFatwaReference(orgId);
    const statusHistory = data.statusHistory?.length
        ? data.statusHistory
        : [{ status: data.status || 'submitted', actor: data.requester, date: data.requestedDate }];

    const [row] = await db.insert(sharia_fatwas).values({
        org_id: orgId,
        reference_number: referenceNumber,
        topic_en: topic.en,
        topic_ar: topic.ar,
        question_en: question.en,
        question_ar: question.ar,
        requester: data.requester.trim(),
        related_module: data.relatedModule,
        related_record: data.relatedRecord || '',
        status: data.status || 'submitted',
        priority: data.priority,
        assigned_reviewer_id: data.assignedReviewerId,
        requested_date: new Date(data.requestedDate),
        due_date: new Date(data.dueDate),
        issued_date: data.issuedDate ? new Date(data.issuedDate) : null,
        ruling_summary_en: ruling.en,
        ruling_summary_ar: ruling.ar,
        review_notes_en: notes.en,
        review_notes_ar: notes.ar,
        attachments_count: data.attachmentsCount ?? 0,
        status_history: statusHistory,
        custom_fields: data.custom_fields,
    }).returning();

    await appendActivity(orgId, {
        eventType: 'fatwaRequested',
        actor: data.requester,
        linkedRecord: referenceNumber,
        description: {
            en: `Requested ruling for ${topic.en}.`,
            ar: `تم طلب حكم حول ${topic.ar}.`,
        },
    });

    return c.json(mapFatwa(row), 201);
});

shariaRouter.patch('/fatwas/:id', async (c) => {
    const orgId = c.get('orgId');
    const id = c.req.param('id');
    const body = await c.req.json();
    const parsed = updateShariaFatwaSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);

    const existing = await db.select().from(sharia_fatwas)
        .where(and(eq(sharia_fatwas.id, id), eq(sharia_fatwas.org_id, orgId)))
        .limit(1);
    if (!existing.length) return c.json({ error: 'Not found' }, 404);

    const data = parsed.data;
    const current = existing[0];
    const vals: Partial<typeof sharia_fatwas.$inferInsert> = { updated_at: new Date() };

    if (data.topic) {
        const topic = pickLocalized(data.topic);
        vals.topic_en = topic.en;
        vals.topic_ar = topic.ar;
    }
    if (data.question) {
        const question = pickLocalized(data.question);
        vals.question_en = question.en;
        vals.question_ar = question.ar;
    }
    if (data.requester !== undefined) vals.requester = data.requester;
    if (data.relatedModule !== undefined) vals.related_module = data.relatedModule;
    if (data.relatedRecord !== undefined) vals.related_record = data.relatedRecord;
    if (data.status !== undefined) vals.status = data.status;
    if (data.priority !== undefined) vals.priority = data.priority;
    if (data.assignedReviewerId !== undefined) vals.assigned_reviewer_id = data.assignedReviewerId;
    if (data.requestedDate !== undefined) vals.requested_date = new Date(data.requestedDate);
    if (data.dueDate !== undefined) vals.due_date = new Date(data.dueDate);
    if (data.issuedDate !== undefined) vals.issued_date = data.issuedDate ? new Date(data.issuedDate) : null;
    if (data.rulingSummary) {
        const ruling = pickLocalized(data.rulingSummary);
        vals.ruling_summary_en = ruling.en;
        vals.ruling_summary_ar = ruling.ar;
    }
    if (data.reviewNotes) {
        const notes = pickLocalized(data.reviewNotes);
        vals.review_notes_en = notes.en;
        vals.review_notes_ar = notes.ar;
    }
    if (data.attachmentsCount !== undefined) vals.attachments_count = data.attachmentsCount;
    if (data.statusHistory) {
        vals.status_history = data.statusHistory;
    } else if (data.status && data.status !== current.status) {
        const history = asStatusHistory(current.status_history);
        history.push({ status: data.status, actor: data.requester || current.requester, date: toDateOnly(new Date()) });
        vals.status_history = history;
    }
    if (data.custom_fields) vals.custom_fields = data.custom_fields;

    const [row] = await db.update(sharia_fatwas).set(vals)
        .where(and(eq(sharia_fatwas.id, id), eq(sharia_fatwas.org_id, orgId)))
        .returning();

    if (data.status === 'issued') {
        await appendActivity(orgId, {
            eventType: 'fatwaIssued',
            actor: current.requester,
            linkedRecord: current.reference_number,
            description: {
                en: `Issued ruling for ${row.topic_en}.`,
                ar: `تم إصدار حكم حول ${row.topic_ar || row.topic_en}.`,
            },
        });
    }

    return c.json(mapFatwa(row));
});

shariaRouter.delete('/fatwas/:id', async (c) => {
    const orgId = c.get('orgId');
    const id = c.req.param('id');
    const deleted = await db.delete(sharia_fatwas)
        .where(and(eq(sharia_fatwas.id, id), eq(sharia_fatwas.org_id, orgId)))
        .returning();
    if (!deleted.length) return c.json({ error: 'Not found' }, 404);
    return c.json({ ok: true });
});

shariaRouter.post('/reviews', async (c) => {
    const orgId = c.get('orgId');
    const body = await c.req.json();
    const parsed = createShariaReviewSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);

    const data = parsed.data;
    const title = pickLocalized(data.title);
    const description = pickLocalized(data.description);
    const conditions = pickLocalized(data.conditions || { en: '', ar: '' });
    const notes = pickLocalized(data.reviewNotes || { en: '', ar: '' });
    const activityHistory = data.activityHistory?.length
        ? data.activityHistory
        : [{ status: data.status || 'submitted', actor: data.sourceModule, date: data.submittedDate }];

    const [row] = await db.insert(sharia_reviews).values({
        org_id: orgId,
        title_en: title.en,
        title_ar: title.ar,
        type: data.type,
        description_en: description.en,
        description_ar: description.ar,
        source_module: data.sourceModule,
        source_record: data.sourceRecord || '',
        counterparty_or_project: data.counterpartyOrProject,
        status: data.status || 'submitted',
        risk_flag: data.riskFlag,
        priority: data.priority,
        assigned_reviewer_id: data.assignedReviewerId,
        due_date: new Date(data.dueDate),
        submitted_date: new Date(data.submittedDate),
        decision: data.decision || null,
        conditions_en: conditions.en,
        conditions_ar: conditions.ar,
        review_notes_en: notes.en,
        review_notes_ar: notes.ar,
        attachments_count: data.attachmentsCount ?? 0,
        activity_history: activityHistory,
        custom_fields: data.custom_fields,
    }).returning();

    await appendActivity(orgId, {
        eventType: 'reviewSubmitted',
        actor: data.sourceModule,
        linkedRecord: data.sourceRecord || data.counterpartyOrProject,
        description: {
            en: `Submitted ${title.en} for Sharia review.`,
            ar: `تم تقديم ${title.ar} للمراجعة الشرعية.`,
        },
    });

    return c.json(mapReview(row), 201);
});

shariaRouter.patch('/reviews/:id', async (c) => {
    const orgId = c.get('orgId');
    const id = c.req.param('id');
    const body = await c.req.json();
    const parsed = updateShariaReviewSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);

    const existing = await db.select().from(sharia_reviews)
        .where(and(eq(sharia_reviews.id, id), eq(sharia_reviews.org_id, orgId)))
        .limit(1);
    if (!existing.length) return c.json({ error: 'Not found' }, 404);

    const data = parsed.data;
    const current = existing[0];
    const vals: Partial<typeof sharia_reviews.$inferInsert> = { updated_at: new Date() };

    if (data.title) {
        const title = pickLocalized(data.title);
        vals.title_en = title.en;
        vals.title_ar = title.ar;
    }
    if (data.description) {
        const description = pickLocalized(data.description);
        vals.description_en = description.en;
        vals.description_ar = description.ar;
    }
    if (data.type !== undefined) vals.type = data.type;
    if (data.sourceModule !== undefined) vals.source_module = data.sourceModule;
    if (data.sourceRecord !== undefined) vals.source_record = data.sourceRecord;
    if (data.counterpartyOrProject !== undefined) vals.counterparty_or_project = data.counterpartyOrProject;
    if (data.status !== undefined) vals.status = data.status;
    if (data.riskFlag !== undefined) vals.risk_flag = data.riskFlag;
    if (data.priority !== undefined) vals.priority = data.priority;
    if (data.assignedReviewerId !== undefined) vals.assigned_reviewer_id = data.assignedReviewerId;
    if (data.dueDate !== undefined) vals.due_date = new Date(data.dueDate);
    if (data.submittedDate !== undefined) vals.submitted_date = new Date(data.submittedDate);
    if (data.decision !== undefined) vals.decision = data.decision;
    if (data.conditions) {
        const conditions = pickLocalized(data.conditions);
        vals.conditions_en = conditions.en;
        vals.conditions_ar = conditions.ar;
    }
    if (data.reviewNotes) {
        const notes = pickLocalized(data.reviewNotes);
        vals.review_notes_en = notes.en;
        vals.review_notes_ar = notes.ar;
    }
    if (data.attachmentsCount !== undefined) vals.attachments_count = data.attachmentsCount;
    if (data.activityHistory) {
        vals.activity_history = data.activityHistory;
    } else if (data.status && data.status !== current.status) {
        const history = asStatusHistory(current.activity_history);
        history.push({ status: data.status, actor: data.source_module, date: toDateOnly(new Date()) });
        vals.activity_history = history;
    }
    if (data.custom_fields) vals.custom_fields = data.custom_fields;

    const [row] = await db.update(sharia_reviews).set(vals)
        .where(and(eq(sharia_reviews.id, id), eq(sharia_reviews.org_id, orgId)))
        .returning();

    await appendActivity(orgId, {
        eventType: 'reviewUpdated',
        actor: row.source_module,
        linkedRecord: row.source_record || row.counterparty_or_project,
        description: {
            en: `Updated Sharia review for ${row.title_en}.`,
            ar: `تم تحديث المراجعة الشرعية لـ ${row.title_ar || row.title_en}.`,
        },
    });

    return c.json(mapReview(row));
});

shariaRouter.delete('/reviews/:id', async (c) => {
    const orgId = c.get('orgId');
    const id = c.req.param('id');
    const deleted = await db.delete(sharia_reviews)
        .where(and(eq(sharia_reviews.id, id), eq(sharia_reviews.org_id, orgId)))
        .returning();
    if (!deleted.length) return c.json({ error: 'Not found' }, 404);
    return c.json({ ok: true });
});

shariaRouter.post('/zakat-reviews', async (c) => {
    const orgId = c.get('orgId');
    const body = await c.req.json();
    const parsed = createShariaZakatReviewSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);

    const data = parsed.data;
    const beneficiary = pickLocalized(data.beneficiaryOrProgram);
    const notes = pickLocalized(data.notes || { en: '', ar: '' });

    const [row] = await db.insert(sharia_zakat_reviews).values({
        org_id: orgId,
        beneficiary_en: beneficiary.en,
        beneficiary_ar: beneficiary.ar,
        category: data.category,
        amount: String(data.amount),
        review_date: new Date(data.date),
        eligibility_status: data.eligibilityStatus,
        financial_transaction: data.financialTransaction || '',
        financial_transaction_id: data.financialTransactionId || null,
        reviewer_id: data.reviewerId,
        notes_en: notes.en,
        notes_ar: notes.ar,
        custom_fields: data.custom_fields,
    }).returning();

    await appendActivity(orgId, {
        eventType: 'zakatReviewLogged',
        actor: data.reviewerId,
        linkedRecord: data.financialTransaction || data.category,
        description: {
            en: `Logged zakat review for ${beneficiary.en}.`,
            ar: `تم تسجيل مراجعة زكاة لـ ${beneficiary.ar}.`,
        },
    });

    return c.json(mapZakatReview(row), 201);
});

shariaRouter.patch('/zakat-reviews/:id', async (c) => {
    const orgId = c.get('orgId');
    const id = c.req.param('id');
    const body = await c.req.json();
    const parsed = updateShariaZakatReviewSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);

    const existing = await db.select().from(sharia_zakat_reviews)
        .where(and(eq(sharia_zakat_reviews.id, id), eq(sharia_zakat_reviews.org_id, orgId)))
        .limit(1);
    if (!existing.length) return c.json({ error: 'Not found' }, 404);

    const data = parsed.data;
    const vals: Partial<typeof sharia_zakat_reviews.$inferInsert> = { updated_at: new Date() };

    if (data.beneficiaryOrProgram) {
        const beneficiary = pickLocalized(data.beneficiaryOrProgram);
        vals.beneficiary_en = beneficiary.en;
        vals.beneficiary_ar = beneficiary.ar;
    }
    if (data.category !== undefined) vals.category = data.category;
    if (data.amount !== undefined) vals.amount = String(data.amount);
    if (data.date !== undefined) vals.review_date = new Date(data.date);
    if (data.eligibilityStatus !== undefined) vals.eligibility_status = data.eligibilityStatus;
    if (data.financialTransaction !== undefined) vals.financial_transaction = data.financialTransaction;
    if (data.financialTransactionId !== undefined) vals.financial_transaction_id = data.financialTransactionId;
    if (data.reviewerId !== undefined) vals.reviewer_id = data.reviewerId;
    if (data.notes) {
        const notes = pickLocalized(data.notes);
        vals.notes_en = notes.en;
        vals.notes_ar = notes.ar;
    }
    if (data.custom_fields) vals.custom_fields = data.custom_fields;

    const [row] = await db.update(sharia_zakat_reviews).set(vals)
        .where(and(eq(sharia_zakat_reviews.id, id), eq(sharia_zakat_reviews.org_id, orgId)))
        .returning();

    return c.json(mapZakatReview(row));
});

shariaRouter.delete('/zakat-reviews/:id', async (c) => {
    const orgId = c.get('orgId');
    const id = c.req.param('id');
    const deleted = await db.delete(sharia_zakat_reviews)
        .where(and(eq(sharia_zakat_reviews.id, id), eq(sharia_zakat_reviews.org_id, orgId)))
        .returning();
    if (!deleted.length) return c.json({ error: 'Not found' }, 404);
    return c.json({ ok: true });
});

shariaRouter.post('/policy-rules', async (c) => {
    const orgId = c.get('orgId');
    const body = await c.req.json();
    const parsed = createShariaZakatPolicyRuleSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);

    const data = parsed.data;
    const rule = pickLocalized(data.rule);

    const [row] = await db.insert(sharia_zakat_policy_rules).values({
        org_id: orgId,
        category: data.category,
        rule_en: rule.en,
        rule_ar: rule.ar,
        threshold: data.threshold || '',
        effective_date: new Date(data.effectiveDate),
        status: data.status || 'active',
        custom_fields: data.custom_fields,
    }).returning();

    return c.json(mapPolicyRule(row), 201);
});

shariaRouter.patch('/policy-rules/:id', async (c) => {
    const orgId = c.get('orgId');
    const id = c.req.param('id');
    const body = await c.req.json();
    const parsed = updateShariaZakatPolicyRuleSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);

    const existing = await db.select().from(sharia_zakat_policy_rules)
        .where(and(eq(sharia_zakat_policy_rules.id, id), eq(sharia_zakat_policy_rules.org_id, orgId)))
        .limit(1);
    if (!existing.length) return c.json({ error: 'Not found' }, 404);

    const data = parsed.data;
    const vals: Partial<typeof sharia_zakat_policy_rules.$inferInsert> = { updated_at: new Date() };

    if (data.category !== undefined) vals.category = data.category;
    if (data.rule) {
        const rule = pickLocalized(data.rule);
        vals.rule_en = rule.en;
        vals.rule_ar = rule.ar;
    }
    if (data.threshold !== undefined) vals.threshold = data.threshold;
    if (data.effectiveDate !== undefined) vals.effective_date = new Date(data.effectiveDate);
    if (data.status !== undefined) vals.status = data.status;
    if (data.custom_fields) vals.custom_fields = data.custom_fields;

    const [row] = await db.update(sharia_zakat_policy_rules).set(vals)
        .where(and(eq(sharia_zakat_policy_rules.id, id), eq(sharia_zakat_policy_rules.org_id, orgId)))
        .returning();

    return c.json(mapPolicyRule(row));
});

shariaRouter.delete('/policy-rules/:id', async (c) => {
    const orgId = c.get('orgId');
    const id = c.req.param('id');
    const deleted = await db.delete(sharia_zakat_policy_rules)
        .where(and(eq(sharia_zakat_policy_rules.id, id), eq(sharia_zakat_policy_rules.org_id, orgId)))
        .returning();
    if (!deleted.length) return c.json({ error: 'Not found' }, 404);
    return c.json({ ok: true });
});

shariaRouter.post('/exceptions', async (c) => {
    const orgId = c.get('orgId');
    const body = await c.req.json();
    const parsed = createShariaExceptionSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);

    const data = parsed.data;
    const title = pickLocalized(data.title);
    const notes = pickLocalized(data.resolutionNotes || { en: '', ar: '' });

    const [row] = await db.insert(sharia_exceptions).values({
        org_id: orgId,
        title_en: title.en,
        title_ar: title.ar,
        severity: data.severity,
        source: data.source,
        linked_record: data.linkedRecord || '',
        owner: data.owner || '',
        status: data.status || 'open',
        created_date: new Date(data.createdDate),
        resolution_notes_en: notes.en,
        resolution_notes_ar: notes.ar,
        follow_up_date: data.followUpDate ? new Date(data.followUpDate) : null,
        custom_fields: data.custom_fields,
    }).returning();

    await appendActivity(orgId, {
        eventType: 'exceptionCreated',
        actor: data.owner || 'System',
        linkedRecord: data.linkedRecord || title.en,
        description: {
            en: `Opened exception: ${title.en}.`,
            ar: `تم فتح استثناء: ${title.ar}.`,
        },
    });

    return c.json(mapException(row), 201);
});

shariaRouter.patch('/exceptions/:id', async (c) => {
    const orgId = c.get('orgId');
    const id = c.req.param('id');
    const body = await c.req.json();
    const parsed = updateShariaExceptionSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);

    const existing = await db.select().from(sharia_exceptions)
        .where(and(eq(sharia_exceptions.id, id), eq(sharia_exceptions.org_id, orgId)))
        .limit(1);
    if (!existing.length) return c.json({ error: 'Not found' }, 404);

    const data = parsed.data;
    const current = existing[0];
    const vals: Partial<typeof sharia_exceptions.$inferInsert> = { updated_at: new Date() };

    if (data.title) {
        const title = pickLocalized(data.title);
        vals.title_en = title.en;
        vals.title_ar = title.ar;
    }
    if (data.severity !== undefined) vals.severity = data.severity;
    if (data.source !== undefined) vals.source = data.source;
    if (data.linkedRecord !== undefined) vals.linked_record = data.linkedRecord;
    if (data.owner !== undefined) vals.owner = data.owner;
    if (data.status !== undefined) vals.status = data.status;
    if (data.createdDate !== undefined) vals.created_date = new Date(data.createdDate);
    if (data.resolutionNotes) {
        const notes = pickLocalized(data.resolutionNotes);
        vals.resolution_notes_en = notes.en;
        vals.resolution_notes_ar = notes.ar;
    }
    if (data.followUpDate !== undefined) vals.follow_up_date = data.followUpDate ? new Date(data.followUpDate) : null;
    if (data.custom_fields) vals.custom_fields = data.custom_fields;

    const [row] = await db.update(sharia_exceptions).set(vals)
        .where(and(eq(sharia_exceptions.id, id), eq(sharia_exceptions.org_id, orgId)))
        .returning();

    if (data.status === 'resolved' && current.status !== 'resolved') {
        await appendActivity(orgId, {
            eventType: 'exceptionResolved',
            actor: row.owner || 'System',
            linkedRecord: row.linked_record || row.title_en,
            description: {
                en: `Resolved exception: ${row.title_en}.`,
                ar: `تم حل الاستثناء: ${row.title_ar || row.title_en}.`,
            },
        });
    }

    return c.json(mapException(row));
});

shariaRouter.delete('/exceptions/:id', async (c) => {
    const orgId = c.get('orgId');
    const id = c.req.param('id');
    const deleted = await db.delete(sharia_exceptions)
        .where(and(eq(sharia_exceptions.id, id), eq(sharia_exceptions.org_id, orgId)))
        .returning();
    if (!deleted.length) return c.json({ error: 'Not found' }, 404);
    return c.json({ ok: true });
});

export { shariaRouter };
