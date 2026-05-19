import React, { useState, useMemo } from 'react';
import { DollarSign, Clock, Calendar, AlertTriangle } from 'lucide-react';
import { useLocalization } from '../../../hooks/useLocalization';
import { useToast } from '../../../hooks/useToast';
import { formatCurrency, formatDate } from '../../../lib/utils';
import DataTable, { type Column } from './shared/DataTable';
import FilterBar, { type FilterDef } from './shared/FilterBar';
import StatusBadge from './shared/StatusBadge';
import FinancialKpiCard from './shared/FinancialKpiCard';
import { useCreateDisbursement, useDisbursements } from '../../../hooks/useDisbursements';
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
  const { t, language } = useLocalization();
  const { showSuccess, showError } = useToast();
  const { data: disbursements = [] } = useDisbursements();
  const createDisbursement = useCreateDisbursement();

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [beneficiaryNameEn, setBeneficiaryNameEn] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<DisbursementType>('aid_payment');
  const [method, setMethod] = useState<'bank_transfer' | 'cash' | 'mobile_money' | 'voucher'>('bank_transfer');
  const [scheduledDate, setScheduledDate] = useState(() => new Date().toISOString().split('T')[0]);

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
    return disbursements.filter((dis) => {
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
  }, [searchTerm, typeFilter, statusFilter, language, disbursements]);

  const handleCreateDisbursement = async () => {
    const parsedAmount = Number(amount);
    if (!beneficiaryNameEn.trim() || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      showError(t('common.error', 'Error'));
      return;
    }

    try {
      await createDisbursement.mutateAsync({
        beneficiaryNameEn: beneficiaryNameEn.trim(),
        amount: parsedAmount,
        type,
        method,
        scheduledDate,
      });
      showSuccess(t('financials.disbursements.createSuccess', 'Disbursement submitted for approval'));
      setBeneficiaryNameEn('');
      setAmount('');
      setType('aid_payment');
      setMethod('bank_transfer');
      setScheduledDate(new Date().toISOString().split('T')[0]);
      setIsCreateOpen(false);
    } catch (error) {
      showError(error instanceof Error ? error.message : t('common.error', 'Error'));
    }
  };

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
        render: (row) => <StatusBadge status={row.status} />,
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

      {/* Filters */}
      <div className="flex justify-end">
        <button
          onClick={() => setIsCreateOpen(true)}
          disabled={createDisbursement.isPending}
          className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
        >
          {t('financials.disbursements.create', 'Create Disbursement')}
        </button>
      </div>

      <FilterBar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder={t('financials.disbursements.searchPlaceholder')}
        filters={filters}
      />

      {/* Table */}
      <DataTable<Disbursement>
        columns={columns}
        data={filteredData}
        emptyMessage={t('financials.disbursements.noDisbursements')}
      />

      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl border border-gray-200 bg-card p-5 dark:border-slate-700/50 dark:bg-dark-card">
            <h3 className="mb-4 text-base font-semibold text-foreground dark:text-dark-foreground">
              {t('financials.disbursements.create', 'Create Disbursement')}
            </h3>
            <div className="space-y-3">
              <input
                value={beneficiaryNameEn}
                onChange={(e) => setBeneficiaryNameEn(e.target.value)}
                placeholder={t('financials.disbursements.beneficiary', 'Beneficiary')}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
              />
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                type="number"
                min="0"
                step="0.01"
                placeholder={t('financials.disbursements.amount', 'Amount')}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
              />
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as DisbursementType)}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
                >
                  {DISBURSEMENT_TYPES.map((entry) => (
                    <option key={entry} value={entry}>
                      {t(`financials.disbursementType.${entry}`)}
                    </option>
                  ))}
                </select>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value as 'bank_transfer' | 'cash' | 'mobile_money' | 'voucher')}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
                >
                  <option value="bank_transfer">{t('financials.method.bank_transfer')}</option>
                  <option value="cash">{t('financials.method.cash')}</option>
                  <option value="mobile_money">{t('financials.method.mobile_money')}</option>
                  <option value="voucher">{t('financials.method.voucher')}</option>
                </select>
                <input
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  type="date"
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => {
                  if (!createDisbursement.isPending) setIsCreateOpen(false);
                }}
                disabled={createDisbursement.isPending}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:text-gray-300 dark:hover:bg-slate-800"
              >
                {t('common.cancel', 'Cancel')}
              </button>
              <button
                onClick={handleCreateDisbursement}
                disabled={createDisbursement.isPending}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-60"
              >
                {createDisbursement.isPending
                  ? t('common.loading', 'Loading...')
                  : t('financials.disbursements.create', 'Create Disbursement')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DisbursementsTab;
