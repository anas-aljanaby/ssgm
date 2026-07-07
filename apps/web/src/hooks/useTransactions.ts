import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { MOCK_TRANSACTIONS, MOCK_DONATIONS } from '../data/financialsPageData';
import type { DonationRecord, FinancialTransaction } from '../types/financials';
import type { TransactionFormData } from '../components/pages/financials/AddTransactionModal';
import { DONATIONS_QUERY_KEY } from './useDonations';

const QUERY_KEY = ['transactions'] as const;
const OPTIMISTIC_ID_PREFIX = 'optimistic-';
const OPTIMISTIC_DONATION_ID_PREFIX = 'optimistic-donation-';

const USE_API = true;

export function isOptimisticTransaction(id: string): boolean {
  return id.startsWith(OPTIMISTIC_ID_PREFIX);
}

export function isOptimisticDonation(id: string): boolean {
  return id.startsWith(OPTIMISTIC_DONATION_ID_PREFIX);
}

function buildOptimisticDonation(
  data: TransactionFormData,
  transactionId: string
): DonationRecord {
  const nameEn =
    data.related_entity_name || data.description_en.trim() || data.description_ar.trim();
  const nameAr = data.description_ar.trim() || nameEn;
  return {
    id: `${OPTIMISTIC_DONATION_ID_PREFIX}${Date.now()}`,
    donorId: data.related_entity_id || '',
    donorName: { en: nameEn, ar: nameAr },
    donorType: data.related_entity_type === 'institutional_donor' ? 'institutional' : 'individual',
    date: data.date,
    amount: data.amount,
    currency: data.currency,
    method: data.donation_method,
    designation: data.designation || undefined,
    receiptStatus: 'pending',
    isRecurring: data.is_recurring,
    recurringFrequency: data.is_recurring
      ? (data.recurring_frequency as DonationRecord['recurringFrequency'])
      : undefined,
    notes: data.notes || undefined,
    transactionId,
  };
}

function buildOptimisticTransaction(data: TransactionFormData): FinancialTransaction {
  const descEn = data.description_en.trim();
  const descAr = data.description_ar.trim();
  return {
    id: `${OPTIMISTIC_ID_PREFIX}${Date.now()}`,
    date: data.date,
    description: { en: descEn, ar: descAr },
    amount: data.amount,
    currency: data.currency,
    direction: data.direction,
    category: data.category,
    status: data.status,
    reference: data.reference || '…',
    relatedEntityId: data.related_entity_id || undefined,
    relatedEntityType: data.related_entity_type as FinancialTransaction['relatedEntityType'],
    relatedEntityName: data.related_entity_name || undefined,
    notes: data.notes || undefined,
    attachments: data.receipt ? 1 : 0,
  };
}

function buildDonationCustomFields(data: TransactionFormData): Record<string, unknown> {
  if (data.category !== 'donation') return {};
  return {
    donation_method: data.donation_method,
    designation: data.designation || undefined,
    is_recurring: data.is_recurring,
    recurring_frequency: data.is_recurring ? data.recurring_frequency || undefined : undefined,
    donor_type:
      data.related_entity_type === 'institutional_donor' ? 'institutional' : 'individual',
  };
}

function appendDonationRecordFromTransaction(
  txn: FinancialTransaction,
  data: TransactionFormData
): DonationRecord {
  const donorNameEn = data.related_entity_name || data.description_en;
  const donorNameAr = data.description_ar || donorNameEn;
  const donation: DonationRecord = {
    id: data.reference || `DON-LOCAL-${Date.now()}`,
    donorId: data.related_entity_type === 'donor' ? data.related_entity_id || '' : '',
    donorName: { en: donorNameEn, ar: donorNameAr },
    donorType: data.related_entity_type === 'institutional_donor' ? 'institutional' : 'individual',
    date: data.date,
    amount: data.amount,
    currency: data.currency,
    method: data.donation_method,
    designation: data.designation || undefined,
    receiptStatus: 'pending',
    isRecurring: data.is_recurring,
    recurringFrequency: data.is_recurring
      ? (data.recurring_frequency as DonationRecord['recurringFrequency'])
      : undefined,
    notes: data.notes || undefined,
    transactionId: txn.id,
  };
  MOCK_DONATIONS.unshift(donation);
  return donation;
}

async function fetchTransactions(): Promise<FinancialTransaction[]> {
  if (!USE_API) return MOCK_TRANSACTIONS;
  try {
    return await api.get<FinancialTransaction[]>('/financials/transactions');
  } catch {
    return MOCK_TRANSACTIONS;
  }
}

