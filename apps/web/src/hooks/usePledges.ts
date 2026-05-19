import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { MOCK_PLEDGES, MOCK_TRANSACTIONS } from '../data/financialsPageData';
import type { FinancialPledge, FinancialTransaction, PledgeInstallment } from '../types/financials';

const QUERY_KEY = ['financial-pledges'] as const;
const USE_API = true;

export interface RecordPledgePaymentInput {
  pledgeId: string;
  amount: number;
  installmentId?: string;
  paidDate?: string;
  notes?: string;
}

interface RecordPledgePaymentResponse {
  pledge: FinancialPledge;
  installment: PledgeInstallment;
  transaction: FinancialTransaction;
}

async function fetchPledges(): Promise<FinancialPledge[]> {
  if (!USE_API) return MOCK_PLEDGES;

  try {
    return await api.get<FinancialPledge[]>('/financials/pledges');
  } catch {
    return MOCK_PLEDGES;
  }
}

async function recordPledgePayment(input: RecordPledgePaymentInput): Promise<RecordPledgePaymentResponse> {
  const applyLocalPayment = (): RecordPledgePaymentResponse => {
    const pledge = MOCK_PLEDGES.find((entry) => entry.id === input.pledgeId);
    if (!pledge) throw new Error('Pledge not found');

    const installment =
      pledge.installments.find((entry) => entry.id === input.installmentId)
      ?? pledge.installments.find((entry) => entry.status !== 'paid');

    if (!installment) throw new Error('No payable installment found');

    const paymentAmount = Math.max(0, Math.min(input.amount, installment.amount - installment.paidAmount));
    const paidDate = input.paidDate || new Date().toISOString().slice(0, 10);
    const updatedPaidAmount = installment.paidAmount + paymentAmount;
    const isFullyPaid = updatedPaidAmount >= installment.amount;

    installment.paidAmount = updatedPaidAmount;
    installment.paidDate = paidDate;
    installment.status = isFullyPaid ? 'paid' : 'partial';

    pledge.paidAmount = pledge.installments.reduce((sum, entry) => sum + entry.paidAmount, 0);
    if (pledge.paidAmount >= pledge.totalAmount) {
      pledge.status = 'fulfilled';
    } else if (pledge.installments.some((entry) => entry.status === 'overdue')) {
      pledge.status = 'overdue';
    } else {
      pledge.status = 'partially_fulfilled';
    }

    const transaction: FinancialTransaction = {
      id: `TXN-LOCAL-PLEDGE-${Date.now()}`,
      date: paidDate,
      description: {
        en: `Pledge payment from ${pledge.donorName.en}`,
        ar: `دفعة تعهد من ${pledge.donorName.ar || pledge.donorName.en}`,
      },
      amount: paymentAmount,
      currency: pledge.currency,
      direction: 'inflow',
      category: 'donation',
      status: 'posted',
      reference: `PLG-PMT-${Date.now()}`,
      relatedEntityId: pledge.id,
      relatedEntityType: 'donor',
      relatedEntityName: pledge.donorName.en,
      notes: input.notes,
    };
    MOCK_TRANSACTIONS.unshift(transaction);

    return {
      pledge,
      installment,
      transaction,
    };
  };

  if (!USE_API) return applyLocalPayment();

  try {
    return await api.post<RecordPledgePaymentResponse>(`/financials/pledges/${input.pledgeId}/payments`, {
      amount: input.amount,
      installment_id: input.installmentId,
      paid_date: input.paidDate,
      notes: input.notes,
    });
  } catch {
    return applyLocalPayment();
  }
}

export function usePledges() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchPledges,
  });
}

export function useRecordPledgePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: recordPledgePayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['financial-overview'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}
