import { Hono } from 'hono';
import { and, desc, eq } from 'drizzle-orm';
import { db } from '../db';
import {
    beneficiaries,
    projects,
    project_budget_lines,
    project_expenses,
    project_kpis,
    project_risks,
    project_tasks,
    project_team_members,
} from '../db/schema';
import { authMiddleware } from '../middleware/auth';
import { OrgContextVars, orgContext, requireModuleAccess } from '../middleware/orgContext';
import {
    createProjectExpenseSchema,
    createProjectRiskSchema,
    createProjectSchema,
    createProjectTaskSchema,
    updateProjectRiskSchema,
    updateProjectSchema,
    updateProjectTaskSchema,
} from '@gms/shared';

const projectsRouter = new Hono<{ Variables: OrgContextVars }>();
projectsRouter.use(authMiddleware);
projectsRouter.use(orgContext);
projectsRouter.use(requireModuleAccess('projects'));

function asNumber(value: unknown): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
}

function asStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is string => typeof item === 'string');
}

function asNumberArray(value: unknown): number[] {
    if (!Array.isArray(value)) return [];
    return value.map((item) => Number(item)).filter((item) => Number.isFinite(item));
}

function asRecord(value: unknown): Record<string, unknown> {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
        return value as Record<string, unknown>;
    }
    return {};
}

function asObjectArray(value: unknown): Record<string, unknown>[] {
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is Record<string, unknown> => !!item && typeof item === 'object' && !Array.isArray(item));
}

function asBurnRate(value: unknown): { month: string; value: number }[] {
    return asObjectArray(value)
        .map((point) => ({
            month: typeof point.month === 'string' ? point.month : '',
            value: asNumber(point.value),
        }))
        .filter((point) => point.month);
}

