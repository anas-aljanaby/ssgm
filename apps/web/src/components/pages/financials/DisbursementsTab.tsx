import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { DollarSign, Clock, Calendar, AlertTriangle, ExternalLink } from 'lucide-react';
import { useLocalization } from '../../../hooks/useLocalization';
import { formatCurrency, formatDate } from '../../../lib/utils';
import { getDisbursementSourceRoute, navigateToFinancialSource } from '../../../lib/financialSourceNavigation';
import { HIGHLIGHT_ROW_CLASS, useUrlHighlight } from '../../../hooks/useUrlHighlight';
import DataTable, { type Column } from './shared/DataTable';
import FilterBar, { type FilterDef } from './shared/FilterBar';
import StatusBadge from './shared/StatusBadge';
import FinancialKpiCard from './shared/FinancialKpiCard';
import {
  useDisbursements,
  isOptimisticDisbursement,
} from '../../../hooks/useDisbursements';
import type {
  Disbursement,
  DisbursementType,
  DisbursementStatus,
} from '../../../types/financials';

const DISBURSEMENT_TYPES: DisbursementType[] = [
  'aid_payment',
  'sponsorship_stipend',
  'emergency_relief',
  'project_grant',
  'scholarship',
];

const DISBURSEMENT_STATUSES: DisbursementStatus[] = [
  'scheduled',
  'pending_approval',
  'approved',
  'processing',
  'completed',
  'failed',
  'cancelled',
];

const TYPE_BADGE_CLASSES: Record<DisbursementType, string> = {
  aid_payment: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  sponsorship_stipend: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300',
  emergency_relief: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  project_grant: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  scholarship: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
};

