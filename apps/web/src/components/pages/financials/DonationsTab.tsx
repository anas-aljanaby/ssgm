import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Heart, TrendingUp, FileText, Repeat, Plus } from 'lucide-react';
import { useLocalization } from '../../../hooks/useLocalization';
import { useToast } from '../../../hooks/useToast';
import { formatCurrency, formatDate } from '../../../lib/utils';
import DataTable, { type Column } from './shared/DataTable';
import FilterBar, { type FilterDef } from './shared/FilterBar';
import StatusBadge from './shared/StatusBadge';
import FinancialKpiCard from './shared/FinancialKpiCard';
import AddTransactionModal, { type TransactionFormData } from './AddTransactionModal';
import { useDonations } from '../../../hooks/useDonations';
import { useCreateTransaction, isOptimisticDonation } from '../../../hooks/useTransactions';
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

const HIGHLIGHT_MS = 2200;

const DonationsTab: React.FC = () => {
  const { t, language } = useLocalization();
  const toast = useToast();
  const { data: donations = [], isLoading } = useDonations();
  const createTransaction = useCreateTransaction();

  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [receiptFilter, setReceiptFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
    };
  }, []);

  const flashHighlight = useCallback((id: string) => {
    if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
    setHighlightedId(id);
    highlightTimerRef.current = setTimeout(() => setHighlightedId(null), HIGHLIGHT_MS);
  }, []);

  const pendingDonationIdRef = useRef<string | null>(null);

  const handleCreate = useCallback(
    (data: TransactionFormData) => {
      createTransaction.mutate(data, {
        onSuccess: () => {
          toast.showSuccess(t('financials.addDonation.save', 'Save Donation'));
          if (pendingDonationIdRef.current) {
            flashHighlight(pendingDonationIdRef.current);
            pendingDonationIdRef.current = null;
          }
        },
        onError: () => {
          pendingDonationIdRef.current = null;
          toast.showError(
            t('financials.transactions.addFailed', 'Unable to add transaction. Please try again.')
          );
        },
      });
    },
    [createTransaction, flashHighlight, t, toast]
  );

  const hasActiveFilters = Boolean(searchTerm || methodFilter || receiptFilter);

  const confirmedDonations = useMemo(
    () => donations.filter((d) => !isOptimisticDonation(d.id)),
    [donations]
  );

  const kpiData = useMemo(() => {
    const totalDonations = confirmedDonations.length;

    const totalAmount = confirmedDonations.reduce((sum, d) => sum + d.amount, 0);
    const averageGift = totalDonations > 0 ? totalAmount / totalDonations : 0;

    const receiptsPending = confirmedDonations.filter(
      (d) => d.receiptStatus === 'pending'
    ).length;

    const recurringDonorIds = new Set(
      confirmedDonations.filter((d) => d.isRecurring).map((d) => d.donorId)
    );
    const recurringDonors = recurringDonorIds.size;

    return { totalDonations, averageGift, receiptsPending, recurringDonors };
  }, [confirmedDonations]);

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

  const matchesFilters = useCallback(
    (don: DonationRecord) => {
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
    },
    [searchTerm, methodFilter, receiptFilter]
  );

  useEffect(() => {
    const optimistic = donations.find((d) => isOptimisticDonation(d.id));
    if (optimistic) pendingDonationIdRef.current = optimistic.id;
  }, [donations]);

  const filteredData = useMemo(() => {
    const optimistic = donations.filter((d) => isOptimisticDonation(d.id));
    const rest = donations.filter((d) => !isOptimisticDonation(d.id));
    const filtered = rest.filter(matchesFilters);
    return [...optimistic, ...filtered];
  }, [donations, matchesFilters]);

  const emptyMessage = useMemo(() => {
    if (isLoading) return t('common.loading', 'Loading...');
    if (donations.length === 0 && !hasActiveFilters) {
      return t('financials.donations.noDonationsYet', 'No donations recorded yet');
    }
    return t('financials.donations.noDonations', 'No donations match your filters');
  }, [donations.length, hasActiveFilters, isLoading, t]);

  const showEmptyAction = donations.length === 0 && !hasActiveFilters && !isLoading;

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
        render: (row) =>
          isOptimisticDonation(row.id) ? (
            <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
              {t('financials.transactions.saving', 'Saving…')}
            </span>
          ) : (
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

  const getRowClassName = useCallback(
    (row: DonationRecord) => {
      if (isOptimisticDonation(row.id)) {
        return 'opacity-70 animate-pulse bg-blue-50/60 dark:bg-blue-950/30';
      }
      if (highlightedId === row.id) {
        return 'bg-emerald-50 dark:bg-emerald-950/40 ring-1 ring-inset ring-emerald-200/80 dark:ring-emerald-800/60';
      }
      return '';
    },
    [highlightedId]
  );

  return (
    <div className="space-y-6">
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

      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <FilterBar
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder={t('financials.donations.searchPlaceholder')}
            filters={filters}
          />
        </div>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-white text-sm font-semibold hover:bg-secondary-dark transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          {t('financials.addDonation.title', 'Add Donation')}
        </button>
      </div>

      {createTransaction.isPending && createTransaction.variables ? (
        <p
          className="text-xs text-blue-600 dark:text-blue-400 -mt-4"
          role="status"
          aria-live="polite"
        >
          {t('financials.donations.addingBanner', 'Adding donation…')}
        </p>
      ) : null}

      <DataTable<DonationRecord>
        columns={columns}
        data={filteredData}
        getRowKey={(row) => row.id}
        getRowClassName={getRowClassName}
        emptyMessage={emptyMessage}
        emptyActionLabel={
          showEmptyAction
            ? t('financials.addDonation.addFirst', 'Add your first donation')
            : undefined
        }
        onEmptyAction={showEmptyAction ? () => setIsModalOpen(true) : undefined}
      />

      <AddTransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreate}
        preset="donation"
      />
    </div>
  );
};

export default DonationsTab;
