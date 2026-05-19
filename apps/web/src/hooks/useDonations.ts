import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { MOCK_DONATIONS } from '../data/financialsPageData';
import type { DonationRecord } from '../types/financials';

const QUERY_KEY = ['financial-donations'] as const;
const USE_API = true;

async function fetchDonations(): Promise<DonationRecord[]> {
  if (!USE_API) return MOCK_DONATIONS;

  try {
    return await api.get<DonationRecord[]>('/financials/donations');
  } catch {
    return MOCK_DONATIONS;
  }
}

export function useDonations() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchDonations,
  });
}
