import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { MOCK_BUDGETS } from '../data/financialsPageData';
import type { ProjectBudget } from '../types/financials';

const QUERY_KEY = ['financial-budgets'] as const;
const USE_API = true;

async function fetchBudgets(): Promise<ProjectBudget[]> {
  if (!USE_API) return MOCK_BUDGETS;

  try {
    return await api.get<ProjectBudget[]>('/financials/budgets');
  } catch {
    return MOCK_BUDGETS;
  }
}

export function useBudgets() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchBudgets,
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

export function useCreateBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createBudget,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}
