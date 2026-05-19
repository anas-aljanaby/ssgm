import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { MOCK_REPORTS } from '../data/financialsPageData';
import type { FinancialReport, FinancialReportType } from '../types/financials';

const QUERY_KEY = ['financial-reports'] as const;
const USE_API = true;

export interface GenerateReportInput {
  type: FinancialReportType;
  period?: string;
}

interface DownloadReportResponse {
  url: string;
  format: 'pdf' | 'xlsx' | 'csv';
  reportId?: string;
}

async function fetchReports(): Promise<FinancialReport[]> {
  if (!USE_API) return MOCK_REPORTS;

  try {
    const reports = await api.get<FinancialReport[]>('/financials/reports');
    return reports.length > 0 ? reports : MOCK_REPORTS;
  } catch {
    return MOCK_REPORTS;
  }
}

async function generateReport(input: GenerateReportInput): Promise<FinancialReport> {
  const applyLocalGenerate = (): FinancialReport => {
    const report = MOCK_REPORTS.find((entry) => entry.type === input.type);
    if (!report) throw new Error('Report type not found');

    report.lastGenerated = new Date().toISOString();
    if (input.period) {
      report.period = input.period;
    }
    return report;
  };

  if (!USE_API) return applyLocalGenerate();

  try {
    return await api.post<FinancialReport>(`/financials/reports/${input.type}/generate`, { period: input.period });
  } catch {
    return applyLocalGenerate();
  }
}

export async function downloadReportByType(type: FinancialReportType): Promise<DownloadReportResponse> {
  const buildLocalDownload = (): DownloadReportResponse => {
    const report = MOCK_REPORTS.find((entry) => entry.type === type);
    if (!report) throw new Error('Report type not found');

    const fileName = `${type}-${new Date().toISOString().slice(0, 10)}.${report.format}`;
    const preview = `Mock ${type} report\nGenerated: ${new Date().toISOString()}\nFormat: ${report.format}\nFile: ${fileName}`;
    return {
      url: `data:text/plain;charset=utf-8,${encodeURIComponent(preview)}`,
      format: report.format,
      reportId: report.id,
    };
  };

  if (!USE_API) return buildLocalDownload();

  try {
    return await api.get<DownloadReportResponse>(`/financials/reports/${type}/download`);
  } catch {
    return buildLocalDownload();
  }
}

export function useReports() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchReports,
  });
}

export function useGenerateReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: generateReport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}
