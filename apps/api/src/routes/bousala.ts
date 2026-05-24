import { Hono } from 'hono';
import { User } from '@supabase/supabase-js';
import { and, eq, inArray } from 'drizzle-orm';
import { db } from '../db';
import {
    bousala_goal_projects,
    bousala_goals,
    bousala_kpis,
    bousala_tasks,
    memberships,
    organizations,
    projects,
} from '../db/schema';
import { authMiddleware } from '../middleware/auth';
import {
    createBousalaGoalSchema,
    createBousalaKpiSchema,
    createBousalaTaskSchema,
    linkBousalaProjectsSchema,
    updateBousalaDirectionSchema,
    updateBousalaGoalProjectSchema,
    updateBousalaGoalSchema,
    updateBousalaKpiSchema,
    updateBousalaTaskSchema,
} from '@gms/shared';

type Variables = { user: User };

const bousalaRouter = new Hono<{ Variables: Variables }>();
bousalaRouter.use(authMiddleware);

async function getOrgId(userId: string, requestedOrgId?: string): Promise<string | null> {
    const where = requestedOrgId
        ? and(eq(memberships.user_id, userId), eq(memberships.org_id, requestedOrgId))
        : eq(memberships.user_id, userId);
    const rows = await db.select({ org_id: memberships.org_id }).from(memberships).where(where).limit(1);
    return rows[0]?.org_id ?? null;
}

function asNumber(value: unknown): number {
    if (value === null || value === undefined) return 0;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
}

function toIso(value: Date | string | null | undefined): string | null {
    if (!value) return null;
    return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

type KpiRow = typeof bousala_kpis.$inferSelect;
type GoalProjectRow = typeof bousala_goal_projects.$inferSelect;
type TaskRow = typeof bousala_tasks.$inferSelect;

function asCustomFields(value: unknown): Record<string, unknown> {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
        return value as Record<string, unknown>;
    }
    return {};
}

function mergeCustomFields(existing: unknown, patch: Record<string, unknown>): Record<string, unknown> {
    return { ...asCustomFields(existing), ...patch };
}

function readStringField(customFields: unknown, key: string): string | undefined {
    const value = asCustomFields(customFields)[key];
    return typeof value === 'string' && value.trim() ? value : undefined;
}

function mapDirection(customFields: unknown) {
    const direction = asCustomFields(asCustomFields(customFields).bousala).direction;
    const vision = readStringField(direction, 'vision') ?? '';
    const mission = readStringField(direction, 'mission') ?? '';
    const general = readStringField(direction, 'general') ?? '';
    if (!vision && !mission && !general) return undefined;
    return { vision, mission, general };
}

function mapKpi(row: KpiRow) {
    const description = readStringField(row.custom_fields, 'description');
    return {
        id: row.id,
        title: row.title,
        value: asNumber(row.value),
        target: asNumber(row.target),
        unit: row.unit || '',
        trend: (row.trend as 'up' | 'down' | 'stable') || 'stable',
        lastUpdated: toIso(row.last_updated) || new Date().toISOString(),
        prediction: row.prediction ?? undefined,
        ...(description ? { description } : {}),
    };
}

function mapGoalProject(row: GoalProjectRow, taskIds: string[]) {
    const status = readStringField(row.custom_fields, 'status');
    return {
        id: row.id,
        title: row.title,
        description: row.description || '',
        progress: row.progress ?? 0,
        linkedGoal: row.goal_id,
        linkedTasks: taskIds,
        sourceProjectId: row.source_project_id ?? undefined,
        ...(status ? { status } : {}),
    };
}

function mapTask(row: TaskRow) {
    return {
        id: row.id,
        title: row.title,
        description: row.description || '',
        status: (row.status as 'in-progress' | 'completed') || 'in-progress',
        linkedProject: row.goal_project_id,
        assignee: row.assignee || '',
        dueDate: row.due_date ?? undefined,
        priority: (row.priority as 'high' | 'medium' | 'low' | null) ?? undefined,
    };
}

