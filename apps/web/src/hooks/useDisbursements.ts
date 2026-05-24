import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { MOCK_APPROVAL_ITEMS, MOCK_DISBURSEMENTS, MOCK_TRANSACTIONS } from '../data/financialsPageData';
import type { Disbursement, DisbursementStatus, DisbursementType } from '../types/financials';
import { createOptimisticId, isOptimisticId } from '../lib/optimisticSubmit';

const QUERY_KEY = ['financial-disbursements'] as const;
const USE_API = true;
export const OPTIMISTIC_DISBURSEMENT_PREFIX = 'optimistic-disbursement-';

export function isOptimisticDisbursement(id: string): boolean {
  return isOptimisticId(id, OPTIMISTIC_DISBURSEMENT_PREFIX);
}

export interface CreateDisbursementInput {
  beneficiaryNameEn: string;
  beneficiaryNameAr?: string;
  beneficiaryId?: string;
  type: DisbursementType;
  amount: number;
  scheduledDate: string;
  method: 'bank_transfer' | 'cash' | 'mobile_money' | 'voucher';
  currency?: string;
  notes?: string;
}

function buildOptimisticDisbursement(input: CreateDisbursementInput): Disbursement {
  return {
    id: createOptimisticId(OPTIMISTIC_DISBURSEMENT_PREFIX),
    beneficiaryId: input.beneficiaryId || `beneficiary-${Date.now()}`,
    beneficiaryName: { en: input.beneficiaryNameEn, ar: input.beneficiaryNameAr || input.beneficiaryNameEn },
    type: input.type,
    amount: input.amount,
    currency: input.currency || 'USD',
    status: 'pending_approval',
    scheduledDate: input.scheduledDate,
    method: input.method,
    notes: input.notes,
  };
}

const HIDDEN_DISBURSEMENT_STATUSES: DisbursementStatus[] = ['cancelled', 'failed'];

async function cancelDisbursement(id: string): Promise<Disbursement> {
  return api.patch<Disbursement>(`/financials/disbursements/${id}`, { status: 'cancelled' });
}

async function fetchDisbursements(beneficiaryId?: string): Promise<Disbursement[]> {
  if (!USE_API) {
    const all = MOCK_DISBURSEMENTS.filter((d) => !HIDDEN_DISBURSEMENT_STATUSES.includes(d.status));
    if (!beneficiaryId) return all;
    return all.filter((d) => d.beneficiaryId === beneficiaryId);
  }

  try {
    const path = beneficiaryId
      ? `/financials/disbursements?beneficiary_id=${encodeURIComponent(beneficiaryId)}`
      : '/financials/disbursements';
    const rows = await api.get<Disbursement[]>(path);
    return rows.filter((d) => !HIDDEN_DISBURSEMENT_STATUSES.includes(d.status));
  } catch {
    const all = MOCK_DISBURSEMENTS.filter((d) => !HIDDEN_DISBURSEMENT_STATUSES.includes(d.status));
    if (!beneficiaryId) return all;
    return all.filter((d) => d.beneficiaryId === beneficiaryId);
  }
}

