import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { MOCK_GRANTS, MOCK_TRANSACTIONS } from '../data/financialsPageData';
import type { Grant, FinancialTransaction } from '../types/financials';

const QUERY_KEY = ['financial-grants'] as const;
const USE_API = true;

export interface ReceiveGrantInstallmentInput {
  grantId: string;
  amount: number;
  installmentId?: string;
  receivedDate?: string;
  notes?: string;
}

interface ReceiveGrantInstallmentResponse {
  grant: Grant;
  transaction: FinancialTransaction;
}

async function fetchGrants(): Promise<Grant[]> {
  if (!USE_API) return MOCK_GRANTS;

  try {
    return await api.get<Grant[]>('/financials/grants');
  } catch {
    return MOCK_GRANTS;
  }
}

async function receiveGrantInstallment(input: ReceiveGrantInstallmentInput): Promise<ReceiveGrantInstallmentResponse> {
  const applyLocalReceive = (): ReceiveGrantInstallmentResponse => {
    const grant = MOCK_GRANTS.find((entry) => entry.id === input.grantId);
    if (!grant) throw new Error('Grant not found');

    const installment =
      grant.installments.find((entry) => entry.id === input.installmentId)
      ?? grant.installments.find((entry) => entry.status !== 'received');
    if (!installment) throw new Error('No receivable installment found');

    const receiveAmount = Math.max(0, Math.min(input.amount, installment.amount - installment.receivedAmount));
    const receivedDate = input.receivedDate || new Date().toISOString().slice(0, 10);
    const updatedReceivedAmount = installment.receivedAmount + receiveAmount;
    const fullyReceived = updatedReceivedAmount >= installment.amount;

    installment.receivedAmount = updatedReceivedAmount;
    installment.receivedDate = receivedDate;
    installment.status = fullyReceived ? 'received' : installment.status;

    grant.receivedAmount = grant.installments.reduce((sum, entry) => sum + entry.receivedAmount, 0);
    if (grant.receivedAmount >= grant.totalAmount) {
      grant.status = 'completed';
    }

    const transaction: FinancialTransaction = {
      id: `TXN-LOCAL-GR-${Date.now()}`,
      date: receivedDate,
      description: {
        en: `Grant installment received from ${grant.grantorName}`,
        ar: `استلام دفعة منحة من ${grant.grantorName}`,
      },
      amount: receiveAmount,
      currency: grant.currency,
      direction: 'inflow',
      category: 'grant_income',
      status: 'posted',
      reference: `GRT-RCV-${Date.now()}`,
      relatedEntityId: grant.id,
      relatedEntityType: 'institutional_donor',
      relatedEntityName: grant.grantorName,
      notes: input.notes,
    };
    MOCK_TRANSACTIONS.unshift(transaction);

    return { grant, transaction };
  };

  if (!USE_API) return applyLocalReceive();

  try {
    return await api.post<ReceiveGrantInstallmentResponse>(`/financials/grants/${input.grantId}/receive`, {
      amount: input.amount,
      installment_id: input.installmentId,
      received_date: input.receivedDate,
      notes: input.notes,
    });
  } catch {
    return applyLocalReceive();
  }
}

export function useGrants() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchGrants,
  });
}

export function useReceiveGrantInstallment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: receiveGrantInstallment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['financial-overview'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}
