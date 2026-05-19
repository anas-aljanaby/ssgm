import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { MOCK_TRANSACTIONS } from '../data/financialsPageData';
import type { FinancialTransaction } from '../types/financials';
import type { TransactionFormData } from '../components/pages/financials/AddTransactionModal';

const QUERY_KEY = ['transactions'] as const;

const USE_API = true;

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
      relatedEntityType: data.related_entity_type as FinancialTransaction['relatedEntityType'],
      relatedEntityName: data.related_entity_name || undefined,
      notes: data.notes || undefined,
      attachments: data.receipt ? 1 : 0,
    };
    MOCK_TRANSACTIONS.unshift(newTxn);
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
  if (data.related_entity_type) formData.append('related_entity_type', data.related_entity_type);
  if (data.related_entity_name) formData.append('related_entity_name', data.related_entity_name);
  if (data.notes) formData.append('notes', data.notes);
  if (data.receipt) formData.append('receipt', data.receipt);

  try {
    return await api.upload<FinancialTransaction>('/financials/transactions', formData);
  } catch {
    return buildLocalTransaction();
  }
}

export function useTransactions() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchTransactions,
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}
