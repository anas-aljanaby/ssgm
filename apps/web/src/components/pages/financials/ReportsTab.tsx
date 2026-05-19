import React from 'react';
import {
  TrendingUp,
  Scale,
  ArrowLeftRight,
  Heart,
  FolderKanban,
  PieChart,
  BarChart3,
  Clock,
  Download,
  FileText,
} from 'lucide-react';
import { useLocalization } from '../../../hooks/useLocalization';
import { useToast } from '../../../hooks/useToast';
import { formatDate } from '../../../lib/utils';
import type { FinancialReport, FinancialReportType } from '../../../types/financials';
import { downloadReportByType, useGenerateReport, useReports } from '../../../hooks/useReports';

const REPORT_ICONS: Record<FinancialReportType, React.FC<{ className?: string }>> = {
  income_statement: TrendingUp,
  balance_sheet: Scale,
  cash_flow: ArrowLeftRight,
  donor_report: Heart,
  project_financial: FolderKanban,
  fund_utilization: PieChart,
  budget_variance: BarChart3,
  aging_report: Clock,
};

const REPORT_ICON_COLORS: Record<FinancialReportType, string> = {
  income_statement: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20',
  balance_sheet: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20',
  cash_flow: 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-900/20',
  donor_report: 'text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-900/20',
  project_financial: 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20',
  fund_utilization: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20',
  budget_variance: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20',
  aging_report: 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/40',
};

const ReportsTab: React.FC = () => {
  const { t, language } = useLocalization();
  const { showSuccess, showError } = useToast();
  const { data: reports = [] } = useReports();
  const generateReport = useGenerateReport();
  const [activeGenerateType, setActiveGenerateType] = React.useState<FinancialReportType | null>(null);
  const [activeDownloadType, setActiveDownloadType] = React.useState<FinancialReportType | null>(null);

  const handleGenerate = async (type: FinancialReportType) => {
    setActiveGenerateType(type);
    try {
      await generateReport.mutateAsync({ type });
      showSuccess(t('financials.reports.generatedSuccess'));
    } catch (error) {
      showError(error instanceof Error ? error.message : t('common.error', 'Error'));
    } finally {
      setActiveGenerateType(null);
    }
  };

  const handleDownload = async (type: FinancialReportType) => {
    setActiveDownloadType(type);
    try {
      const result = await downloadReportByType(type);
      window.open(result.url, '_blank', 'noopener,noreferrer');
      showSuccess(t('financials.reports.downloadStarted'));
    } catch (error) {
      showError(error instanceof Error ? error.message : t('common.error', 'Error'));
    } finally {
      setActiveDownloadType(null);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {reports.map((report: FinancialReport) => {
        const Icon = REPORT_ICONS[report.type];
        const iconColor = REPORT_ICON_COLORS[report.type];

        return (
          <div
            key={report.id}
            className="bg-card dark:bg-dark-card rounded-xl border border-gray-200 dark:border-slate-700/50 p-5"
          >
            {/* Icon + Name */}
            <div className="flex items-start gap-3 mb-3">
              <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${iconColor}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-semibold text-foreground dark:text-dark-foreground">
                  {report.name[language]}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5">
                  {report.description[language]}
                </p>
              </div>
            </div>

            {/* Meta info */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400 mb-4">
              <span className="inline-flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" />
                {report.lastGenerated ? (
                  <>
                    {t('financials.reports.lastGenerated')}:{' '}
                    {formatDate(report.lastGenerated, language, 'medium')}
                  </>
                ) : (
                  <span className="italic">
                    {t('financials.reports.neverGenerated')}
                  </span>
                )}
              </span>
              {report.period && (
                <span>
                  {t('financials.reports.period')}: {report.period}
                </span>
              )}
            </div>

            {/* Action row */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleGenerate(report.type)}
                disabled={generateReport.isPending}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60"
              >
                <FileText className="w-4 h-4" />
                {activeGenerateType === report.type && generateReport.isPending
                  ? t('common.loading', 'Loading...')
                  : t('financials.reports.generate')}
              </button>
              {report.lastGenerated && (
                <button
                  onClick={() => handleDownload(report.type)}
                  disabled={activeDownloadType !== null}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700/50 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Download className="w-4 h-4" />
                  {activeDownloadType === report.type
                    ? t('common.loading', 'Loading...')
                    : t('financials.reports.download')}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ReportsTab;