async function createDisbursement(input: CreateDisbursementInput): Promise<Disbursement> {
  const applyLocalCreate = (): Disbursement => {
    const id = `DIS-LOCAL-${Date.now()}`;
    const created: Disbursement = {
      id,
      beneficiaryId: input.beneficiaryId || `beneficiary-${Date.now()}`,
      beneficiaryName: { en: input.beneficiaryNameEn, ar: input.beneficiaryNameAr || input.beneficiaryNameEn },
      type: input.type,
      amount: input.amount,
      currency: input.currency || 'USD',
      status: 'pending_approval',
      scheduledDate: input.scheduledDate,
      method: input.method,
      notes: input.notes,
    };

    MOCK_DISBURSEMENTS.unshift(created);
    MOCK_APPROVAL_ITEMS.unshift({
      id: `APR-LOCAL-${Date.now()}`,
      type: 'disbursement',
      title: `Disbursement for ${input.beneficiaryNameEn}`,
      description: `Approval required for ${input.type} disbursement.`,
      amount: input.amount,
      currency: created.currency,
      requestedBy: 'Demo Admin',
      requestedDate: new Date().toISOString().slice(0, 10),
      priority: 'medium',
      status: 'pending',
      relatedEntityId: id,
      relatedEntityName: input.beneficiaryNameEn,
      currentStep: 1,
      totalSteps: 2,
      workflowId: 'disbursementApproval',
    });

    MOCK_TRANSACTIONS.unshift({
      id: `TXN-LOCAL-DIS-${Date.now()}`,
      date: input.scheduledDate,
      description: {
        en: `Pending disbursement for ${input.beneficiaryNameEn}`,
        ar: `صرف معلق لصالح ${input.beneficiaryNameAr || input.beneficiaryNameEn}`,
      },
      amount: input.amount,
      currency: created.currency,
      direction: 'outflow',
      category: 'disbursement',
      status: 'pending',
      reference: `DIS-REQ-${Date.now()}`,
      relatedEntityId: id,
      relatedEntityType: 'beneficiary',
      relatedEntityName: input.beneficiaryNameEn,
      notes: input.notes,
    });

    return created;
  };

  if (!USE_API) return applyLocalCreate();

  try {
    const result = await api.post<{ disbursement: Disbursement } | Disbursement>('/financials/disbursements', {
      beneficiary_id: input.beneficiaryId || `beneficiary-${Date.now()}`,
      beneficiary_name_en: input.beneficiaryNameEn,
      beneficiary_name_ar: input.beneficiaryNameAr || '',
      type: input.type,
      amount: input.amount,
      currency: input.currency || 'USD',
      scheduled_date: input.scheduledDate,
      method: input.method,
      notes: input.notes,
    });

    if ('disbursement' in result) return result.disbursement;
    return result;
  } catch {
    return applyLocalCreate();
  }
}

export function useDisbursements() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => fetchDisbursements(),
  });
}

export function useBeneficiaryDisbursements(beneficiaryId?: string) {
  return useQuery({
    queryKey: [...QUERY_KEY, beneficiaryId] as const,
    queryFn: () => fetchDisbursements(beneficiaryId),
    enabled: !!beneficiaryId,
  });
}

export function useCancelDisbursement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cancelDisbursement,
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['financial-approvals'] });
      queryClient.invalidateQueries({ queryKey: ['financial-overview'] });
    },
  });
}

type CreateDisbursementContext = {
  previous?: Disbursement[];
  optimisticId: string;
};

export function useCreateDisbursement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createDisbursement,
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const previous = queryClient.getQueryData<Disbursement[]>(QUERY_KEY);
      const optimistic = buildOptimisticDisbursement(variables);
      queryClient.setQueryData<Disbursement[]>(QUERY_KEY, (old) => [optimistic, ...(old ?? [])]);
      return { previous, optimisticId: optimistic.id } satisfies CreateDisbursementContext;
    },
    onSuccess: (created, variables, context) => {
      queryClient.setQueryData<Disbursement[]>(QUERY_KEY, (old) => {
        if (!old) return [created];
        const optimisticId = context?.optimisticId;
        const hasOptimistic = optimisticId && old.some((d) => d.id === optimisticId);
        if (hasOptimistic) {
          return old.map((d) => (d.id === optimisticId ? created : d));
        }
        if (old.some((d) => d.id === created.id)) return old;
        return [created, ...old];
      });
      if (variables.beneficiaryId) {
        queryClient.invalidateQueries({ queryKey: [...QUERY_KEY, variables.beneficiaryId] });
      }
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(QUERY_KEY, context.previous);
      }
    },
    onSettled: (_data, error) => {
      if (error) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEY });
        queryClient.invalidateQueries({ queryKey: ['financial-approvals'] });
        queryClient.invalidateQueries({ queryKey: ['financial-overview'] });
      }
    },
  });
}