async function fetchBousalaTree(orgId: string) {
    const [goalRows, kpiRows, projectRows, taskRows, orgRows] = await Promise.all([
        db.select().from(bousala_goals).where(eq(bousala_goals.org_id, orgId)),
        db.select().from(bousala_kpis).where(eq(bousala_kpis.org_id, orgId)),
        db.select().from(bousala_goal_projects).where(eq(bousala_goal_projects.org_id, orgId)),
        db.select().from(bousala_tasks).where(eq(bousala_tasks.org_id, orgId)),
        db.select({ custom_fields: organizations.custom_fields }).from(organizations).where(eq(organizations.id, orgId)).limit(1),
    ]);

    const sourceProjectIds = projectRows
        .map((row) => row.source_project_id)
        .filter((id): id is string => !!id);

    const sourceProjects = sourceProjectIds.length > 0
        ? await db
            .select({ id: projects.id, progress: projects.progress })
            .from(projects)
            .where(and(eq(projects.org_id, orgId), inArray(projects.id, sourceProjectIds)))
        : [];

    const sourceProgressById = new Map(sourceProjects.map((row) => [row.id, row.progress ?? 0]));

    const tasksByProjectId = new Map<string, string[]>();
    for (const task of taskRows) {
        const list = tasksByProjectId.get(task.goal_project_id) ?? [];
        list.push(task.id);
        tasksByProjectId.set(task.goal_project_id, list);
    }

    const projectsByGoalId = new Map<string, typeof projectRows>();
    for (const project of projectRows) {
        const list = projectsByGoalId.get(project.goal_id) ?? [];
        list.push(project);
        projectsByGoalId.set(project.goal_id, list);
    }

    const kpisByGoalId = new Map<string, KpiRow[]>();
    for (const kpi of kpiRows) {
        const list = kpisByGoalId.get(kpi.goal_id) ?? [];
        list.push(kpi);
        kpisByGoalId.set(kpi.goal_id, list);
    }

    const mappedProjects = projectRows.map((row) => {
        const progress = row.source_project_id
            ? (sourceProgressById.get(row.source_project_id) ?? row.progress ?? 0)
            : (row.progress ?? 0);
        return mapGoalProject({ ...row, progress }, tasksByProjectId.get(row.id) ?? []);
    });

    const mappedGoals = goalRows.map((goal) => {
        const linked = mappedProjects.filter((project) => project.linkedGoal === goal.id);
        const linkedProjectIds = linked.map((project) => project.id);
        const computedProgress = linked.length > 0
            ? Math.round(linked.reduce((sum, project) => sum + project.progress, 0) / linked.length)
            : (goal.progress ?? 0);

        return {
            id: goal.id,
            title: goal.title,
            description: goal.description || '',
            progress: computedProgress,
            linkedProjects: linkedProjectIds,
            responsiblePerson: goal.responsible_person || '',
            deadline: goal.deadline ?? undefined,
            kpis: (kpisByGoalId.get(goal.id) ?? []).map(mapKpi),
            prediction: goal.prediction ?? undefined,
            ...(readStringField(goal.custom_fields, 'status') ? { status: readStringField(goal.custom_fields, 'status') } : {}),
        };
    });

    const direction = orgRows[0] ? mapDirection(orgRows[0].custom_fields) : undefined;

    return {
        goals: mappedGoals,
        projects: mappedProjects,
        tasks: taskRows.map(mapTask),
        ...(direction ? { direction } : {}),
    };
}

async function recalculateGoalProgress(orgId: string, goalId: string) {
    const linked = await db
        .select()
        .from(bousala_goal_projects)
        .where(and(eq(bousala_goal_projects.org_id, orgId), eq(bousala_goal_projects.goal_id, goalId)));

    if (linked.length === 0) return;

    const sourceIds = linked.map((row) => row.source_project_id).filter((id): id is string => !!id);
    const sourceProgress = sourceIds.length > 0
        ? await db
            .select({ id: projects.id, progress: projects.progress })
            .from(projects)
            .where(and(eq(projects.org_id, orgId), inArray(projects.id, sourceIds)))
        : [];
    const sourceProgressById = new Map(sourceProgress.map((row) => [row.id, row.progress ?? 0]));

    const progressValues = linked.map((row) =>
        row.source_project_id ? (sourceProgressById.get(row.source_project_id) ?? row.progress ?? 0) : (row.progress ?? 0),
    );
    const progress = Math.round(progressValues.reduce((sum, value) => sum + value, 0) / progressValues.length);

    await db
        .update(bousala_goals)
        .set({ progress, updated_at: new Date() })
        .where(and(eq(bousala_goals.org_id, orgId), eq(bousala_goals.id, goalId)));
}

bousalaRouter.get('/', async (c) => {
    const user = c.get('user');
    const orgId = await getOrgId(user.id);
    if (!orgId) return c.json({ error: 'No organization membership found' }, 403);
    return c.json(await fetchBousalaTree(orgId));
});

