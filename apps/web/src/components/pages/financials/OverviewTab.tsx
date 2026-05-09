import React, { useMemo } from 'react';
import { useLocalization } from '../../../hooks/useLocalization';
import { formatCurrency } from '../../../lib/utils';
import FinancialKpiCard from './shared/FinancialKpiCard';
import StatusBadge from './shared/StatusBadge';
import {
  MOCK_MONTHLY_DATA,
  MOCK_TRANSACTIONS,
  MOCK_PLEDGES,
  MOCK_ALERTS,
  MOCK_FUNDS,
} from '../../../data/financialsPageData';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import {
  DollarSign,
  TrendingDown,
  TrendingUp,
  Clock,
  AlertTriangle,
  AlertCircle,
  Info,
} from 'lucide-react';

const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const FUND_TYPE_COLORS: Record<string, string> = {
  unrestricted: '#10b981',
  temporarily_restricted: '#f59e0b',
  permanently_restricted: '#3b82f6',
};

const ALERT_BORDER_COLORS: Record<string, string> = {
  danger: 'border-red-500',
  warning: 'border-amber-500',
  info: 'border-blue-500',
};

const ALERT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  danger: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const ALERT_ICON_COLORS: Record<string, string> = {
  danger: 'text-red-500',
  warning: 'text-amber-500',
  info: 'text-blue-500',
};

const truncateFundLabel = (label: string, isArabic: boolean) => {
  const maxLength = isArabic ? 18 : 20;
  if (label.length <= maxLength) return label;
  return `${label.slice(0, maxLength)}...`;
};