function toIsoDate(dateValue: Date | string | null | undefined): string {
    if (!dateValue) return '';
    return dateValue instanceof Date ? dateValue.toISOString() : String(dateValue);
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function resolveImplementingPartnerStakeholder(value: string | undefined) {
    const raw = (value || '').trim();
    if (UUID_RE.test(raw)) {
        return { implementing_partner: raw, implementing_partner_id: raw };
    }
    return { implementing_partner: raw, implementing_partner_id: null };
}

function buildProjectModel(
    row: typeof projects.$inferSelect,
    related?: {
        kpis?: Array<typeof project_kpis.$inferSelect>;
        tasks?: Array<typeof project_tasks.$inferSelect>;
        budgetLines?: Array<typeof project_budget_lines.$inferSelect>;
        expenses?: Array<typeof project_expenses.$inferSelect>;
        risks?: Array<typeof project_risks.$inferSelect>;
        teamMembers?: Array<typeof project_team_members.$inferSelect>;
    },
) {
    const kpis = (related?.kpis ?? []).map((kpi) => ({
        id: kpi.id,
        name: kpi.name,
        unit: (kpi.unit as 'number' | 'percentage' | 'text') || 'number',
        target: kpi.target || '',
    }));
    const tasks = (related?.tasks ?? []).map((task) => ({
        id: task.id,
        name: task.name,
        start: task.start_date || '',
        end: task.end_date || '',
        progress: task.progress ?? 0,
    }));
    const budgetDetails = (related?.budgetLines ?? []).map((line) => ({
        category: line.category,
        planned: asNumber(line.planned),
        actual: asNumber(line.actual),
    }));
    const expenseLog = (related?.expenses ?? []).map((expense) => ({
        id: expense.id,
        date: expense.date,
        category: expense.category,
        description: expense.description,
        amount: asNumber(expense.amount),
        wbsId: '',
    }));
    const riskRegister = (related?.risks ?? []).map((risk) => ({
        id: risk.id,
        description: risk.description,
        category: risk.category as 'financial' | 'security' | 'operational' | 'political' | 'reputational',
        probability: risk.probability as 'low' | 'medium' | 'high',
        impact: risk.impact as 'low' | 'medium' | 'high',
        responseStrategy: risk.response_strategy as 'avoid' | 'mitigate' | 'transfer' | 'accept',
        contingencyPlan: risk.contingency_plan || '',
        owner: risk.owner || '',
        status: risk.status as 'open' | 'in-progress' | 'closed',
    }));
    const projectTeam = (related?.teamMembers ?? []).map((member) => ({
        userId: member.user_id,
        name: member.user_id,
        photo: '',
        projectRole: member.project_role || '',
        effort: member.effort ?? 0,
        availability: member.availability || '',
    }));
    const spent = asNumber(row.spent);
    const budget = asNumber(row.budget);
    const customFields = asRecord(row.custom_fields);
    const documents = asObjectArray(customFields.documents);
    const burnRate = asBurnRate(customFields.burnRate);

    return {
        id: row.id,
        name: {
            en: row.name_en || '',
            ar: row.name_ar || '',
        },
        type: row.type as 'humanitarian' | 'development' | 'health' | 'education' | 'infrastructure',
        stage: row.stage as 'design' | 'planning' | 'implementation' | 'monitoring' | 'closure',
        sdgGoals: asNumberArray(row.sdg_goals),
        plannedStartDate: row.planned_start_date || '',
        plannedEndDate: row.planned_end_date || '',
        location: {
            country: row.country || '',
            city: row.city || '',
            region: row.region || '',
        },
        stakeholders: {
            donor: row.donor || '',
            implementingPartner: row.implementing_partner_id || row.implementing_partner || '',
            targetBeneficiaries: row.target_beneficiaries || '',
            primaryContact: row.primary_contact || '',
        },
        goal: row.goal || '',
        objectives: asStringArray(row.objectives),
        expectedOutcomes: asStringArray(row.expected_outcomes),
        kpis,
        progress: row.progress ?? 0,
        budget,
        spent,
        documents,
        scopeStatement: {
            inScope: asStringArray(row.scope_in),
            outOfScope: asStringArray(row.scope_out),
            assumptions: asStringArray(row.scope_assumptions),
            constraints: asStringArray(row.scope_constraints),
        },
        wbs: {
            id: `wbs-${row.id}`,
            name: row.name_en || '',
            type: 'deliverable' as const,
            children: [],
        },
        schedule: tasks,
        criticalPath: [],
        costManagement: {
            currency: 'USD',
            budgetDetails,
            expenseLog,
            financialSummary: {
                burnRate,
                pv: budget,
                ev: Math.round((budget * (row.progress ?? 0)) / 100),
                ac: spent,
                spi: budget > 0 ? Number(((Math.round((budget * (row.progress ?? 0)) / 100) || 0) / budget).toFixed(2)) : 0,
                cpi: spent > 0 ? Number(((Math.round((budget * (row.progress ?? 0)) / 100) || 0) / spent).toFixed(2)) : 0,
                eac: budget,
                etc: Math.max(0, budget - spent),
            },
        },
        humanResources: {
            projectTeam,
            raciMatrix: {},
            timesheet: [],
        },
        riskManagement: {
            riskRegister,
        },
        qualityManagement: {
            standards: [],
            lessonsLearned: [],
        },
        monitoring: {
            evmHistory: [],
        },
        changeLog: [],
        createdAt: toIsoDate(row.created_at),
        updatedAt: toIsoDate(row.updated_at),
    };
}

async function getOrgProject(projectId: string, orgId: string) {
    const rows = await db
        .select()
        .from(projects)
        .where(and(eq(projects.id, projectId), eq(projects.org_id, orgId)))
        .limit(1);
    return rows[0] ?? null;
}

projectsRouter.get('/', async (c) => {
    const orgId = c.get('orgId');

    const rows = await db.select().from(projects).where(eq(projects.org_id, orgId));
    return c.json(rows.map((row) => buildProjectModel(row)));
});

projectsRouter.post('/', async (c) => {
    const orgId = c.get('orgId');

    const body = await c.req.json();
    const parsed = createProjectSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);

    const data = parsed.data;
    const partnerFields = resolveImplementingPartnerStakeholder(data.stakeholders.implementingPartner);
    const [project] = await db
        .insert(projects)
        .values({
            org_id: orgId,
            name_en: data.name.en,
            name_ar: data.name.ar,
            type: data.type,
            stage: data.stage,
            sdg_goals: data.sdgGoals,
            planned_start_date: data.plannedStartDate,
            planned_end_date: data.plannedEndDate,
            country: data.location.country,
            city: data.location.city,
            region: data.location.region || '',
            donor: data.stakeholders.donor,
            implementing_partner: partnerFields.implementing_partner,
            implementing_partner_id: partnerFields.implementing_partner_id,
            target_beneficiaries: data.stakeholders.targetBeneficiaries,
            primary_contact: data.stakeholders.primaryContact,
            goal: data.goal,
            objectives: data.objectives,
            expected_outcomes: data.expectedOutcomes,
            progress: data.progress,
            budget: String(data.budget),
            spent: String(data.spent),
            scope_in: data.scopeStatement.inScope,
            scope_out: data.scopeStatement.outOfScope,
            scope_assumptions: data.scopeStatement.assumptions,
            scope_constraints: data.scopeStatement.constraints,
            custom_fields: {},
        })
        .returning();

    if (data.kpis.length > 0) {
        await db.insert(project_kpis).values(
            data.kpis.map((kpi) => ({
                org_id: orgId,
                project_id: project.id,
                name: kpi.name,
                unit: kpi.unit,
                target: kpi.target,
                custom_fields: {},
            })),
        );
    }

    const kpiRows = await db.select().from(project_kpis).where(and(eq(project_kpis.project_id, project.id), eq(project_kpis.org_id, orgId)));
    return c.json(buildProjectModel(project, { kpis: kpiRows }), 201);
});