bousalaRouter.get('/goals', async (c) => {
    const user = c.get('user');
    const orgId = await getOrgId(user.id);
    if (!orgId) return c.json({ error: 'No organization membership found' }, 403);
    const tree = await fetchBousalaTree(orgId);
    return c.json(tree.goals);
});

bousalaRouter.get('/goals/:id', async (c) => {
    const user = c.get('user');
    const orgId = await getOrgId(user.id);
    if (!orgId) return c.json({ error: 'No organization membership found' }, 403);
    const goalId = c.req.param('id');
    const tree = await fetchBousalaTree(orgId);
    const goal = tree.goals.find((row) => row.id === goalId);
    if (!goal) return c.json({ error: 'Goal not found' }, 404);
    return c.json(goal);
});

bousalaRouter.post('/goals', async (c) => {
    const user = c.get('user');
    const orgId = await getOrgId(user.id);
    if (!orgId) return c.json({ error: 'No organization membership found' }, 403);

    const body = createBousalaGoalSchema.parse(await c.req.json());
    const [inserted] = await db
        .insert(bousala_goals)
        .values({
            org_id: orgId,
            title: body.title.trim(),
            description: body.description?.trim() || '',
            responsible_person: body.responsible_person?.trim() || '',
            deadline: body.deadline ?? null,
            progress: body.progress ?? 0,
            custom_fields: mergeCustomFields(body.custom_fields ?? {}, {
                ...(body.status?.trim() ? { status: body.status.trim() } : {}),
            }),
        })
        .returning();

    const tree = await fetchBousalaTree(orgId);
    const goal = tree.goals.find((row) => row.id === inserted.id);
    return c.json(goal, 201);
});

bousalaRouter.patch('/goals/:id', async (c) => {
    const user = c.get('user');
    const orgId = await getOrgId(user.id);
    if (!orgId) return c.json({ error: 'No organization membership found' }, 403);

    const goalId = c.req.param('id');
    const body = updateBousalaGoalSchema.parse(await c.req.json());

    const [existing] = await db
        .select()
        .from(bousala_goals)
        .where(and(eq(bousala_goals.org_id, orgId), eq(bousala_goals.id, goalId)))
        .limit(1);
    if (!existing) return c.json({ error: 'Goal not found' }, 404);

    const { status, custom_fields: bodyCustomFields, ...goalFields } = body;
    const nextCustomFields = mergeCustomFields(existing.custom_fields, {
        ...(bodyCustomFields ?? {}),
        ...(status !== undefined ? { status: status.trim() } : {}),
    });

    await db
        .update(bousala_goals)
        .set({
            ...(goalFields.title !== undefined ? { title: goalFields.title.trim() } : {}),
            ...(goalFields.description !== undefined ? { description: goalFields.description.trim() } : {}),
            ...(goalFields.responsible_person !== undefined ? { responsible_person: goalFields.responsible_person } : {}),
            ...(goalFields.deadline !== undefined ? { deadline: goalFields.deadline } : {}),
            ...(goalFields.progress !== undefined ? { progress: goalFields.progress } : {}),
            ...(status !== undefined || bodyCustomFields !== undefined ? { custom_fields: nextCustomFields } : {}),
            updated_at: new Date(),
        })
        .where(and(eq(bousala_goals.org_id, orgId), eq(bousala_goals.id, goalId)));

    const tree = await fetchBousalaTree(orgId);
    const goal = tree.goals.find((row) => row.id === goalId);
    return c.json(goal);
});

bousalaRouter.delete('/goals/:id', async (c) => {
    const user = c.get('user');
    const orgId = await getOrgId(user.id);
    if (!orgId) return c.json({ error: 'No organization membership found' }, 403);

    const goalId = c.req.param('id');
    const [existing] = await db
        .select({ id: bousala_goals.id })
        .from(bousala_goals)
        .where(and(eq(bousala_goals.org_id, orgId), eq(bousala_goals.id, goalId)))
        .limit(1);
    if (!existing) return c.json({ error: 'Goal not found' }, 404);

    await db.delete(bousala_goals).where(and(eq(bousala_goals.org_id, orgId), eq(bousala_goals.id, goalId)));
    return c.json({ ok: true });
});

