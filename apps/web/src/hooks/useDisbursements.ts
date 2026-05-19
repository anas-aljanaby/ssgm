import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { MOCK_APPROVAL_ITEMS, MOCK_DISBURSEMENTS, MOCK_TRANSACTIONS } from '../data/financialsPageData';
import type { Disbursement, DisbursementType } from '../types/financials';

const QUERY_KEY = ['financial-disbursements'] as const;
const USE_API = true;

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

async function fetchDisbursements(): Promise<Disbursement[]> {
  if (!USE_API) return MOCK_DISBURSEMENTS;

  try {
    return await api.get<Disbursement[]>('/financials/disbursements');
  } catch {
    return MOCK_DISBURSEMENTS;
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
    queryFn: fetchDisbursements,
  });
}

export function useCreateDisbursement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createDisbursement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['financial-approvals'] });
      queryClient.invalidateQueries({ queryKey: ['financial-overview'] });
    },
  });
}
