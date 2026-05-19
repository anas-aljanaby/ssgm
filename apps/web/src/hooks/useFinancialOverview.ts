import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import {
  MOCK_ALERTS,
  MOCK_FUNDS,
  MOCK_MONTHLY_DATA,
  MOCK_PLEDGES,
  MOCK_TRANSACTIONS,
} from '../data/financialsPageData';
import type { FinancialAlert, FinancialTransaction, Fund, MonthlyFinancialData } from '../types/financials';

export interface FinancialOverviewData {
  monthlyData: MonthlyFinancialData[];
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  outstandingPledges: number;
  recentTransactions: FinancialTransaction[];
  funds: Fund[];
  alerts: FinancialAlert[];
}

const QUERY_KEY = ['financial-overview'] as const;
const USE_API = true;

function buildFallbackOverview(): FinancialOverviewData {
  const totalRevenue = MOCK_TRANSACTIONS
    .filter((entry) => entry.direction === 'inflow' && entry.status !== 'voided')
    .reduce((sum, entry) => sum + entry.amount, 0);
  const totalExpenses = MOCK_TRANSACTIONS
    .filter((entry) => entry.direction === 'outflow' && entry.status !== 'voided')
    .reduce((sum, entry) => sum + entry.amount, 0);
  const outstandingPledges = MOCK_PLEDGES
    .filter((p) => p.status === 'active' || p.status === 'overdue' || p.status === 'partially_fulfilled')
    .reduce((sum, p) => sum + (p.totalAmount - p.paidAmount), 0);

  return {
    monthlyData: MOCK_MONTHLY_DATA,
    totalRevenue,
    totalExpenses,
    netIncome: totalRevenue - totalExpenses,
    outstandingPledges,
    recentTransactions: [...MOCK_TRANSACTIONS]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5),
    funds: MOCK_FUNDS,
    alerts: MOCK_ALERTS,
  };
}

async function fetchFinancialOverview(): Promise<FinancialOverviewData> {
  if (!USE_API) return buildFallbackOverview();

  try {
    return await api.get<FinancialOverviewData>('/financials/overview');
  } catch {
    return buildFallbackOverview();
  }
}

export function useFinancialOverview() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchFinancialOverview,
  });
}
