import React, { useState, useMemo } from 'react';
import {
  Target,
  DollarSign,
  TrendingUp,
  TrendingDown,
  PieChart,
  Plus,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { useLocalization } from '../../../hooks/useLocalization';
import { useToast } from '../../../hooks/useToast';
import { formatCurrency } from '../../../lib/utils';
import StatusBadge from './shared/StatusBadge';
import FinancialKpiCard from './shared/FinancialKpiCard';
import DataTable, { type Column } from './shared/DataTable';
import { useBudgets, useCreateBudget } from '../../../hooks/useBudgets';
import type { BudgetLine } from '../../../types/financials';
import ModalPortal from '../../common/ModalPortal';

const BudgetsTab: React.FC = () => {
  const { t, language } = useLocalization();
  const { showSuccess, showError } = useToast();
  const { data: budgets = [] } = useBudgets();
  const createBudget = useCreateBudget();
  const [selectedBudgetId, setSelectedBudgetId] = useState<string>(
    ''
  );
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [projectNameEn, setProjectNameEn] = useState('');
  const [projectNameAr, setProjectNameAr] = useState('');
  const [fiscalYear, setFiscalYear] = useState(() => `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`);
  const [totalPlanned, setTotalPlanned] = useState('');
  const [currency, setCurrency] = useState('USD');

  const normalizedSelectedBudgetId = selectedBudgetId || budgets[0]?.id || '';
  const selectedBudget = useMemo(
    () => budgets.find((b) => b.id === normalizedSelectedBudgetId) ?? budgets[0],
    [normalizedSelectedBudgetId, budgets]
  );

  // ─── KPI Computations ───────────────────────────────────────────────
  const kpis = useMemo(() => {
    if (!selectedBudget) {
      return { totalPlanned: 0, totalActual: 0, variance: 0, utilization: 0, isOverBudget: false };
    }

    const totalPlanned = selectedBudget.totalPlanned;
    const totalActual = selectedBudget.totalActual;
    const variance = totalPlanned - totalActual;
    const utilization = totalPlanned > 0 ? (totalActual / totalPlanned) * 100 : 0;
    const isOverBudget = totalActual > totalPlanned;

    return { totalPlanned, totalActual, variance, utilization, isOverBudget };
  }, [selectedBudget]);

  // ─── Chart Data ─────────────────────────────────────────────────────
  const chartData = useMemo(() => {
    if (!selectedBudget) return [];
    return selectedBudget.lines.map((line) => ({
      category: line.accountName[language],
      planned: line.planned,
      actual: line.actual,
    }));
  }, [selectedBudget, language]);

  // ─── Custom Tooltip ─────────────────────────────────────────────────
  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: Array<{ value: number; dataKey: string; color: string }>;
    label?: string;
  }) => {
    if (!active || !payload || payload.length === 0) return null;

    const planned = payload.find((p) => p.dataKey === 'planned')?.value ?? 0;
    const actual = payload.find((p) => p.dataKey === 'actual')?.value ?? 0;
    const variance = planned - actual;

    return (
      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 shadow-lg">
        <p className="text-sm font-medium text-foreground dark:text-dark-foreground mb-1">
          {label}
        </p>
        <p className="text-xs text-blue-600 dark:text-blue-400">
          {t('financials.budgets.planned')}: {formatCurrency(planned, language)}
        </p>
        <p className="text-xs text-emerald-600 dark:text-emerald-400">
          {t('financials.budgets.actual')}: {formatCurrency(actual, language)}
        </p>
        <p
          className={`text-xs font-medium mt-1 ${
            variance >= 0
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-red-600 dark:text-red-400'
          }`}
        >
          {t('financials.budgets.variance')}: {formatCurrency(variance, language)}
        </p>
      </div>
    );
  };

  // ─── Table Columns ──────────────────────────────────────────────────
  const columns: Column<BudgetLine & Record<string, unknown>>[] = useMemo(
    () => [
      {
        key: 'accountName',
        label: t('financials.budgets.category'),
        render: (row) => (
          <span className="font-medium text-foreground dark:text-dark-foreground">
            {row.accountName[language]}
          </span>
        ),
      },
      {
        key: 'planned',
        label: t('financials.budgets.planned'),
        sortable: true,
        align: 'right' as const,
        render: (row) => formatCurrency(row.planned, language),
      },
      {
        key: 'committed',
        label: t('financials.budgets.committed'),
        align: 'right' as const,
        render: (row) => formatCurrency(row.committed, language),
      },
      {
        key: 'actual',
        label: t('financials.budgets.actual'),
        sortable: true,
        align: 'right' as const,
        render: (row) => formatCurrency(row.actual, language),
      },
      {
        key: 'available',
        label: t('financials.budgets.available'),
        align: 'right' as const,
        render: (row) => {
          const available = row.planned - row.actual - row.committed;
          return (
            <span
              className={
                available >= 0
                  ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                  : 'text-red-600 dark:text-red-400 font-medium'
              }
            >
              {formatCurrency(available, language)}
            </span>
          );
        },
      },
      {
        key: 'variancePercent',
        label: t('financials.budgets.variancePercent'),
        align: 'right' as const,
        render: (row) => {
          const utilizationPct = row.planned > 0 ? (row.actual / row.planned) * 100 : 0;
          const clampedWidth = Math.min(utilizationPct, 100);

          let barColor = 'bg-emerald-500 dark:bg-emerald-400';
          if (utilizationPct > 100) {
            barColor = 'bg-red-500 dark:bg-red-400';
          } else if (utilizationPct >= 80) {
            barColor = 'bg-amber-500 dark:bg-amber-400';
          }

          let textColor = 'text-emerald-600 dark:text-emerald-400';
          if (utilizationPct > 100) {
            textColor = 'text-red-600 dark:text-red-400';
          } else if (utilizationPct >= 80) {
            textColor = 'text-amber-600 dark:text-amber-400';
          }

          return (
            <div className="flex items-center gap-2 justify-end">
              <span className={`text-xs font-medium ${textColor}`}>
                {utilizationPct.toFixed(1)}%
              </span>
              <div className="w-16 h-1.5 rounded-full bg-gray-200 dark:bg-slate-700 overflow-hidden">
                <div
                  className={`h-full rounded-full ${barColor} transition-all duration-300`}
                  style={{ width: `${clampedWidth}%` }}
                />
              </div>
            </div>
          );
        },
      },
    ],
    [t, language]
  );

  // Cast budget lines to satisfy DataTable's Record<string, unknown> constraint
  const tableData = useMemo(
    () =>
      (selectedBudget?.lines ?? []) as unknown as (BudgetLine &
        Record<string, unknown>)[],
    [selectedBudget]
  );

  const resetCreateForm = () => {
    setProjectNameEn('');
    setProjectNameAr('');
    setFiscalYear(`${new Date().getFullYear()}-${new Date().getFullYear() + 1}`);
    setTotalPlanned('');
    setCurrency('USD');
  };

  const handleCreateBudget = async () => {
    const plannedAmount = Number(totalPlanned);
    if (!projectNameEn.trim() || !fiscalYear.trim() || !Number.isFinite(plannedAmount) || plannedAmount < 0) {
      showError(t('common.error', 'Error'));
      return;
    }

    try {
      const created = await createBudget.mutateAsync({
        projectNameEn: projectNameEn.trim(),
        projectNameAr: projectNameAr.trim(),
        fiscalYear: fiscalYear.trim(),
        totalPlanned: plannedAmount,
        currency,
        status: 'draft',
      });
      setSelectedBudgetId(created.id);
      setIsCreateOpen(false);
      resetCreateForm();
      showSuccess(t('financials.budgets.createSuccess', 'Budget created'));
    } catch (error) {
      showError(error instanceof Error ? error.message : t('common.error', 'Error'));
    }
  };

  if (!selectedBudget) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-end">
          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            {t('financials.budgets.createBudget', 'Create Budget')}
          </button>
        </div>
        <div className="text-center py-12 text-gray-400 dark:text-gray-500">
          {t('financials.budgets.noBudgets')}
        </div>

        <ModalPortal
          isOpen={isCreateOpen}
          onClose={() => {
            if (!createBudget.isPending) setIsCreateOpen(false);
          }}
          overlayClassName="fixed inset-0 bg-black/40 modal-overlay animate-fade-in"
        >
          <div
            className="w-full max-w-xl rounded-xl border border-gray-200 bg-card p-5 dark:border-slate-700/50 dark:bg-dark-card"
            onClick={(e) => e.stopPropagation()}
          >
              <h3 className="mb-4 text-base font-semibold text-foreground dark:text-dark-foreground">
                {t('financials.budgets.createBudget', 'Create Budget')}
              </h3>
              <div className="space-y-3">
                <input
                  value={projectNameEn}
                  onChange={(e) => setProjectNameEn(e.target.value)}
                  placeholder={t('financials.budgets.projectNameEn', 'Project Name (EN)')}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
                />
                <input
                  value={projectNameAr}
                  onChange={(e) => setProjectNameAr(e.target.value)}
                  placeholder={t('financials.budgets.projectNameAr', 'Project Name (AR)')}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
                />
                <div className="grid grid-cols-3 gap-3">
                  <input
                    value={fiscalYear}
                    onChange={(e) => setFiscalYear(e.target.value)}
                    placeholder={t('financials.budgets.fiscalYear', 'Fiscal Year')}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
                  />
                  <input
                    value={totalPlanned}
                    onChange={(e) => setTotalPlanned(e.target.value)}
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder={t('financials.budgets.totalPlanned', 'Total Planned')}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
                  />
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="SAR">SAR</option>
                    <option value="AED">AED</option>
                  </select>
                </div>
              </div>
              <div className="mt-5 flex justify-end gap-2">
                <button
                  onClick={() => {
                    if (!createBudget.isPending) setIsCreateOpen(false);
                  }}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-slate-600 dark:text-gray-300 dark:hover:bg-slate-800"
                >
                  {t('common.cancel', 'Cancel')}
                </button>
                <button
                  onClick={handleCreateBudget}
                  disabled={createBudget.isPending}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-60"
                >
                  {createBudget.isPending
                    ? t('common.loading', 'Loading...')
                    : t('financials.budgets.createBudget', 'Create Budget')}
                </button>
              </div>
            </div>
        </ModalPortal>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Budget Selector ────────────────────────────────────────── */}
      <div className="flex items-end justify-between gap-3">
        <div>
          <label
            htmlFor="budget-select"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
          >
            {t('financials.budgets.selectProject')}
          </label>
          <select
            id="budget-select"
            value={normalizedSelectedBudgetId}
            onChange={(e) => setSelectedBudgetId(e.target.value)}
            className="w-full min-w-[18rem] max-w-md rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-foreground dark:text-dark-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors"
          >
            {budgets.map((budget) => (
              <option key={budget.id} value={budget.id}>
                {budget.projectName[language]} — {budget.fiscalYear}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          {t('financials.budgets.createBudget', 'Create Budget')}
        </button>
      </div>

      {/* ── KPI Cards ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <FinancialKpiCard
          title={t('financials.budgets.totalPlanned')}
          value={formatCurrency(kpis.totalPlanned, language)}
          icon={Target}
          colorClass="text-blue-600 dark:text-blue-400"
          bgClass="bg-blue-100 dark:bg-blue-900/30"
        />
        <FinancialKpiCard
          title={t('financials.budgets.totalActual')}
          value={formatCurrency(kpis.totalActual, language)}
          icon={DollarSign}
          colorClass={
            kpis.isOverBudget
              ? 'text-red-600 dark:text-red-400'
              : 'text-emerald-600 dark:text-emerald-400'
          }
          bgClass={
            kpis.isOverBudget
              ? 'bg-red-100 dark:bg-red-900/30'
              : 'bg-emerald-100 dark:bg-emerald-900/30'
          }
        />
        <FinancialKpiCard
          title={t('financials.budgets.variance')}
          value={formatCurrency(kpis.variance, language)}
          icon={kpis.variance >= 0 ? TrendingUp : TrendingDown}
          colorClass={
            kpis.variance >= 0
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-red-600 dark:text-red-400'
          }
          bgClass={
            kpis.variance >= 0
              ? 'bg-emerald-100 dark:bg-emerald-900/30'
              : 'bg-red-100 dark:bg-red-900/30'
          }
        />
        <FinancialKpiCard
          title={t('financials.budgets.utilization')}
          value={`${kpis.utilization.toFixed(1)}%`}
          icon={PieChart}
          colorClass="text-amber-600 dark:text-amber-400"
          bgClass="bg-amber-100 dark:bg-amber-900/30"
        />
      </div>

      {/* ── Budget vs Actuals Chart ────────────────────────────────── */}
      <div className="bg-card dark:bg-dark-card rounded-xl border border-gray-200 dark:border-slate-700/50 p-4">
        <h3 className="text-sm font-semibold text-foreground dark:text-dark-foreground mb-4">
          {t('financials.budgets.budgetVsActuals')}
        </h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="currentColor"
                className="text-gray-200 dark:text-slate-700"
              />
              <XAxis
                dataKey="category"
                tick={{ fontSize: 12 }}
                className="text-gray-500 dark:text-gray-400"
              />
              <YAxis
                tick={{ fontSize: 12 }}
                className="text-gray-500 dark:text-gray-400"
                tickFormatter={(value: number) => formatCurrency(value, language)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: '12px' }}
                formatter={(value: string) =>
                  value === 'planned'
                    ? t('financials.budgets.planned')
                    : t('financials.budgets.actual')
                }
              />
              <Bar
                dataKey="planned"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
                name="planned"
              />
              <Bar
                dataKey="actual"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
                name="actual"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Budget Lines Table ─────────────────────────────────────── */}
      <DataTable
        columns={columns}
        data={tableData}
        emptyMessage={t('financials.budgets.noBudgets')}
      />

      <ModalPortal
        isOpen={isCreateOpen}
        onClose={() => {
          if (!createBudget.isPending) setIsCreateOpen(false);
        }}
        overlayClassName="fixed inset-0 bg-black/40 modal-overlay animate-fade-in"
      >
        <div
          className="w-full max-w-xl rounded-xl border border-gray-200 bg-card p-5 dark:border-slate-700/50 dark:bg-dark-card"
          onClick={(e) => e.stopPropagation()}
        >
            <h3 className="mb-4 text-base font-semibold text-foreground dark:text-dark-foreground">
              {t('financials.budgets.createBudget', 'Create Budget')}
            </h3>
            <div className="space-y-3">
              <input
                value={projectNameEn}
                onChange={(e) => setProjectNameEn(e.target.value)}
                placeholder={t('financials.budgets.projectNameEn', 'Project Name (EN)')}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
              />
              <input
                value={projectNameAr}
                onChange={(e) => setProjectNameAr(e.target.value)}
                placeholder={t('financials.budgets.projectNameAr', 'Project Name (AR)')}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
              />
              <div className="grid grid-cols-3 gap-3">
                <input
                  value={fiscalYear}
                  onChange={(e) => setFiscalYear(e.target.value)}
                  placeholder={t('financials.budgets.fiscalYear', 'Fiscal Year')}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
                />
                <input
                  value={totalPlanned}
                  onChange={(e) => setTotalPlanned(e.target.value)}
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder={t('financials.budgets.totalPlanned', 'Total Planned')}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
                />
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="SAR">SAR</option>
                  <option value="AED">AED</option>
                </select>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => {
                  if (!createBudget.isPending) setIsCreateOpen(false);
                }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-slate-600 dark:text-gray-300 dark:hover:bg-slate-800"
              >
                {t('common.cancel', 'Cancel')}
              </button>
              <button
                onClick={handleCreateBudget}
                disabled={createBudget.isPending}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-60"
              >
                {createBudget.isPending
                  ? t('common.loading', 'Loading...')
                  : t('financials.budgets.createBudget', 'Create Budget')}
              </button>
            </div>
        </div>
      </ModalPortal>
    </div>
  );
};

export default BudgetsTab;