projectsRouter.get('/:id', async (c) => {
    const orgId = c.get('orgId');

    const project = await getOrgProject(c.req.param('id'), orgId);
    if (!project) return c.json({ error: 'Not found' }, 404);

    const [kpis, tasks, budgetLines, expenses, risks, teamMembers] = await Promise.all([
        db.select().from(project_kpis).where(and(eq(project_kpis.project_id, project.id), eq(project_kpis.org_id, orgId))),
        db.select().from(project_tasks).where(and(eq(project_tasks.project_id, project.id), eq(project_tasks.org_id, orgId))),
        db.select().from(project_budget_lines).where(and(eq(project_budget_lines.project_id, project.id), eq(project_budget_lines.org_id, orgId))),
        db.select().from(project_expenses).where(and(eq(project_expenses.project_id, project.id), eq(project_expenses.org_id, orgId))),
        db.select().from(project_risks).where(and(eq(project_risks.project_id, project.id), eq(project_risks.org_id, orgId))),
        db.select().from(project_team_members).where(and(eq(project_team_members.project_id, project.id), eq(project_team_members.org_id, orgId))),
    ]);

    return c.json(buildProjectModel(project, { kpis, tasks, budgetLines, expenses, risks, teamMembers }));
});

projectsRouter.patch('/:id', async (c) => {
    const orgId = c.get('orgId');

    const existing = await getOrgProject(c.req.param('id'), orgId);
    if (!existing) return c.json({ error: 'Not found' }, 404);

    const body = await c.req.json();
    const parsed = updateProjectSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);

    const data = parsed.data;
    const values: Record<string, unknown> = { updated_at: new Date() };
    if (data.name !== undefined) {
        values.name_en = data.name.en;
        values.name_ar = data.name.ar;
    }
    if (data.type !== undefined) values.type = data.type;
    if (data.stage !== undefined) values.stage = data.stage;
    if (data.sdgGoals !== undefined) values.sdg_goals = data.sdgGoals;
    if (data.plannedStartDate !== undefined) values.planned_start_date = data.plannedStartDate;
    if (data.plannedEndDate !== undefined) values.planned_end_date = data.plannedEndDate;
    if (data.location !== undefined) {
        values.country = data.location.country;
        values.city = data.location.city;
        values.region = data.location.region || '';
    }
    if (data.stakeholders !== undefined) {
        const partnerFields = resolveImplementingPartnerStakeholder(data.stakeholders.implementingPartner);
        values.donor = data.stakeholders.donor;
        values.implementing_partner = partnerFields.implementing_partner;
        values.implementing_partner_id = partnerFields.implementing_partner_id;
        values.target_beneficiaries = data.stakeholders.targetBeneficiaries;
        values.primary_contact = data.stakeholders.primaryContact;
    }
    if (data.goal !== undefined) values.goal = data.goal;
    if (data.objectives !== undefined) values.objectives = data.objectives;
    if (data.expectedOutcomes !== undefined) values.expected_outcomes = data.expectedOutcomes;
    if (data.progress !== undefined) values.progress = data.progress;
    if (data.budget !== undefined) values.budget = String(data.budget);
    if (data.spent !== undefined) values.spent = String(data.spent);
    if (data.scopeStatement !== undefined) {
        values.scope_in = data.scopeStatement.inScope;
        values.scope_out = data.scopeStatement.outOfScope;
        values.scope_assumptions = data.scopeStatement.assumptions;
        values.scope_constraints = data.scopeStatement.constraints;
    }

    const [updated] = await db
        .update(projects)
        .set(values)
        .where(and(eq(projects.id, existing.id), eq(projects.org_id, orgId)))
        .returning();

    if (data.kpis !== undefined) {
        await db.delete(project_kpis).where(and(eq(project_kpis.project_id, existing.id), eq(project_kpis.org_id, orgId)));
        if (data.kpis.length > 0) {
            await db.insert(project_kpis).values(
                data.kpis.map((kpi) => ({
                    org_id: orgId,
                    project_id: existing.id,
                    name: kpi.name,
                    unit: kpi.unit,
                    target: kpi.target,
                    custom_fields: {},
                })),
            );
        }
    }

    const kpis = await db.select().from(project_kpis).where(and(eq(project_kpis.project_id, existing.id), eq(project_kpis.org_id, orgId)));
    return c.json(buildProjectModel(updated, { kpis }));
});