const DisbursementsTab: React.FC = () => {
  const { t, language } = useLocalization(['common', 'financials']);
  const { data: disbursements = [] } = useDisbursements();
  const { highlightedId, consumeHighlightParam } = useUrlHighlight();

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    if (disbursements.length === 0) return;
    consumeHighlightParam((id) => (disbursements.some((d) => d.id === id) ? id : null));
  }, [disbursements, consumeHighlightParam]);

  // --- KPI calculations ---
  const kpiData = useMemo(() => {
    const totalDisbursed = disbursements
      .filter((d) => d.status === 'completed')
      .reduce((sum, d) => sum + d.amount, 0);

    const pendingCount = disbursements.filter(
      (d) => d.status === 'pending_approval' || d.status === 'approved' || d.status === 'processing'
    ).length;

    const scheduledThisMonth = disbursements.filter(
      (d) => d.status === 'scheduled'
    ).length;

    const failedCount = disbursements.filter(
      (d) => d.status === 'failed'
    ).length;

    return { totalDisbursed, pendingCount, scheduledThisMonth, failedCount };
  }, [disbursements]);

  // --- Filters ---
  const filters: FilterDef[] = useMemo(
    () => [
      {
        key: 'type',
        label: t('financials.disbursements.allTypes'),
        options: DISBURSEMENT_TYPES.map((dt) => ({
          value: dt,
          label: t(`financials.disbursementType.${dt}`),
        })),
        value: typeFilter,
        onChange: setTypeFilter,
      },
      {
        key: 'status',
        label: t('financials.disbursements.allStatuses'),
        options: DISBURSEMENT_STATUSES.map((s) => ({
          value: s,
          label: t(`financials.status.${s}`),
        })),
        value: statusFilter,
        onChange: setStatusFilter,
      },
    ],
    [t, typeFilter, statusFilter]
  );

  const filteredData = useMemo(() => {
    const optimistic = disbursements.filter((d) => isOptimisticDisbursement(d.id));
    const rest = disbursements.filter((d) => !isOptimisticDisbursement(d.id));
    const filtered = rest.filter((dis) => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesName =
          dis.beneficiaryName[language].toLowerCase().includes(term);
        if (!matchesName) return false;
      }
      if (typeFilter && dis.type !== typeFilter) return false;
      if (statusFilter && dis.status !== statusFilter) return false;
      return true;
    });
    return [...optimistic, ...filtered];
  }, [searchTerm, typeFilter, statusFilter, language, disbursements]);

  const getRowClassName = useCallback(
    (row: Disbursement) => {
      if (isOptimisticDisbursement(row.id)) {
        return 'opacity-70 animate-pulse bg-blue-50/60 dark:bg-blue-950/30';
      }
      if (highlightedId === row.id) {
        return HIGHLIGHT_ROW_CLASS;
      }
      return '';
    },
    [highlightedId]
  );

  // --- Table columns ---
  const columns: Column<Disbursement>[] = useMemo(
    () => [
      {
        key: 'scheduledDate',
        label: t('financials.disbursements.date'),
        sortable: true,
        render: (row) => (
          <span className="text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
            {formatDate(row.scheduledDate, language, 'medium')}
          </span>
        ),
      },
      {
        key: 'beneficiaryName',
        label: t('financials.disbursements.beneficiary'),
        render: (row) => (
          <span className="text-sm font-medium text-foreground dark:text-dark-foreground">
            {row.beneficiaryName[language]}
          </span>
        ),
      },
      {
        key: 'type',
        label: t('financials.disbursements.type'),
        render: (row) => (
          <span
            className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${TYPE_BADGE_CLASSES[row.type]}`}
          >
            {t(`financials.disbursementType.${row.type}`)}
          </span>
        ),
      },
      {
        key: 'amount',
        label: t('financials.disbursements.amount'),
        sortable: true,
        align: 'right',
        render: (row) => (
          <span className="text-sm font-semibold text-foreground dark:text-dark-foreground whitespace-nowrap">
            {formatCurrency(row.amount, language)}
          </span>
        ),
      },
      {
        key: 'method',
        label: t('financials.disbursements.method'),
        render: (row) => (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {t(`financials.method.${row.method}`)}
          </span>
        ),
      },
      {
        key: 'projectName',
        label: t('financials.disbursements.project'),
        render: (row) => (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {row.projectName?.[language] || '—'}
          </span>
        ),
      },
      {
        key: 'status',
        label: t('financials.disbursements.status'),
        render: (row) =>
          isOptimisticDisbursement(row.id) ? (
            <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
              {t('common.saving')}
            </span>
          ) : (
            <StatusBadge status={row.status} />
          ),
      },
      {
        key: 'actions',
        label: '',
        align: 'right',
        render: (row) => {
          if (isOptimisticDisbursement(row.id)) return null;
          const sourceRoute = getDisbursementSourceRoute(row);
          if (!sourceRoute) return null;
          return (
            <button
              type="button"
              onClick={() => navigateToFinancialSource(sourceRoute)}
              className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline whitespace-nowrap"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              {t('financials.disbursements.goToSource')}
            </button>
          );
        },
      },
    ],
    [t, language]
  );

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <FinancialKpiCard
          title={t('financials.disbursements.totalDisbursed')}
          value={formatCurrency(kpiData.totalDisbursed, language)}
          icon={DollarSign}
          colorClass="text-emerald-600 dark:text-emerald-400"
          bgClass="bg-emerald-100 dark:bg-emerald-900/30"
        />
        <FinancialKpiCard
          title={t('financials.disbursements.pendingCount')}
          value={kpiData.pendingCount}
          icon={Clock}
          colorClass="text-amber-600 dark:text-amber-400"
          bgClass="bg-amber-100 dark:bg-amber-900/30"
        />
        <FinancialKpiCard
          title={t('financials.disbursements.scheduledThisMonth')}
          value={kpiData.scheduledThisMonth}
          icon={Calendar}
          colorClass="text-blue-600 dark:text-blue-400"
          bgClass="bg-blue-100 dark:bg-blue-900/30"
        />
        <FinancialKpiCard
          title={t('financials.disbursements.failedCount')}
          value={kpiData.failedCount}
          icon={AlertTriangle}
          colorClass="text-red-600 dark:text-red-400"
          bgClass="bg-red-100 dark:bg-red-900/30"
        />
      </div>

      <FilterBar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder={t('financials.disbursements.searchPlaceholder')}
        filters={filters}
      />

      <DataTable<Disbursement>
        columns={columns}
        data={filteredData}
        getRowKey={(row) => row.id}
        getRowClassName={getRowClassName}
        emptyMessage={t('financials.disbursements.noDisbursements')}
      />
    </div>
  );
};

export default DisbursementsTab;
