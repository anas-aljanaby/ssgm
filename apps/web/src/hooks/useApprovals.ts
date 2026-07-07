import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { MOCK_APPROVAL_ITEMS, MOCK_DISBURSEMENTS, MOCK_TRANSACTIONS } from '../data/financialsPageData';
import type { ApprovalItem } from '../types/financials';

const QUERY_KEY = ['financial-approvals'] as const;
const USE_API = true;

interface ApprovalActionInput {
  id: string;
  notes?: string;
}

async function fetchApprovals(): Promise<ApprovalItem[]> {
  if (!USE_API) return MOCK_APPROVAL_ITEMS;

  try {
    return await api.get<ApprovalItem[]>('/financials/approvals');
  } catch {
    return MOCK_APPROVAL_ITEMS;
  }
}

async function approveItem(input: ApprovalActionInput): Promise<ApprovalItem> {
  const applyLocalApprove = (): ApprovalItem => {
    const item = MOCK_APPROVAL_ITEMS.find((entry) => entry.id === input.id);
    if (!item) throw new Error('Approval item not found');

    item.status = 'approved';
    item.currentStep = item.totalSteps;

    if (item.type === 'disbursement' && item.relatedEntityId) {
      const disbursement = MOCK_DISBURSEMENTS.find((entry) => entry.id === item.relatedEntityId);
      if (disbursement) {
        disbursement.status = 'approved';
        disbursement.approvedBy = 'Demo Admin';
      }
    }

    const pendingTxn = MOCK_TRANSACTIONS.find(
      (entry) => entry.relatedEntityId === item.relatedEntityId && entry.status === 'pending'
    );
    if (pendingTxn) {
      pendingTxn.status = 'approved';
      pendingTxn.approvedBy = 'Demo Admin';
      pendingTxn.approvedDate = new Date().toISOString().slice(0, 10);
      pendingTxn.notes = input.notes || pendingTxn.notes;
    }

    return item;
  };

  if (!USE_API) return applyLocalApprove();

  try {
    return await api.post<ApprovalItem>(`/financials/approvals/${input.id}/approve`, { notes: input.notes });
  } catch {
    return applyLocalApprove();
  }
}

async function rejectItem(input: ApprovalActionInput): Promise<ApprovalItem> {
  const applyLocalReject = (): ApprovalItem => {
    const item = MOCK_APPROVAL_ITEMS.find((entry) => entry.id === input.id);
    if (!item) throw new Error('Approval item not found');

    item.status = 'rejected';

    if (item.type === 'disbursement' && item.relatedEntityId) {
      const disbursement = MOCK_DISBURSEMENTS.find((entry) => entry.id === item.relatedEntityId);
      if (disbursement) {
        disbursement.status = 'cancelled';
      }
    }

    const pendingTxn = MOCK_TRANSACTIONS.find(
      (entry) => entry.relatedEntityId === item.relatedEntityId && entry.status === 'pending'
    );
    if (pendingTxn) {
      pendingTxn.status = 'voided';
      pendingTxn.notes = input.notes || pendingTxn.notes;
    }

    return item;
  };

  if (!USE_API) return applyLocalReject();

  try {
    return api.post<ApprovalItem>(`/financials/approvals/${input.id}/reject`, { notes: input.notes });
  } catch {
    return applyLocalReject();
  }
}

export function useApprovals() {
  const { user, session, loading: authLoading } = useAuth();
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchApprovals,
    enabled: !authLoading && !!user && !!session?.access_token,
  });
}

export function useApproveItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: approveItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['financial-disbursements'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['financial-overview'] });
    },
  });
}

export function useRejectItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: rejectItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['financial-disbursements'] });
      queryClient.invalidateQueries({ queryKey: ['financial-overview'] });
    },
  });
}