bousalaRouter.post('/goals/:goalId/kpis', async (c) => {
    const user = c.get('user');
    const orgId = await getOrgId(user.id);
    if (!orgId) return c.json({ error: 'No organization membership found' }, 403);

    const goalId = c.req.param('goalId');
    const body = createBousalaKpiSchema.parse(await c.req.json());

    const [goal] = await db
        .select({ id: bousala_goals.id })
        .from(bousala_goals)
        .where(and(eq(bousala_goals.org_id, orgId), eq(bousala_goals.id, goalId)))
        .limit(1);
    if (!goal) return c.json({ error: 'Goal not found' }, 404);

    const [inserted] = await db
        .insert(bousala_kpis)
        .values({
            org_id: orgId,
            goal_id: goalId,
            title: body.title.trim(),
            value: String(body.value ?? 0),
            target: String(body.target ?? 0),
            unit: body.unit?.trim() || '',
            trend: body.trend ?? 'stable',
            last_updated: new Date(),
            custom_fields: mergeCustomFields(body.custom_fields ?? {}, {
                ...(body.kpi_description?.trim() ? { description: body.kpi_description.trim() } : {}),
            }),
        })
        .returning();

    const tree = await fetchBousalaTree(orgId);
    const updatedGoal = tree.goals.find((row) => row.id === goalId);
    const kpi = updatedGoal?.kpis?.find((row) => row.id === inserted.id);
    return c.json(kpi, 201);
});

bousalaRouter.patch('/kpis/:id', async (c) => {
    const user = c.get('user');
    const orgId = await getOrgId(user.id);
    if (!orgId) return c.json({ error: 'No organization membership found' }, 403);

    const kpiId = c.req.param('id');
    const body = updateBousalaKpiSchema.parse(await c.req.json());

    const [existing] = await db
        .select()
        .from(bousala_kpis)
        .where(and(eq(bousala_kpis.org_id, orgId), eq(bousala_kpis.id, kpiId)))
        .limit(1);
    if (!existing) return c.json({ error: 'KPI not found' }, 404);

    const { kpi_description, custom_fields: bodyCustomFields, ...kpiFields } = body;
    const nextCustomFields = mergeCustomFields(existing.custom_fields, {
        ...(bodyCustomFields ?? {}),
        ...(kpi_description !== undefined ? { description: kpi_description.trim() } : {}),
    });

    await db
        .update(bousala_kpis)
        .set({
            ...(kpiFields.title !== undefined ? { title: kpiFields.title.trim() } : {}),
            ...(kpiFields.value !== undefined ? { value: String(kpiFields.value) } : {}),
            ...(kpiFields.target !== undefined ? { target: String(kpiFields.target) } : {}),
            ...(kpiFields.unit !== undefined ? { unit: kpiFields.unit.trim() } : {}),
            ...(kpiFields.trend !== undefined ? { trend: kpiFields.trend } : {}),
            ...(kpi_description !== undefined || bodyCustomFields !== undefined ? { custom_fields: nextCustomFields } : {}),
            last_updated: new Date(),
            prediction: null,
            updated_at: new Date(),
        })
        .where(and(eq(bousala_kpis.org_id, orgId), eq(bousala_kpis.id, kpiId)));

    const tree = await fetchBousalaTree(orgId);
    const goal = tree.goals.find((row) => row.id === existing.goal_id);
    const kpi = goal?.kpis?.find((row) => row.id === kpiId);
    return c.json(kpi);
});

bousalaRouter.delete('/kpis/:id', async (c) => {
    const user = c.get('user');
    const orgId = await getOrgId(user.id);
    if (!orgId) return c.json({ error: 'No organization membership found' }, 403);

    const kpiId = c.req.param('id');
    const [existing] = await db
        .select({ id: bousala_kpis.id })
        .from(bousala_kpis)
        .where(and(eq(bousala_kpis.org_id, orgId), eq(bousala_kpis.id, kpiId)))
        .limit(1);
    if (!existing) return c.json({ error: 'KPI not found' }, 404);

    await db.delete(bousala_kpis).where(and(eq(bousala_kpis.org_id, orgId), eq(bousala_kpis.id, kpiId)));
    return c.json({ ok: true });
});