const OverviewTab: React.FC = () => {
  const { t, language } = useLocalization(['common', 'financials']);
  const isArabic = language === 'ar';

  const chartData = useMemo(
    () =>
      MOCK_MONTHLY_DATA.map((d) => ({
        month: MONTH_ABBR[parseInt(d.month.split('-')[1], 10) - 1],
        revenue: d.revenue,
        expenses: d.expenses,
      })),
    []
  );

  const totalRevenue = useMemo(
    () => MOCK_MONTHLY_DATA.reduce((sum, d) => sum + d.revenue, 0),
    []
  );

  const totalExpenses = useMemo(
    () => MOCK_MONTHLY_DATA.reduce((sum, d) => sum + d.expenses, 0),
    []
  );

  const netIncome = useMemo(() => totalRevenue - totalExpenses, [totalRevenue, totalExpenses]);

  const outstandingPledges = useMemo(
    () =>
      MOCK_PLEDGES.filter(
        (p) => p.status === 'active' || p.status === 'overdue' || p.status === 'partially_fulfilled'
      ).reduce((sum, p) => sum + (p.totalAmount - p.paidAmount), 0),
    []
  );

  const recentTransactions = useMemo(() => MOCK_TRANSACTIONS.slice(0, 5), []);

  const fundChartData = useMemo(
    () =>
      MOCK_FUNDS.map((f) => ({
        name: language === 'ar' ? f.name.ar : f.name.en,
        chartLabel: truncateFundLabel(language === 'ar' ? f.name.ar : f.name.en, language === 'ar'),
        balance: f.balance,
        type: f.type,
        fill: FUND_TYPE_COLORS[f.type] || '#6b7280',
      })),
    [language]
  );

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload) return null;
    return (
      <div className="bg-card dark:bg-dark-card border border-gray-200 dark:border-slate-700 rounded-lg p-3 shadow-lg">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</p>
        {payload.map((entry: any, idx: number) => (
          <p key={idx} className="text-sm font-semibold" style={{ color: entry.color }}>
            {entry.name}: {formatCurrency(entry.value, language)}
          </p>
        ))}
      </div>
    );
  };

  const getTransactionDescription = (desc: { en: string; ar: string }) =>
    language === 'ar' ? desc.ar : desc.en;

  const getAlertMessage = (msg: { en: string; ar: string }) =>
    language === 'ar' ? msg.ar : msg.en;

  return (
    <div className="space-y-6">
      {/* Row 1: KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <FinancialKpiCard
          title={t('financials.overview.totalRevenue', 'Total Revenue YTD')}
          value={formatCurrency(totalRevenue, language)}
          icon={DollarSign}
          colorClass="text-emerald-600 dark:text-emerald-400"
          bgClass="bg-emerald-50 dark:bg-emerald-900/20"
          trend={{ value: 12.3, isPositive: true }}
        />
        <FinancialKpiCard
          title={t('financials.overview.totalExpenses', 'Total Expenses YTD')}
          value={formatCurrency(totalExpenses, language)}
          icon={TrendingDown}
          colorClass="text-orange-600 dark:text-orange-400"
          bgClass="bg-orange-50 dark:bg-orange-900/20"
          trend={{ value: 5.1, isPositive: false }}
        />
        <FinancialKpiCard
          title={t('financials.overview.netIncome', 'Net Income')}
          value={formatCurrency(netIncome, language)}
          icon={TrendingUp}
          colorClass={netIncome >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}
          bgClass={netIncome >= 0 ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-red-50 dark:bg-red-900/20'}
        />
        <FinancialKpiCard
          title={t('financials.overview.outstandingPledges', 'Outstanding Pledges')}
          value={formatCurrency(outstandingPledges, language)}
          icon={Clock}
          colorClass="text-amber-600 dark:text-amber-400"
          bgClass="bg-amber-50 dark:bg-amber-900/20"
        />
      </div>

      {/* Row 2: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue vs Expenses Area Chart */}
        <div className="bg-card dark:bg-dark-card rounded-xl border border-gray-200 dark:border-slate-700/50 p-6">
          <h3 className="text-sm font-semibold text-foreground dark:text-dark-foreground mb-4">
            {t('financials.overview.revenueVsExpenses', 'Revenue vs Expenses')}
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expensesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12, fill: '#9ca3af' }}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name={t('financials.overview.revenue', 'Revenue')}
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#revenueGradient)"
                />
                <Area
                  type="monotone"
                  dataKey="expenses"
                  name={t('financials.overview.expenses', 'Expenses')}
                  stroke="#f97316"
                  strokeWidth={2}
                  fill="url(#expensesGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Fund Balances Bar Chart */}
        <div className="bg-card dark:bg-dark-card rounded-xl border border-gray-200 dark:border-slate-700/50 p-6">
          <h3 className="text-sm font-semibold text-foreground dark:text-dark-foreground mb-4">
            {t('financials.overview.fundBalances', 'Fund Balances')}
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={fundChartData}
                layout="vertical"
                margin={isArabic ? { top: 5, right: 36, left: 24, bottom: 0 } : { top: 5, right: 28, left: 18, bottom: 0 }}
                barCategoryGap={14}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 12, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  reversed={isArabic}
                />
                <YAxis
                  type="category"
                  dataKey="chartLabel"
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                  width={isArabic ? 190 : 150}
                  orientation={isArabic ? 'right' : 'left'}
                  tickMargin={isArabic ? 14 : 10}
                  interval={0}
                />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ fill: 'rgba(107, 114, 128, 0.1)' }}
                />
                <Bar
                  dataKey="balance"
                  name={t('financials.overview.balance', 'Balance')}
                  radius={isArabic ? [4, 0, 0, 4] : [0, 4, 4, 0]}
                  barSize={24}
                >
                  {fundChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Legend */}
          <div className="flex flex-wrap gap-4 mt-3 pt-3 border-t border-gray-100 dark:border-slate-700/50">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-emerald-500" />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {t('financials.overview.unrestricted', 'Unrestricted')}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-amber-500" />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {t('financials.overview.tempRestricted', 'Temporarily Restricted')}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-blue-500" />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {t('financials.overview.permRestricted', 'Permanently Restricted')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Recent Transactions & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <div className="bg-card dark:bg-dark-card rounded-xl border border-gray-200 dark:border-slate-700/50 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground dark:text-dark-foreground">
              {t('financials.overview.recentTransactions', 'Recent Transactions')}
            </h3>
            <button className="text-xs text-primary dark:text-secondary hover:underline font-medium">
              {t('financials.overview.viewAll', 'View All')}
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-slate-700/50">
                  <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 pb-2">
                    {t('financials.overview.date', 'Date')}
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 pb-2">
                    {t('financials.overview.description', 'Description')}
                  </th>
                  <th className="text-right text-xs font-medium text-gray-500 dark:text-gray-400 pb-2">
                    {t('financials.overview.amount', 'Amount')}
                  </th>
                  <th className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 pb-2">
                    {t('financials.overview.status', 'Status')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((txn) => (
                  <tr
                    key={txn.id}
                    className="border-b border-gray-50 dark:border-slate-800 last:border-0 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="py-2.5 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {txn.date}
                    </td>
                    <td className="py-2.5 text-sm text-foreground dark:text-dark-foreground max-w-[200px] truncate">
                      {getTransactionDescription(txn.description)}
                    </td>
                    <td
                      className={`py-2.5 text-sm font-semibold text-right whitespace-nowrap ${
                        txn.direction === 'inflow'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {txn.direction === 'inflow' ? '+' : '-'}
                      {formatCurrency(txn.amount, language)}
                    </td>
                    <td className="py-2.5 text-center">
                      <StatusBadge status={txn.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Financial Alerts */}
        <div className="bg-card dark:bg-dark-card rounded-xl border border-gray-200 dark:border-slate-700/50 p-6">
          <h3 className="text-sm font-semibold text-foreground dark:text-dark-foreground mb-4">
            {t('financials.overview.financialAlerts', 'Financial Alerts')}
          </h3>
          <div className="space-y-3">
            {MOCK_ALERTS.map((alert) => {
              const AlertIcon = ALERT_ICONS[alert.type] || Info;
              return (
                <div
                  key={alert.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border-l-4 bg-gray-50 dark:bg-slate-800/50 ${
                    ALERT_BORDER_COLORS[alert.type] || 'border-gray-300'
                  }`}
                >
                  <AlertIcon
                    className={`w-4 h-4 mt-0.5 flex-shrink-0 ${ALERT_ICON_COLORS[alert.type] || 'text-gray-500'}`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground dark:text-dark-foreground">
                      {getAlertMessage(alert.message)}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500 dark:text-gray-400">{alert.date}</span>
                      {alert.actionRequired && (
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                          {t('financials.overview.actionRequired', 'Action Required')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;
