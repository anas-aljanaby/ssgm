import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import type { BousalaGoal, BousalaKpi, BousalaProject, BousalaTask, BousalaDirection } from '../types';
import type { BousalaDemoState } from '../lib/bousalaDemoData';
import { api } from '../lib/api';

export const BOUSALA_QUERY_KEY = ['bousala'] as const;

export type BousalaTree = BousalaDemoState & { direction?: BousalaDirection };

export async function fetchBousalaTree(): Promise<BousalaTree> {
    return api.get<BousalaTree>('/bousala');
}

export function invalidateBousalaQueries(queryClient: QueryClient) {
    void queryClient.invalidateQueries({ queryKey: BOUSALA_QUERY_KEY });
}

export const useBousala = () => useQuery({
    queryKey: BOUSALA_QUERY_KEY,
    queryFn: fetchBousalaTree,
});

export interface CreateBousalaGoalInput {
    title: string;
    description: string;
    responsiblePerson: string;
    progress?: number;
    deadline?: string;
    status?: string;
}

export async function createBousalaGoalApi(input: CreateBousalaGoalInput): Promise<BousalaGoal> {
    return api.post<BousalaGoal>('/bousala/goals', {
        title: input.title,
        description: input.description,
        responsible_person: input.responsiblePerson,
        progress: input.progress ?? 0,
        deadline: input.deadline ?? null,
        ...(input.status ? { status: input.status } : {}),
    });
}

export async function updateBousalaGoalApi(
    goalId: string,
    input: { title: string; description: string; responsiblePerson: string; status?: string },
): Promise<BousalaGoal> {
    return api.patch<BousalaGoal>(`/bousala/goals/${goalId}`, {
        title: input.title,
        description: input.description,
        responsible_person: input.responsiblePerson,
        ...(input.status !== undefined ? { status: input.status } : {}),
    });
}

export async function deleteBousalaGoalApi(goalId: string): Promise<void> {
    await api.delete<{ ok: true }>(`/bousala/goals/${goalId}`);
}

export interface CreateBousalaKpiInput {
    goalId: string;
    title: string;
    value: number;
    target: number;
    unit: string;
}

export async function createBousalaKpiApi(input: CreateBousalaKpiInput): Promise<BousalaKpi> {
    return api.post<BousalaKpi>(`/bousala/goals/${input.goalId}/kpis`, {
        title: input.title,
        value: input.value,
        target: input.target,
        unit: input.unit,
        trend: 'stable',
    });
}

export async function updateBousalaKpiApi(
    kpiId: string,
    input: { title: string; value: number; target: number; unit: string; kpiDescription?: string },
): Promise<BousalaKpi> {
    return api.patch<BousalaKpi>(`/bousala/kpis/${kpiId}`, {
        title: input.title,
        value: input.value,
        target: input.target,
        unit: input.unit,
        ...(input.kpiDescription !== undefined ? { kpi_description: input.kpiDescription } : {}),
    });
}

export async function deleteBousalaKpiApi(kpiId: string): Promise<void> {
    await api.delete<{ ok: true }>(`/bousala/kpis/${kpiId}`);
}

export async function linkBousalaProjectsApi(goalId: string, projectIds: string[]): Promise<BousalaTree> {
    return api.post<BousalaTree>(`/bousala/goals/${goalId}/projects`, { projectIds });
}

export async function updateBousalaGoalProjectApi(
    projectId: string,
    input: { title: string; description: string; status?: string },
): Promise<BousalaProject> {
    return api.patch<BousalaProject>(`/bousala/goal-projects/${projectId}`, {
        title: input.title,
        description: input.description,
        ...(input.status !== undefined ? { status: input.status } : {}),
    });
}

export async function updateBousalaDirectionApi(input: Partial<BousalaDirection>): Promise<BousalaDirection> {
    return api.patch<BousalaDirection>('/bousala/direction', input);
}

export async function unlinkBousalaGoalProjectApi(projectId: string): Promise<void> {
    await api.delete<{ ok: true }>(`/bousala/goal-projects/${projectId}`);
}

export interface CreateBousalaTaskInput {
    goalProjectId: string;
    title: string;
    description?: string;
    assignee?: string;
    dueDate?: string;
    priority?: 'high' | 'medium' | 'low';
}

