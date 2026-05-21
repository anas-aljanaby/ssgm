import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Plus } from 'lucide-react';
import { useLocalization } from '../../../hooks/useLocalization';
import { useToast } from '../../../hooks/useToast';
import { formatCurrency, formatDate } from '../../../lib/utils';
import DataTable, { type Column } from './shared/DataTable';
import FilterBar, { type FilterDef } from './shared/FilterBar';
import StatusBadge from './shared/StatusBadge';
import AddTransactionModal, { type TransactionFormData } from './AddTransactionModal';
import {
  useTransactions,
  useCreateTransaction,
  useDeleteTransaction,
  isOptimisticTransaction,
} from '../../../hooks/useTransactions';
import TransactionRowActions from './TransactionRowActions';
import type {
  FinancialTransaction,
  TransactionCategory,
  TransactionDirection,
  TransactionStatus,
} from '../../../types/financials';

const TRANSACTION_STATUSES: TransactionStatus[] = [
  'draft',
  'posted',
];

const TRANSACTION_DIRECTIONS: TransactionDirection[] = ['inflow', 'outflow'];

const TRANSACTION_CATEGORIES: TransactionCategory[] = [
  'donation',
  'grant_income',
  'sponsorship_income',
  'investment_income',
  'other_income',
  'project_expense',
  'operational_expense',
  'disbursement',
  'payroll',
  'procurement',
  'refund',
];

const HIGHLIGHT_MS = 2200;

