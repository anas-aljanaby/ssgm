import React, { useState, useMemo } from 'react';
import { Heart, TrendingUp, FileText, Repeat } from 'lucide-react';
import { useLocalization } from '../../../hooks/useLocalization';
import { formatCurrency, formatDate } from '../../../lib/utils';
import DataTable, { type Column } from './shared/DataTable';
import FilterBar, { type FilterDef } from './shared/FilterBar';
import StatusBadge from './shared/StatusBadge';
import FinancialKpiCard from './shared/FinancialKpiCard';
import { useDonations } from '../../../hooks/useDonations';
import type {
  DonationRecord,
  DonationMethod,
  ReceiptStatus,
} from '../../../types/financials';

const DONATION_METHODS: DonationMethod[] = [
  'bank_transfer',
  'credit_card',
  'cash',
  'check',
  'online_gateway',
  'in_kind',
];

const RECEIPT_STATUSES: ReceiptStatus[] = [
  'pending',
  'generated',
  'sent',
  'voided',
];

const DonationsTab: React.FC = () => {
  const { t, language } = useLocalization();
  const { data: donations = [] } = useDonations();

  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [receiptFilter, setReceiptFilter] = useState('');

  // --- KPI calculations ---
  const kpiData = useMemo(() => {
    const totalDonations = donations.length;

    const totalAmount = donations.reduce((sum, d) => sum + d.amount, 0);
    const averageGift = totalDonations > 0 ? totalAmount / totalDonations : 0;

    const receiptsPending = donations.filter(
      (d) => d.receiptStatus === 'pending'
    ).length;

    const recurringDonorIds = new Set(
      donations.filter((d) => d.isRecurring).map((d) => d.donorId)
    );
    const recurringDonors = recurringDonorIds.size;

    return { totalDonations, averageGift, receiptsPending, recurringDonors };
  }, [donations]);

  // --- Filters ---
  const filters: FilterDef[] = useMemo(
    () => [
      {
        key: 'method',
        label: t('financials.donations.allMethods'),
        options: DONATION_METHODS.map((m) => ({
          value: m,
          label: t(`financials.method.${m}`),
        })),
        value: methodFilter,
        onChange: setMethodFilter,
      },
      {
        key: 'receiptStatus',
        label: t('financials.donations.allReceiptStatuses'),
        options: RECEIPT_STATUSES.map((s) => ({
          value: s,
          label: t(`financials.status.${s}`),
        })),
        value: receiptFilter,
        onChange: setReceiptFilter,
      },
    ],
    [t, methodFilter, receiptFilter]
  );

  const filteredData = useMemo(() => {
    return donations.filter((don) => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesName =
          don.donorName.en.toLowerCase().includes(term) ||
          don.donorName.ar.includes(term);
        if (!matchesName) return false;
      }
      if (methodFilter && don.method !== methodFilter) return false;
      if (receiptFilter && don.receiptStatus !== receiptFilter) return false;
      return true;
    });
  }, [searchTerm, methodFilter, receiptFilter, donations]);

  // --- Table columns ---
  const columns: Column<DonationRecord>[] = useMemo(
    () => [
      {
        key: 'date',
        label: t('financials.donations.date'),
        sortable: true,
        render: (row) => (
          <span className="text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
            {formatDate(row.date, language, 'medium')}
          </span>
        ),
      },
      {
        key: 'donorName',
        label: t('financials.donations.donor'),
        render: (row) => (
          <span className="text-sm font-medium text-foreground dark:text-dark-foreground">
            {row.donorName[language]}
          </span>
        ),
      },
      {
        key: 'amount',
        label: t('financials.donations.amount'),
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
        label: t('financials.donations.method'),
        render: (row) => (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {t(`financials.method.${row.method}`)}
          </span>
        ),
      },
      {
        key: 'designation',
        label: t('financials.donations.designation'),
        render: (row) => (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {row.designation || row.projectName?.[language] || '—'}
          </span>
        ),
      },
      {
        key: 'receiptStatus',
        label: t('financials.donations.receiptStatus'),
        render: (row) => (
          <div className="flex flex-col gap-0.5">
            <StatusBadge status={row.receiptStatus} />
            {row.receiptNumber && (
              <span className="text-[11px] text-gray-500 dark:text-gray-400 font-mono">
                {row.receiptNumber}
              </span>
            )}
          </div>
        ),
      },
      {
        key: 'isRecurring',
        label: t('financials.donations.recurring'),
        render: (row) =>
          row.isRecurring ? (
            <span className="inline-flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
              {row.recurringFrequency
                ? row.recurringFrequency.charAt(0).toUpperCase() +
                  row.recurringFrequency.slice(1)
                : ''}
            </span>
          ) : (
            <span className="text-sm text-gray-400 dark:text-gray-500">
              {'—'}
            </span>
          ),
      },
    ],
    [t, language]
  );

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <FinancialKpiCard
          title={t('financials.donations.totalDonations')}
          value={kpiData.totalDonations}
          icon={Heart}
          colorClass="text-emerald-600 dark:text-emerald-400"
          bgClass="bg-emerald-100 dark:bg-emerald-900/30"
        />
        <FinancialKpiCard
          title={t('financials.donations.averageGift')}
          value={formatCurrency(kpiData.averageGift, language)}
          icon={TrendingUp}
          colorClass="text-blue-600 dark:text-blue-400"
          bgClass="bg-blue-100 dark:bg-blue-900/30"
        />
        <FinancialKpiCard
          title={t('financials.donations.receiptsPending')}
          value={kpiData.receiptsPending}
          icon={FileText}
          colorClass="text-amber-600 dark:text-amber-400"
          bgClass="bg-amber-100 dark:bg-amber-900/30"
        />
        <FinancialKpiCard
          title={t('financials.donations.recurringDonors')}
          value={kpiData.recurringDonors}
          icon={Repeat}
          colorClass="text-violet-600 dark:text-violet-400"
          bgClass="bg-violet-100 dark:bg-violet-900/30"
        />
      </div>

      {/* Filters */}
      <FilterBar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder={t('financials.donations.searchPlaceholder')}
        filters={filters}
      />

      {/* Table */}
      <DataTable<DonationRecord>
        columns={columns}
        data={filteredData}
        emptyMessage={t('financials.donations.noDonations')}
      />
    </div>
  );
};

export default DonationsTab;