export async function createBousalaTaskApi(input: CreateBousalaTaskInput): Promise<BousalaTask> {
    return api.post<BousalaTask>('/bousala/tasks', {
        goal_project_id: input.goalProjectId,
        title: input.title,
        description: input.description ?? '',
        assignee: input.assignee ?? '',
        due_date: input.dueDate ?? null,
        priority: input.priority,
        status: 'in-progress',
    });
}

export type TaskUpdatePatch = Partial<Pick<BousalaTask, 'status' | 'assignee' | 'dueDate' | 'priority'>>;

export async function updateBousalaTaskApi(taskId: string, patch: TaskUpdatePatch): Promise<BousalaTask> {
    return api.patch<BousalaTask>(`/bousala/tasks/${taskId}`, {
        ...(patch.status !== undefined ? { status: patch.status } : {}),
        ...(patch.assignee !== undefined ? { assignee: patch.assignee } : {}),
        ...(patch.dueDate !== undefined ? { due_date: patch.dueDate } : {}),
        ...(patch.priority !== undefined ? { priority: patch.priority } : {}),
    });
}

export async function deleteBousalaTaskApi(taskId: string): Promise<void> {
    await api.delete<{ ok: true }>(`/bousala/tasks/${taskId}`);
}

export const useCreateBousalaGoal = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createBousalaGoalApi,
        onSuccess: () => invalidateBousalaQueries(queryClient),
    });
};

export const useUpdateBousalaGoal = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (vars: { goalId: string; data: { title: string; description: string; responsiblePerson: string; status?: string } }) =>
            updateBousalaGoalApi(vars.goalId, vars.data),
        onSuccess: () => invalidateBousalaQueries(queryClient),
    });
};

export const useDeleteBousalaGoal = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteBousalaGoalApi,
        onSuccess: () => invalidateBousalaQueries(queryClient),
    });
};

export const useCreateBousalaKpi = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createBousalaKpiApi,
        onSuccess: () => invalidateBousalaQueries(queryClient),
    });
};

export const useUpdateBousalaKpi = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (vars: { kpiId: string; data: { title: string; value: number; target: number; unit: string; kpiDescription?: string } }) =>
            updateBousalaKpiApi(vars.kpiId, vars.data),
        onSuccess: () => invalidateBousalaQueries(queryClient),
    });
};

export const useDeleteBousalaKpi = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteBousalaKpiApi,
        onSuccess: () => invalidateBousalaQueries(queryClient),
    });
};

export const useLinkBousalaProjects = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (vars: { goalId: string; projectIds: string[] }) =>
            linkBousalaProjectsApi(vars.goalId, vars.projectIds),
        onSuccess: (tree) => {
            queryClient.setQueryData(BOUSALA_QUERY_KEY, tree);
        },
    });
};

export const useUpdateBousalaGoalProject = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (vars: { projectId: string; data: { title: string; description: string; status?: string } }) =>
            updateBousalaGoalProjectApi(vars.projectId, vars.data),
        onSuccess: () => invalidateBousalaQueries(queryClient),
    });
};

export const useUnlinkBousalaGoalProject = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: unlinkBousalaGoalProjectApi,
        onSuccess: () => invalidateBousalaQueries(queryClient),
    });
};

export const useCreateBousalaTask = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createBousalaTaskApi,
        onSuccess: () => invalidateBousalaQueries(queryClient),
    });
};

export const useUpdateBousalaTask = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (vars: { taskId: string; patch: TaskUpdatePatch }) =>
            updateBousalaTaskApi(vars.taskId, vars.patch),
        onSuccess: () => invalidateBousalaQueries(queryClient),
    });
};

export const useDeleteBousalaTask = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteBousalaTaskApi,
        onSuccess: () => invalidateBousalaQueries(queryClient),
    });
};

export const useUpdateBousalaDirection = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateBousalaDirectionApi,
        onSuccess: (direction) => {
            queryClient.setQueryData<BousalaTree | undefined>(BOUSALA_QUERY_KEY, (old) =>
                old ? { ...old, direction } : old,
            );
            void queryClient.invalidateQueries({ queryKey: BOUSALA_QUERY_KEY });
        },
    });
};