async function createTransaction(
  data: TransactionFormData
): Promise<FinancialTransaction> {
  const customFields = buildDonationCustomFields(data);

  const buildLocalTransaction = (): FinancialTransaction => {
    const newTxn: FinancialTransaction = {
      id: `TXN-LOCAL-${Date.now()}`,
      date: data.date,
      description: { en: data.description_en, ar: data.description_ar },
      amount: data.amount,
      currency: data.currency,
      direction: data.direction,
      category: data.category,
      status: data.status,
      reference: data.reference || `REF-${Date.now()}`,
      relatedEntityId: data.related_entity_id || undefined,
      relatedEntityType: data.related_entity_type as FinancialTransaction['relatedEntityType'],
      relatedEntityName: data.related_entity_name || undefined,
      notes: data.notes || undefined,
      attachments: data.receipt ? 1 : 0,
    };
    MOCK_TRANSACTIONS.unshift(newTxn);
    if (data.category === 'donation') {
      appendDonationRecordFromTransaction(newTxn, data);
    }
    return newTxn;
  };

  if (!USE_API) return buildLocalTransaction();

  const formData = new FormData();
  formData.append('date', data.date);
  formData.append('description_en', data.description_en);
  formData.append('description_ar', data.description_ar);
  formData.append('amount', String(data.amount));
  formData.append('currency', data.currency);
  formData.append('direction', data.direction);
  formData.append('category', data.category);
  formData.append('status', data.status);
  if (data.reference) formData.append('reference', data.reference);
  if (data.related_entity_id) formData.append('related_entity_id', data.related_entity_id);
  if (data.related_entity_type) formData.append('related_entity_type', data.related_entity_type);
  if (data.related_entity_name) formData.append('related_entity_name', data.related_entity_name);
  if (data.notes) formData.append('notes', data.notes);
  if (Object.keys(customFields).length > 0) {
    formData.append('custom_fields', JSON.stringify(customFields));
  }
  if (data.receipt) formData.append('receipt', data.receipt);

  try {
    return await api.upload<FinancialTransaction>('/financials/transactions', formData);
  } catch {
    return buildLocalTransaction();
  }
}

export function useTransactions() {
  const { user, session, loading: authLoading } = useAuth();
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchTransactions,
    enabled: !authLoading && !!user && !!session?.access_token,
  });
}

type CreateTransactionContext = {
  previous?: FinancialTransaction[];
  previousDonations?: DonationRecord[];
  optimisticId: string;
  optimisticDonationId?: string;
};

export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTransaction,
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const previous = queryClient.getQueryData<FinancialTransaction[]>(QUERY_KEY);
      const optimistic = buildOptimisticTransaction(variables);

      let previousDonations: DonationRecord[] | undefined;
      let optimisticDonationId: string | undefined;

      if (variables.category === 'donation') {
        await queryClient.cancelQueries({ queryKey: DONATIONS_QUERY_KEY });
        previousDonations = queryClient.getQueryData<DonationRecord[]>(DONATIONS_QUERY_KEY);
        const optimisticDonation = buildOptimisticDonation(variables, optimistic.id);
        optimisticDonationId = optimisticDonation.id;
        queryClient.setQueryData<DonationRecord[]>(DONATIONS_QUERY_KEY, (old) => [
          optimisticDonation,
          ...(old ?? []),
        ]);
      }

      queryClient.setQueryData<FinancialTransaction[]>(QUERY_KEY, (old) => [
        optimistic,
        ...(old ?? []),
      ]);
      return {
        previous,
        previousDonations,
        optimisticId: optimistic.id,
        optimisticDonationId,
      } satisfies CreateTransactionContext;
    },
    onSuccess: (created, _variables, context) => {
      queryClient.setQueryData<FinancialTransaction[]>(QUERY_KEY, (old) => {
        if (!old) return [created];
        const optimisticId = context?.optimisticId;
        const hasOptimistic = optimisticId && old.some((txn) => txn.id === optimisticId);
        if (hasOptimistic) {
          return old.map((txn) => (txn.id === optimisticId ? created : txn));
        }
        if (old.some((txn) => txn.id === created.id)) return old;
        return [created, ...old];
      });
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(QUERY_KEY, context.previous);
      }
      if (context?.previousDonations) {
        queryClient.setQueryData(DONATIONS_QUERY_KEY, context.previousDonations);
      }
    },
    onSettled: (_data, error, variables) => {
      if (variables?.category === 'donation') {
        queryClient.invalidateQueries({ queryKey: DONATIONS_QUERY_KEY });
      }
      if (error) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      }
    },
  });
}

async function deleteTransaction(id: string): Promise<void> {
  if (!USE_API) {
    const txnIdx = MOCK_TRANSACTIONS.findIndex((t) => t.id === id);
    if (txnIdx >= 0) MOCK_TRANSACTIONS.splice(txnIdx, 1);
    const donationIdx = MOCK_DONATIONS.findIndex((d) => d.transactionId === id);
    if (donationIdx >= 0) MOCK_DONATIONS.splice(donationIdx, 1);
    return;
  }
  await api.delete(`/financials/transactions/${id}`);
}

type DeleteTransactionContext = {
  previous?: FinancialTransaction[];
  previousDonations?: DonationRecord[];
};

export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => {
      if (isOptimisticTransaction(id)) {
        return Promise.reject(new Error('Cannot delete pending transaction'));
      }
      return deleteTransaction(id);
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const previous = queryClient.getQueryData<FinancialTransaction[]>(QUERY_KEY);
      const txn = previous?.find((t) => t.id === id);

      queryClient.setQueryData<FinancialTransaction[]>(QUERY_KEY, (old) =>
        (old ?? []).filter((t) => t.id !== id)
      );

      let previousDonations: DonationRecord[] | undefined;
      if (txn?.category === 'donation') {
        await queryClient.cancelQueries({ queryKey: DONATIONS_QUERY_KEY });
        previousDonations = queryClient.getQueryData<DonationRecord[]>(DONATIONS_QUERY_KEY);
        queryClient.setQueryData<DonationRecord[]>(DONATIONS_QUERY_KEY, (old) =>
          (old ?? []).filter((d) => d.transactionId !== id)
        );
      }

      return { previous, previousDonations } satisfies DeleteTransactionContext;
    },
    onError: (_error, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(QUERY_KEY, context.previous);
      }
      if (context?.previousDonations) {
        queryClient.setQueryData(DONATIONS_QUERY_KEY, context.previousDonations);
      }
    },
    onSettled: (_data, error) => {
      if (error) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEY });
        queryClient.invalidateQueries({ queryKey: DONATIONS_QUERY_KEY });
      }
    },
  });
}