const TransactionsTab: React.FC = () => {
  const { t, language } = useLocalization();
  const toast = useToast();
  const { data: transactions = [], isLoading } = useTransactions();
  const createTransaction = useCreateTransaction();
  const deleteTransaction = useDeleteTransaction();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [directionFilter, setDirectionFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
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

  const handleCreate = useCallback(
    (data: TransactionFormData) => {
      createTransaction.mutate(data, {
        onSuccess: (txn) => {
          toast.showSuccess(t('financials.transactions.addSuccess', 'Transaction added'));
          flashHighlight(txn.id);
        },
        onError: () => {
          toast.showError(
            t('financials.transactions.addFailed', 'Unable to add transaction. Please try again.')
          );
        },
      });
    },
    [createTransaction, flashHighlight, t, toast]
  );

  const handleDelete = useCallback(
    (id: string, status: TransactionStatus) => {
      if (isOptimisticTransaction(id)) return;
      if (status !== 'draft') {
        toast.showError(
          t(
            'financials.transactions.deleteDraftOnly',
            'Only draft transactions can be deleted in MVP mode.'
          )
        );
        return;
      }
      deleteTransaction.mutate(id, {
        onSuccess: () => {
          toast.showSuccess(t('financials.transactions.deleteSuccess', 'Transaction deleted'));
        },
        onError: () => {
          toast.showError(
            t(
              'financials.transactions.deleteFailed',
              'Unable to delete transaction. Please try again.'
            )
          );
        },
      });
    },
    [deleteTransaction, t, toast]
  );

  const filters: FilterDef[] = useMemo(
    () => [
      {
        key: 'status',
        label: t('financials.transactions.allStatuses'),
        options: TRANSACTION_STATUSES.map((s) => ({
          value: s,
          label: t(`financials.status.${s}`),
        })),
        value: statusFilter,
        onChange: setStatusFilter,
      },
      {
        key: 'direction',
        label: t('financials.transactions.allDirections'),
        options: TRANSACTION_DIRECTIONS.map((d) => ({
          value: d,
          label: t(`financials.transactions.${d}`),
        })),
        value: directionFilter,
        onChange: setDirectionFilter,
      },
      {
        key: 'category',
        label: t('financials.transactions.allCategories'),
        options: TRANSACTION_CATEGORIES.map((c) => ({
          value: c,
          label: t(`financials.category.${c}`),
        })),
        value: categoryFilter,
        onChange: setCategoryFilter,
      },
    ],
    [t, statusFilter, directionFilter, categoryFilter]
  );

  const matchesFilters = useCallback(
    (txn: FinancialTransaction) => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesDescription =
          txn.description.en?.toLowerCase().includes(term) ||
          txn.description.ar?.includes(term);
        const matchesReference = txn.reference.toLowerCase().includes(term);
        const matchesEntity = txn.relatedEntityName?.toLowerCase().includes(term);
        if (!matchesDescription && !matchesReference && !matchesEntity) {
          return false;
        }
      }
      if (statusFilter && txn.status !== statusFilter) return false;
      if (directionFilter && txn.direction !== directionFilter) return false;
      if (categoryFilter && txn.category !== categoryFilter) return false;
      return true;
    },
    [searchTerm, statusFilter, directionFilter, categoryFilter]
  );

  const filteredData = useMemo(() => {
    const optimistic = transactions.filter((txn) => isOptimisticTransaction(txn.id));
    const rest = transactions.filter((txn) => !isOptimisticTransaction(txn.id));
    const filtered = rest.filter(matchesFilters);
    return [...optimistic, ...filtered];
  }, [transactions, matchesFilters]);

  const columns: Column<FinancialTransaction>[] = useMemo(
    () => [
      {
        key: 'date',
        label: t('financials.transactions.date'),
        sortable: true,
        render: (row) => (
          <span className="text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
            {formatDate(row.date, language, 'medium')}
          </span>
        ),
      },
      {
        key: 'reference',
        label: t('financials.transactions.reference'),
        render: (row) => (
          <span className="font-mono text-xs text-gray-700 dark:text-gray-300">
            {row.reference}
          </span>
        ),
      },
      {
        key: 'description',
        label: t('financials.transactions.description'),
        render: (row) => {
          const desc =
            row.description[language]?.trim() ||
            row.description[language === 'en' ? 'ar' : 'en']?.trim() ||
            '—';
          return (
            <span className="text-sm text-foreground dark:text-dark-foreground">{desc}</span>
          );
        },
      },
      {
        key: 'category',
        label: t('financials.transactions.category'),
        render: (row) => <StatusBadge status={row.category} />,
      },
      {
        key: 'direction',
        label: t('financials.transactions.direction'),
        render: (row) =>
          row.direction === 'inflow' ? (
            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
              <span>&#8593;</span>
              {t('financials.transactions.inflow')}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 text-sm font-medium">
              <span>&#8595;</span>
              {t('financials.transactions.outflow')}
            </span>
          ),
      },
      {
        key: 'amount',
        label: t('financials.transactions.amount'),
        sortable: true,
        align: 'right',
        render: (row) => (
          <span
            className={`text-sm font-semibold whitespace-nowrap ${
              row.direction === 'inflow'
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-red-600 dark:text-red-400'
            }`}
          >
            {row.direction === 'inflow' ? '+' : '-'}
            {formatCurrency(row.amount, language)}
          </span>
        ),
      },
      {
        key: 'status',
        label: t('financials.transactions.status'),
        render: (row) =>
          isOptimisticTransaction(row.id) ? (
            <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
              {t('financials.transactions.saving', 'Saving…')}
            </span>
          ) : (
            <StatusBadge status={row.status} />
          ),
      },
      {
        key: 'relatedEntityName',
        label: t('financials.transactions.relatedEntity', 'Related Entity'),
        render: (row) => (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {row.relatedEntityName || '—'}
          </span>
        ),
      },
      {
        key: 'actions',
        label: t('financials.common.actions', 'Actions'),
        align: 'right',
        render: (row) =>
          isOptimisticTransaction(row.id) || row.status !== 'draft' ? (
            <span className="text-xs text-gray-400 dark:text-gray-500">—</span>
          ) : (
            <TransactionRowActions
              transaction={row}
              isDeleting={
                deleteTransaction.isPending && deleteTransaction.variables === row.id
              }
              onDelete={() => handleDelete(row.id, row.status)}
            />
          ),
      },
    ],
    [t, language, deleteTransaction.isPending, deleteTransaction.variables, handleDelete]
  );

  const getRowClassName = useCallback(
    (row: FinancialTransaction) => {
      if (isOptimisticTransaction(row.id)) {
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
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <FilterBar
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder={t('financials.transactions.searchPlaceholder')}
            filters={filters}
          />
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-white text-sm font-semibold hover:bg-secondary-dark transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          {t('financials.addTransaction.title', 'Add Transaction')}
        </button>
      </div>

      {createTransaction.isPending && createTransaction.variables ? (
        <p
          className="text-xs text-blue-600 dark:text-blue-400 -mt-2"
          role="status"
          aria-live="polite"
        >
          {t('financials.transactions.addingBanner', 'Adding transaction…')}
        </p>
      ) : null}

      <DataTable<FinancialTransaction>
        columns={columns}
        data={filteredData}
        getRowKey={(row) => row.id}
        getRowClassName={getRowClassName}
        emptyMessage={
          isLoading
            ? t('common.loading', 'Loading...')
            : t('financials.transactions.noTransactions')
        }
      />

      <AddTransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreate}
      />
    </div>
  );
};

export default TransactionsTab;
