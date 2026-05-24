import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { buildOptimisticProject } from '../lib/projectOptimistic';
import type { ExpenseLogItem, GanttTask, Project, Risk } from '../types';

export const PROJECTS_QUERY_KEY = ['projects'] as const;
const PROJECT_QUERY_KEY = (projectId: string) => ['project', projectId] as const;
const PROJECT_TASKS_QUERY_KEY = (projectId: string) => ['project', projectId, 'tasks'] as const;
const PROJECT_RISKS_QUERY_KEY = (projectId: string) => ['project', projectId, 'risks'] as const;
const PROJECT_EXPENSES_QUERY_KEY = (projectId: string) => ['project', projectId, 'expenses'] as const;

async function fetchProjects(): Promise<Project[]> {
    return api.get<Project[]>('/projects');
}

async function fetchProject(projectId: string): Promise<Project> {
    return api.get<Project>(`/projects/${projectId}`);
}

async function createProject(project: Omit<Project, 'id'>): Promise<Project> {
    return api.post<Project>('/projects', project);
}

async function updateProject(project: Project): Promise<Project> {
    return api.patch<Project>(`/projects/${project.id}`, project);
}

async function fetchProjectTasks(projectId: string): Promise<GanttTask[]> {
    return api.get<GanttTask[]>(`/projects/${projectId}/tasks`);
}

async function createProjectTask(projectId: string, task: Omit<GanttTask, 'id'>): Promise<GanttTask> {
    return api.post<GanttTask>(`/projects/${projectId}/tasks`, task);
}

async function updateProjectTask(projectId: string, task: GanttTask): Promise<GanttTask> {
    return api.patch<GanttTask>(`/projects/${projectId}/tasks/${task.id}`, task);
}

async function deleteProjectTask(projectId: string, taskId: string): Promise<void> {
    await api.delete<{ ok: true }>(`/projects/${projectId}/tasks/${taskId}`);
}

async function fetchProjectRisks(projectId: string): Promise<Risk[]> {
    return api.get<Risk[]>(`/projects/${projectId}/risks`);
}

async function createProjectRisk(projectId: string, risk: Omit<Risk, 'id'>): Promise<Risk> {
    return api.post<Risk>(`/projects/${projectId}/risks`, risk);
}

async function updateProjectRisk(projectId: string, risk: Risk): Promise<Risk> {
    return api.patch<Risk>(`/projects/${projectId}/risks/${risk.id}`, risk);
}

async function deleteProjectRisk(projectId: string, riskId: string): Promise<void> {
    await api.delete<{ ok: true }>(`/projects/${projectId}/risks/${riskId}`);
}

async function fetchProjectExpenses(projectId: string): Promise<ExpenseLogItem[]> {
    return api.get<ExpenseLogItem[]>(`/projects/${projectId}/expenses`);
}

export interface CreateProjectExpenseInput {
    date: string;
    description: string;
    category: string;
    amount: number;
}

async function createProjectExpense(projectId: string, expense: CreateProjectExpenseInput): Promise<ExpenseLogItem> {
    return api.post<ExpenseLogItem>(`/projects/${projectId}/expenses`, expense);
}

export const useProjects = () => useQuery({
    queryKey: PROJECTS_QUERY_KEY,
    queryFn: fetchProjects,
});

export const useProject = (projectId: string | null) => useQuery({
    queryKey: projectId ? PROJECT_QUERY_KEY(projectId) : ['project', 'none'],
    queryFn: () => fetchProject(projectId as string),
    enabled: !!projectId,
});

export const useCreateProject = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createProject,
        onMutate: async (input) => {
            await queryClient.cancelQueries({ queryKey: PROJECTS_QUERY_KEY });
            const previous = queryClient.getQueryData<Project[]>(PROJECTS_QUERY_KEY);
            const optimistic = buildOptimisticProject(input);
            queryClient.setQueryData<Project[]>(PROJECTS_QUERY_KEY, (old) => [optimistic, ...(old ?? [])]);
            return { previous, optimisticId: optimistic.id };
        },
        onSuccess: (created, _input, context) => {
            queryClient.setQueryData<Project[]>(PROJECTS_QUERY_KEY, (old) => {
                const list = old ?? [];
                return [created, ...list.filter((item) => item.id !== context?.optimisticId)];
            });
            queryClient.setQueryData(PROJECT_QUERY_KEY(created.id), created);
        },
        onError: (_error, _input, context) => {
            if (context?.previous) queryClient.setQueryData(PROJECTS_QUERY_KEY, context.previous);
        },
    });
};