bousalaRouter.post('/goals/:goalId/projects', async (c) => {
    const user = c.get('user');
    const orgId = await getOrgId(user.id);
    if (!orgId) return c.json({ error: 'No organization membership found' }, 403);

    const goalId = c.req.param('goalId');
    const body = linkBousalaProjectsSchema.parse(await c.req.json());

    const [goal] = await db
        .select({ id: bousala_goals.id })
        .from(bousala_goals)
        .where(and(eq(bousala_goals.org_id, orgId), eq(bousala_goals.id, goalId)))
        .limit(1);
    if (!goal) return c.json({ error: 'Goal not found' }, 404);

    const existingLinks = await db
        .select({ source_project_id: bousala_goal_projects.source_project_id })
        .from(bousala_goal_projects)
        .where(and(eq(bousala_goal_projects.org_id, orgId), eq(bousala_goal_projects.goal_id, goalId)));

    const linkedSourceIds = new Set(
        existingLinks.map((row) => row.source_project_id).filter((id): id is string => !!id),
    );

    const projectRows = await db
        .select()
        .from(projects)
        .where(and(eq(projects.org_id, orgId), inArray(projects.id, body.projectIds)));

    for (const project of projectRows) {
        if (linkedSourceIds.has(project.id)) continue;
        await db.insert(bousala_goal_projects).values({
            org_id: orgId,
            goal_id: goalId,
            source_project_id: project.id,
            title: project.name_en,
            description: project.goal || '',
            progress: project.progress ?? 0,
            custom_fields: {},
        });
    }

    await recalculateGoalProgress(orgId, goalId);
    const tree = await fetchBousalaTree(orgId);
    return c.json(tree);
});

bousalaRouter.patch('/goal-projects/:id', async (c) => {
    const user = c.get('user');
    const orgId = await getOrgId(user.id);
    if (!orgId) return c.json({ error: 'No organization membership found' }, 403);

    const projectId = c.req.param('id');
    const body = updateBousalaGoalProjectSchema.parse(await c.req.json());

    const [existing] = await db
        .select()
        .from(bousala_goal_projects)
        .where(and(eq(bousala_goal_projects.org_id, orgId), eq(bousala_goal_projects.id, projectId)))
        .limit(1);
    if (!existing) return c.json({ error: 'Goal project not found' }, 404);

    const { status, custom_fields: bodyCustomFields, ...projectFields } = body;
    const nextCustomFields = mergeCustomFields(existing.custom_fields, {
        ...(bodyCustomFields ?? {}),
        ...(status !== undefined ? { status: status.trim() } : {}),
    });

    await db
        .update(bousala_goal_projects)
        .set({
            ...(projectFields.title !== undefined ? { title: projectFields.title.trim() } : {}),
            ...(projectFields.description !== undefined ? { description: projectFields.description.trim() } : {}),
            ...(status !== undefined || bodyCustomFields !== undefined ? { custom_fields: nextCustomFields } : {}),
            updated_at: new Date(),
        })
        .where(and(eq(bousala_goal_projects.org_id, orgId), eq(bousala_goal_projects.id, projectId)));

    const tree = await fetchBousalaTree(orgId);
    const project = tree.projects.find((row) => row.id === projectId);
    return c.json(project);
});

bousalaRouter.delete('/goal-projects/:id', async (c) => {
    const user = c.get('user');
    const orgId = await getOrgId(user.id);
    if (!orgId) return c.json({ error: 'No organization membership found' }, 403);

    const projectId = c.req.param('id');
    const [existing] = await db
        .select({ id: bousala_goal_projects.id, goal_id: bousala_goal_projects.goal_id })
        .from(bousala_goal_projects)
        .where(and(eq(bousala_goal_projects.org_id, orgId), eq(bousala_goal_projects.id, projectId)))
        .limit(1);
    if (!existing) return c.json({ error: 'Goal project not found' }, 404);

    await db
        .delete(bousala_goal_projects)
        .where(and(eq(bousala_goal_projects.org_id, orgId), eq(bousala_goal_projects.id, projectId)));

    await recalculateGoalProgress(orgId, existing.goal_id);
    return c.json({ ok: true });
});