projectsRouter.delete('/:id', async (c) => {
    const orgId = c.get('orgId');

    const existing = await getOrgProject(c.req.param('id'), orgId);
    if (!existing) return c.json({ error: 'Not found' }, 404);

    await db.delete(project_kpis).where(and(eq(project_kpis.project_id, existing.id), eq(project_kpis.org_id, orgId)));
    await db.delete(project_tasks).where(and(eq(project_tasks.project_id, existing.id), eq(project_tasks.org_id, orgId)));
    await db.delete(project_budget_lines).where(and(eq(project_budget_lines.project_id, existing.id), eq(project_budget_lines.org_id, orgId)));
    await db.delete(project_expenses).where(and(eq(project_expenses.project_id, existing.id), eq(project_expenses.org_id, orgId)));
    await db.delete(project_risks).where(and(eq(project_risks.project_id, existing.id), eq(project_risks.org_id, orgId)));
    await db.delete(project_team_members).where(and(eq(project_team_members.project_id, existing.id), eq(project_team_members.org_id, orgId)));
    await db.delete(projects).where(and(eq(projects.id, existing.id), eq(projects.org_id, orgId)));

    return c.json({ ok: true });
});

projectsRouter.get('/:id/tasks', async (c) => {
    const orgId = c.get('orgId');
    const project = await getOrgProject(c.req.param('id'), orgId);
    if (!project) return c.json({ error: 'Not found' }, 404);

    const rows = await db.select().from(project_tasks).where(and(eq(project_tasks.project_id, project.id), eq(project_tasks.org_id, orgId)));
    return c.json(rows.map((task) => ({ id: task.id, name: task.name, start: task.start_date || '', end: task.end_date || '', progress: task.progress ?? 0 })));
});

projectsRouter.post('/:id/tasks', async (c) => {
    const orgId = c.get('orgId');
    const project = await getOrgProject(c.req.param('id'), orgId);
    if (!project) return c.json({ error: 'Not found' }, 404);

    const body = await c.req.json();
    const parsed = createProjectTaskSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);

    const [task] = await db.insert(project_tasks).values({
        org_id: orgId,
        project_id: project.id,
        name: parsed.data.name,
        start_date: parsed.data.start,
        end_date: parsed.data.end,
        progress: parsed.data.progress,
        custom_fields: {},
    }).returning();

    return c.json({ id: task.id, name: task.name, start: task.start_date || '', end: task.end_date || '', progress: task.progress ?? 0 }, 201);
});