export const useUpdateProject = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateProject,
        onMutate: async (input) => {
            await queryClient.cancelQueries({ queryKey: PROJECT_QUERY_KEY(input.id) });
            const previousDetail = queryClient.getQueryData<Project>(PROJECT_QUERY_KEY(input.id));
            const previousList = queryClient.getQueryData<Project[]>(PROJECTS_QUERY_KEY);
            queryClient.setQueryData(PROJECT_QUERY_KEY(input.id), input);
            queryClient.setQueryData<Project[]>(PROJECTS_QUERY_KEY, (old) =>
                (old ?? []).map((item) => (item.id === input.id ? input : item)),
            );
            return { previousDetail, previousList };
        },
        onSuccess: (updated) => {
            queryClient.setQueryData(PROJECT_QUERY_KEY(updated.id), updated);
            queryClient.setQueryData<Project[]>(PROJECTS_QUERY_KEY, (old) =>
                (old ?? []).map((item) => (item.id === updated.id ? updated : item)),
            );
        },
        onError: (_error, input, context) => {
            if (context?.previousDetail) queryClient.setQueryData(PROJECT_QUERY_KEY(input.id), context.previousDetail);
            if (context?.previousList) queryClient.setQueryData(PROJECTS_QUERY_KEY, context.previousList);
        },
    });
};

export const useProjectTasks = (projectId: string | null) => {
    const queryClient = useQueryClient();
    const query = useQuery({
        queryKey: projectId ? PROJECT_TASKS_QUERY_KEY(projectId) : ['project', 'none', 'tasks'],
        queryFn: () => fetchProjectTasks(projectId as string),
        enabled: !!projectId,
    });

    const createMutation = useMutation({
        mutationFn: (task: Omit<GanttTask, 'id'>) => createProjectTask(projectId as string, task),
        onSuccess: () => {
            if (!projectId) return;
            void queryClient.invalidateQueries({ queryKey: PROJECT_TASKS_QUERY_KEY(projectId) });
            void queryClient.invalidateQueries({ queryKey: PROJECT_QUERY_KEY(projectId) });
        },
    });

    const updateMutation = useMutation({
        mutationFn: (task: GanttTask) => updateProjectTask(projectId as string, task),
        onSuccess: () => {
            if (!projectId) return;
            void queryClient.invalidateQueries({ queryKey: PROJECT_TASKS_QUERY_KEY(projectId) });
            void queryClient.invalidateQueries({ queryKey: PROJECT_QUERY_KEY(projectId) });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (taskId: string) => deleteProjectTask(projectId as string, taskId),
        onSuccess: () => {
            if (!projectId) return;
            void queryClient.invalidateQueries({ queryKey: PROJECT_TASKS_QUERY_KEY(projectId) });
            void queryClient.invalidateQueries({ queryKey: PROJECT_QUERY_KEY(projectId) });
        },
    });

    return {
        ...query,
        createTask: createMutation.mutateAsync,
        updateTask: updateMutation.mutateAsync,
        deleteTask: deleteMutation.mutateAsync,
    };
};

export const useProjectRisks = (projectId: string | null) => {
    const queryClient = useQueryClient();
    const query = useQuery({
        queryKey: projectId ? PROJECT_RISKS_QUERY_KEY(projectId) : ['project', 'none', 'risks'],
        queryFn: () => fetchProjectRisks(projectId as string),
        enabled: !!projectId,
    });

    const createMutation = useMutation({
        mutationFn: (risk: Omit<Risk, 'id'>) => createProjectRisk(projectId as string, risk),
        onSuccess: () => {
            if (!projectId) return;
            void queryClient.invalidateQueries({ queryKey: PROJECT_RISKS_QUERY_KEY(projectId) });
            void queryClient.invalidateQueries({ queryKey: PROJECT_QUERY_KEY(projectId) });
        },
    });

    const updateMutation = useMutation({
        mutationFn: (risk: Risk) => updateProjectRisk(projectId as string, risk),
        onSuccess: () => {
            if (!projectId) return;
            void queryClient.invalidateQueries({ queryKey: PROJECT_RISKS_QUERY_KEY(projectId) });
            void queryClient.invalidateQueries({ queryKey: PROJECT_QUERY_KEY(projectId) });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (riskId: string) => deleteProjectRisk(projectId as string, riskId),
        onSuccess: () => {
            if (!projectId) return;
            void queryClient.invalidateQueries({ queryKey: PROJECT_RISKS_QUERY_KEY(projectId) });
            void queryClient.invalidateQueries({ queryKey: PROJECT_QUERY_KEY(projectId) });
        },
    });

    return {
        ...query,
        createRisk: createMutation.mutateAsync,
        updateRisk: updateMutation.mutateAsync,
        deleteRisk: deleteMutation.mutateAsync,
    };
};

export const useProjectExpenses = (projectId: string | null) => {
    const queryClient = useQueryClient();
    const query = useQuery({
        queryKey: projectId ? PROJECT_EXPENSES_QUERY_KEY(projectId) : ['project', 'none', 'expenses'],
        queryFn: () => fetchProjectExpenses(projectId as string),
        enabled: !!projectId,
    });

    const createMutation = useMutation({
        mutationFn: (expense: CreateProjectExpenseInput) => createProjectExpense(projectId as string, expense),
        onSuccess: () => {
            if (!projectId) return;
            void queryClient.invalidateQueries({ queryKey: PROJECT_EXPENSES_QUERY_KEY(projectId) });
            void queryClient.invalidateQueries({ queryKey: PROJECT_QUERY_KEY(projectId) });
            void queryClient.invalidateQueries({ queryKey: PROJECTS_QUERY_KEY });
        },
    });

    return {
        ...query,
        createExpense: createMutation.mutateAsync,
    };
};