bousalaRouter.post('/tasks', async (c) => {
    const user = c.get('user');
    const orgId = await getOrgId(user.id);
    if (!orgId) return c.json({ error: 'No organization membership found' }, 403);

    const body = createBousalaTaskSchema.parse(await c.req.json());

    const [goalProject] = await db
        .select({ id: bousala_goal_projects.id })
        .from(bousala_goal_projects)
        .where(and(eq(bousala_goal_projects.org_id, orgId), eq(bousala_goal_projects.id, body.goal_project_id)))
        .limit(1);
    if (!goalProject) return c.json({ error: 'Goal project not found' }, 404);

    const [inserted] = await db
        .insert(bousala_tasks)
        .values({
            org_id: orgId,
            goal_project_id: body.goal_project_id,
            title: body.title.trim(),
            description: body.description?.trim() || '',
            status: body.status ?? 'in-progress',
            assignee: body.assignee?.trim() || '',
            due_date: body.due_date ?? null,
            priority: body.priority ?? null,
            custom_fields: body.custom_fields ?? {},
        })
        .returning();

    const tree = await fetchBousalaTree(orgId);
    const task = tree.tasks.find((row) => row.id === inserted.id);
    return c.json(task, 201);
});

bousalaRouter.patch('/tasks/:id', async (c) => {
    const user = c.get('user');
    const orgId = await getOrgId(user.id);
    if (!orgId) return c.json({ error: 'No organization membership found' }, 403);

    const taskId = c.req.param('id');
    const body = updateBousalaTaskSchema.parse(await c.req.json());

    const [existing] = await db
        .select({ id: bousala_tasks.id })
        .from(bousala_tasks)
        .where(and(eq(bousala_tasks.org_id, orgId), eq(bousala_tasks.id, taskId)))
        .limit(1);
    if (!existing) return c.json({ error: 'Task not found' }, 404);

    await db
        .update(bousala_tasks)
        .set({
            ...(body.title !== undefined ? { title: body.title.trim() } : {}),
            ...(body.description !== undefined ? { description: body.description.trim() } : {}),
            ...(body.status !== undefined ? { status: body.status } : {}),
            ...(body.assignee !== undefined ? { assignee: body.assignee } : {}),
            ...(body.due_date !== undefined ? { due_date: body.due_date } : {}),
            ...(body.priority !== undefined ? { priority: body.priority } : {}),
            ...(body.custom_fields !== undefined ? { custom_fields: body.custom_fields } : {}),
            updated_at: new Date(),
        })
        .where(and(eq(bousala_tasks.org_id, orgId), eq(bousala_tasks.id, taskId)));

    const tree = await fetchBousalaTree(orgId);
    const task = tree.tasks.find((row) => row.id === taskId);
    return c.json(task);
});

bousalaRouter.delete('/tasks/:id', async (c) => {
    const user = c.get('user');
    const orgId = await getOrgId(user.id);
    if (!orgId) return c.json({ error: 'No organization membership found' }, 403);

    const taskId = c.req.param('id');
    const [existing] = await db
        .select({ id: bousala_tasks.id })
        .from(bousala_tasks)
        .where(and(eq(bousala_tasks.org_id, orgId), eq(bousala_tasks.id, taskId)))
        .limit(1);
    if (!existing) return c.json({ error: 'Task not found' }, 404);

    await db.delete(bousala_tasks).where(and(eq(bousala_tasks.org_id, orgId), eq(bousala_tasks.id, taskId)));
    return c.json({ ok: true });
});

bousalaRouter.patch('/direction', async (c) => {
    const user = c.get('user');
    const orgId = await getOrgId(user.id);
    if (!orgId) return c.json({ error: 'No organization membership found' }, 403);

    const body = updateBousalaDirectionSchema.parse(await c.req.json());

    const [existing] = await db
        .select({ custom_fields: organizations.custom_fields })
        .from(organizations)
        .where(eq(organizations.id, orgId))
        .limit(1);
    if (!existing) return c.json({ error: 'Organization not found' }, 404);

    const currentBousala = asCustomFields(asCustomFields(existing.custom_fields).bousala);
    const currentDirection = asCustomFields(currentBousala.direction);

    const nextDirection = {
        vision: body.vision !== undefined ? body.vision.trim() : (readStringField(currentDirection, 'vision') ?? ''),
        mission: body.mission !== undefined ? body.mission.trim() : (readStringField(currentDirection, 'mission') ?? ''),
        general: body.general !== undefined ? body.general.trim() : (readStringField(currentDirection, 'general') ?? ''),
    };

    const nextCustomFields = mergeCustomFields(existing.custom_fields, {
        bousala: {
            ...currentBousala,
            direction: nextDirection,
        },
    });

    await db
        .update(organizations)
        .set({ custom_fields: nextCustomFields })
        .where(eq(organizations.id, orgId));

    const tree = await fetchBousalaTree(orgId);
    return c.json(tree.direction ?? nextDirection);
});

export { bousalaRouter };