projectsRouter.patch('/:id/tasks/:taskId', async (c) => {
    const orgId = c.get('orgId');
    const project = await getOrgProject(c.req.param('id'), orgId);
    if (!project) return c.json({ error: 'Not found' }, 404);

    const body = await c.req.json();
    const parsed = updateProjectTaskSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);

    const values: Record<string, unknown> = {};
    if (parsed.data.name !== undefined) values.name = parsed.data.name;
    if (parsed.data.start !== undefined) values.start_date = parsed.data.start;
    if (parsed.data.end !== undefined) values.end_date = parsed.data.end;
    if (parsed.data.progress !== undefined) values.progress = parsed.data.progress;

    const [task] = await db.update(project_tasks).set(values)
        .where(and(eq(project_tasks.id, c.req.param('taskId')), eq(project_tasks.project_id, project.id), eq(project_tasks.org_id, orgId)))
        .returning();
    if (!task) return c.json({ error: 'Not found' }, 404);

    return c.json({ id: task.id, name: task.name, start: task.start_date || '', end: task.end_date || '', progress: task.progress ?? 0 });
});

projectsRouter.delete('/:id/tasks/:taskId', async (c) => {
    const orgId = c.get('orgId');
    const project = await getOrgProject(c.req.param('id'), orgId);
    if (!project) return c.json({ error: 'Not found' }, 404);

    const [deletedTask] = await db.delete(project_tasks)
        .where(and(eq(project_tasks.id, c.req.param('taskId')), eq(project_tasks.project_id, project.id), eq(project_tasks.org_id, orgId)))
        .returning();
    if (!deletedTask) return c.json({ error: 'Not found' }, 404);
    return c.json({ ok: true });
});

projectsRouter.get('/:id/risks', async (c) => {
    const orgId = c.get('orgId');
    const project = await getOrgProject(c.req.param('id'), orgId);
    if (!project) return c.json({ error: 'Not found' }, 404);

    const rows = await db.select().from(project_risks).where(and(eq(project_risks.project_id, project.id), eq(project_risks.org_id, orgId)));
    return c.json(rows.map((risk) => ({
        id: risk.id,
        description: risk.description,
        category: risk.category,
        probability: risk.probability,
        impact: risk.impact,
        responseStrategy: risk.response_strategy,
        contingencyPlan: risk.contingency_plan || '',
        owner: risk.owner || '',
        status: risk.status,
    })));
});

projectsRouter.post('/:id/risks', async (c) => {
    const orgId = c.get('orgId');
    const project = await getOrgProject(c.req.param('id'), orgId);
    if (!project) return c.json({ error: 'Not found' }, 404);

    const body = await c.req.json();
    const parsed = createProjectRiskSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);

    const [risk] = await db.insert(project_risks).values({
        org_id: orgId,
        project_id: project.id,
        description: parsed.data.description,
        category: parsed.data.category,
        probability: parsed.data.probability,
        impact: parsed.data.impact,
        response_strategy: parsed.data.responseStrategy,
        contingency_plan: parsed.data.contingencyPlan,
        owner: parsed.data.owner,
        status: parsed.data.status,
        custom_fields: {},
    }).returning();

    return c.json({
        id: risk.id,
        description: risk.description,
        category: risk.category,
        probability: risk.probability,
        impact: risk.impact,
        responseStrategy: risk.response_strategy,
        contingencyPlan: risk.contingency_plan || '',
        owner: risk.owner || '',
        status: risk.status,
    }, 201);
});

projectsRouter.patch('/:id/risks/:riskId', async (c) => {
    const orgId = c.get('orgId');
    const project = await getOrgProject(c.req.param('id'), orgId);
    if (!project) return c.json({ error: 'Not found' }, 404);

    const body = await c.req.json();
    const parsed = updateProjectRiskSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);

    const values: Record<string, unknown> = {};
    if (parsed.data.description !== undefined) values.description = parsed.data.description;
    if (parsed.data.category !== undefined) values.category = parsed.data.category;
    if (parsed.data.probability !== undefined) values.probability = parsed.data.probability;
    if (parsed.data.impact !== undefined) values.impact = parsed.data.impact;
    if (parsed.data.responseStrategy !== undefined) values.response_strategy = parsed.data.responseStrategy;
    if (parsed.data.contingencyPlan !== undefined) values.contingency_plan = parsed.data.contingencyPlan;
    if (parsed.data.owner !== undefined) values.owner = parsed.data.owner;
    if (parsed.data.status !== undefined) values.status = parsed.data.status;

    const [risk] = await db.update(project_risks).set(values)
        .where(and(eq(project_risks.id, c.req.param('riskId')), eq(project_risks.project_id, project.id), eq(project_risks.org_id, orgId)))
        .returning();
    if (!risk) return c.json({ error: 'Not found' }, 404);

    return c.json({
        id: risk.id,
        description: risk.description,
        category: risk.category,
        probability: risk.probability,
        impact: risk.impact,
        responseStrategy: risk.response_strategy,
        contingencyPlan: risk.contingency_plan || '',
        owner: risk.owner || '',
        status: risk.status,
    });
});

