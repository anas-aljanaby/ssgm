import React, { useState, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { useLocalization } from '../../../hooks/useLocalization';
import { formatCurrency, formatDate } from '../../../lib/utils';
import DataTable, { type Column } from './shared/DataTable';
import FilterBar, { type FilterDef } from './shared/FilterBar';
import StatusBadge from './shared/StatusBadge';
import AddTransactionModal from './AddTransactionModal';
import { useTransactions, useCreateTransaction } from '../../../hooks/useTransactions';
import type {
  FinancialTransaction,
  TransactionCategory,
  TransactionDirection,
  TransactionStatus,
} from '../../../types/financials';

const TRANSACTION_STATUSES: TransactionStatus[] = [
  'draft',
  'pending',
  'approved',
  'posted',
  'reconciled',
  'voided',
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

const TransactionsTab: React.FC = () => {
  const { t, language } = useLocalization();
  const { data: transactions = [], isLoading } = useTransactions();
  const createTransaction = useCreateTransaction();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [directionFilter, setDirectionFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const filteredData = useMemo(() => {
    return transactions.filter((txn) => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesDescription =
          txn.description.en.toLowerCase().includes(term) ||
          txn.description.ar.includes(term);
        const matchesReference = txn.reference.toLowerCase().includes(term);
        const matchesEntity = txn.relatedEntityName
          ?.toLowerCase()
          .includes(term);
        if (!matchesDescription && !matchesReference && !matchesEntity) {
          return false;
        }
      }
      if (statusFilter && txn.status !== statusFilter) return false;
      if (directionFilter && txn.direction !== directionFilter) return false;
      if (categoryFilter && txn.category !== categoryFilter) return false;
      return true;
    });
  }, [transactions, searchTerm, statusFilter, directionFilter, categoryFilter]);

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
        render: (row) => (
          <span className="text-sm text-foreground dark:text-dark-foreground">
            {row.description[language]}
          </span>
        ),
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
        render: (row) => <StatusBadge status={row.status} />,
      },
      {
        key: 'relatedEntityName',
        label: t('financials.transactions.relatedEntity'),
        render: (row) => (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {row.relatedEntityName || '—'}
          </span>
        ),
      },
    ],
    [t, language]
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

      <DataTable<FinancialTransaction>
        columns={columns}
        data={filteredData}
        emptyMessage={
          isLoading
            ? t('common.loading', 'Loading...')
            : t('financials.transactions.noTransactions')
        }
      />

      <AddTransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={(data) => createTransaction.mutate(data)}
      />
    </div>
  );
};

export default TransactionsTab;
