import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { MOCK_FUNDS } from '../data/financialsPageData';
import type { Fund } from '../types/financials';

const QUERY_KEY = ['financial-funds'] as const;
const USE_API = true;

async function fetchFunds(): Promise<Fund[]> {
  if (!USE_API) return MOCK_FUNDS;

  try {
    return await api.get<Fund[]>('/financials/funds');
  } catch {
    return MOCK_FUNDS;
  }
}

export function useFunds() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchFunds,
  });
}