projectsRouter.delete('/:id/risks/:riskId', async (c) => {
    const orgId = c.get('orgId');
    const project = await getOrgProject(c.req.param('id'), orgId);
    if (!project) return c.json({ error: 'Not found' }, 404);

    const [deletedRisk] = await db.delete(project_risks)
        .where(and(eq(project_risks.id, c.req.param('riskId')), eq(project_risks.project_id, project.id), eq(project_risks.org_id, orgId)))
        .returning();
    if (!deletedRisk) return c.json({ error: 'Not found' }, 404);
    return c.json({ ok: true });
});

projectsRouter.get('/:id/expenses', async (c) => {
    const orgId = c.get('orgId');
    const project = await getOrgProject(c.req.param('id'), orgId);
    if (!project) return c.json({ error: 'Not found' }, 404);

    const rows = await db.select().from(project_expenses).where(and(eq(project_expenses.project_id, project.id), eq(project_expenses.org_id, orgId)));
    return c.json(rows.map((expense) => ({
        id: expense.id,
        date: expense.date,
        category: expense.category,
        description: expense.description,
        amount: asNumber(expense.amount),
        wbsId: '',
    })));
});

projectsRouter.post('/:id/expenses', async (c) => {
    const orgId = c.get('orgId');
    const project = await getOrgProject(c.req.param('id'), orgId);
    if (!project) return c.json({ error: 'Not found' }, 404);

    const body = await c.req.json();
    const parsed = createProjectExpenseSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);

    const [expense] = await db.insert(project_expenses).values({
        org_id: orgId,
        project_id: project.id,
        date: parsed.data.date,
        category: parsed.data.category,
        description: parsed.data.description,
        amount: String(parsed.data.amount),
        custom_fields: {},
    }).returning();

    const expenseRows = await db.select().from(project_expenses).where(and(eq(project_expenses.project_id, project.id), eq(project_expenses.org_id, orgId)));
    const spentTotal = expenseRows.reduce((sum, item) => sum + asNumber(item.amount), 0);
    await db.update(projects).set({ spent: String(spentTotal), updated_at: new Date() }).where(and(eq(projects.id, project.id), eq(projects.org_id, orgId)));

    return c.json({
        id: expense.id,
        date: expense.date,
        category: expense.category,
        description: expense.description,
        amount: asNumber(expense.amount),
        wbsId: '',
    }, 201);
});

projectsRouter.get('/:id/beneficiaries', async (c) => {
    const orgId = c.get('orgId');
    const project = await getOrgProject(c.req.param('id'), orgId);
    if (!project) return c.json({ error: 'Not found' }, 404);

    const rows = await db
        .select()
        .from(beneficiaries)
        .where(and(eq(beneficiaries.project_id, project.id), eq(beneficiaries.org_id, orgId)))
        .orderBy(desc(beneficiaries.created_at));

    return c.json(rows);
});

projectsRouter.get('/:id/budget-lines', async (c) => {
    const orgId = c.get('orgId');
    const project = await getOrgProject(c.req.param('id'), orgId);
    if (!project) return c.json({ error: 'Not found' }, 404);

    const rows = await db.select().from(project_budget_lines).where(and(eq(project_budget_lines.project_id, project.id), eq(project_budget_lines.org_id, orgId)));
    return c.json(rows.map((line) => ({
        id: line.id,
        category: line.category,
        planned: asNumber(line.planned),
        actual: asNumber(line.actual),
    })));
});

export { projectsRouter };
