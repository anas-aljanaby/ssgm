import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { MOCK_BUDGETS } from '../data/financialsPageData';
import type { ProjectBudget } from '../types/financials';
import { createOptimisticId, isOptimisticId } from '../lib/optimisticSubmit';

const QUERY_KEY = ['financial-budgets'] as const;
const USE_API = true;
export const OPTIMISTIC_BUDGET_PREFIX = 'optimistic-budget-';

export function isOptimisticBudget(id: string): boolean {
  return isOptimisticId(id, OPTIMISTIC_BUDGET_PREFIX);
}

async function fetchBudgets(): Promise<ProjectBudget[]> {
  if (!USE_API) return MOCK_BUDGETS;

  try {
    return await api.get<ProjectBudget[]>('/financials/budgets');
  } catch {
    return MOCK_BUDGETS;
  }
}

export function useBudgets() {
  const { user, session, loading: authLoading } = useAuth();
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchBudgets,
    enabled: !authLoading && !!user && !!session?.access_token,
  });
}

export interface CreateBudgetInput {
  projectNameEn: string;
  projectNameAr?: string;
  fiscalYear: string;
  totalPlanned: number;
  currency: string;
  status?: ProjectBudget['status'];
}

function buildOptimisticBudget(input: CreateBudgetInput): ProjectBudget {
  return {
    id: createOptimisticId(OPTIMISTIC_BUDGET_PREFIX),
    projectId: `PROJ-LOCAL-${Date.now()}`,
    projectName: {
      en: input.projectNameEn,
      ar: input.projectNameAr || input.projectNameEn,
    },
    fiscalYear: input.fiscalYear,
    totalPlanned: input.totalPlanned,
    totalActual: 0,
    totalCommitted: 0,
    currency: input.currency,
    status: input.status || 'draft',
    lines: [],
    lastUpdated: new Date().toISOString(),
  };
}

async function createBudget(input: CreateBudgetInput): Promise<ProjectBudget> {
  const applyLocalCreate = (): ProjectBudget => {
    const created: ProjectBudget = {
      id: `BDG-LOCAL-${Date.now()}`,
      projectId: `PROJ-LOCAL-${Date.now()}`,
      projectName: {
        en: input.projectNameEn,
        ar: input.projectNameAr || input.projectNameEn,
      },
      fiscalYear: input.fiscalYear,
      totalPlanned: input.totalPlanned,
      totalActual: 0,
      totalCommitted: 0,
      currency: input.currency,
      status: input.status || 'draft',
      lines: [],
      lastUpdated: new Date().toISOString(),
    };
    MOCK_BUDGETS.unshift(created);
    return created;
  };

  if (!USE_API) return applyLocalCreate();

  try {
    return await api.post<ProjectBudget>('/financials/budgets', {
      project_id: `project-${Date.now()}`,
      project_name_en: input.projectNameEn,
      project_name_ar: input.projectNameAr || '',
      fiscal_year: input.fiscalYear,
      total_planned: input.totalPlanned,
      total_actual: 0,
      total_committed: 0,
      currency: input.currency,
      status: input.status || 'draft',
      custom_fields: {},
    });
  } catch {
    return applyLocalCreate();
  }
}

type CreateBudgetContext = {
  previous?: ProjectBudget[];
  optimisticId: string;
};

export function useCreateBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createBudget,
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const previous = queryClient.getQueryData<ProjectBudget[]>(QUERY_KEY);
      const optimistic = buildOptimisticBudget(variables);
      queryClient.setQueryData<ProjectBudget[]>(QUERY_KEY, (old) => [optimistic, ...(old ?? [])]);
      return { previous, optimisticId: optimistic.id } satisfies CreateBudgetContext;
    },
    onSuccess: (created, _variables, context) => {
      queryClient.setQueryData<ProjectBudget[]>(QUERY_KEY, (old) => {
        if (!old) return [created];
        const optimisticId = context?.optimisticId;
        const hasOptimistic = optimisticId && old.some((b) => b.id === optimisticId);
        if (hasOptimistic) {
          return old.map((b) => (b.id === optimisticId ? created : b));
        }
        if (old.some((b) => b.id === created.id)) return old;
        return [created, ...old];
      });
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(QUERY_KEY, context.previous);
      }
    },
    onSettled: (_data, error) => {
      if (error) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      }
    },
  });
}
