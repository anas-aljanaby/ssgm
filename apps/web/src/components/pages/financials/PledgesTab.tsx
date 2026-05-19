import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { useLocalization } from '../../../hooks/useLocalization';
import { useToast } from '../../../hooks/useToast';
import { formatCurrency, formatDate } from '../../../lib/utils';
import StatusBadge from './shared/StatusBadge';
import FinancialKpiCard from './shared/FinancialKpiCard';
import type { FinancialPledge } from '../../../types/financials';
import { usePledges, useRecordPledgePayment } from '../../../hooks/usePledges';

const PledgesTab: React.FC = () => {
  const { t, language } = useLocalization();
  const { showSuccess, showError } = useToast();
  const { data: pledges = [] } = usePledges();
  const recordPayment = useRecordPledgePayment();
  const [expandedPledgeId, setExpandedPledgeId] = useState<string | null>(null);
  const [payingInstallmentId, setPayingInstallmentId] = useState<string | null>(null);

  // ─── KPI Computations ───────────────────────────────────────────────
  const kpis = useMemo(() => {
    const totalPledged = pledges.reduce((sum, p) => sum + p.totalAmount, 0);
    const totalCollected = pledges.reduce((sum, p) => sum + p.paidAmount, 0);
    const overduePledges = pledges.filter((p) => p.status === 'overdue').length;
    const fulfillmentRate = totalPledged > 0 ? (totalCollected / totalPledged) * 100 : 0;

    return { totalPledged, totalCollected, overduePledges, fulfillmentRate };
  }, [pledges]);

  // ─── Helpers ────────────────────────────────────────────────────────
  const toggleExpand = (id: string) => {
    setExpandedPledgeId((prev) => (prev === id ? null : id));
  };

  const getNextDue = (pledge: FinancialPledge): string => {
    const next = pledge.installments.find(
      (inst) => inst.status === 'pending' || inst.status === 'overdue'
    );
    return next ? formatDate(next.dueDate, language) : '—';
  };

  const getCompletionPercent = (pledge: FinancialPledge): number => {
    return pledge.totalAmount > 0
      ? Math.min((pledge.paidAmount / pledge.totalAmount) * 100, 100)
      : 0;
  };

  const handleRecordPayment = async (pledge: FinancialPledge, installmentId: string, amount: number) => {
    if (amount <= 0) {
      showError(t('common.error', 'Error'));
      return;
    }

    setPayingInstallmentId(installmentId);
    try {
      await recordPayment.mutateAsync({
        pledgeId: pledge.id,
        installmentId,
        amount: Math.max(amount, 0),
      });
      showSuccess(t('financials.pledges.recordPayment', 'Payment recorded'));
    } catch (error) {
      showError(error instanceof Error ? error.message : t('common.error', 'Error'));
    } finally {
      setPayingInstallmentId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── KPI Cards ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <FinancialKpiCard
          title={t('financials.pledges.totalPledged')}
          value={formatCurrency(kpis.totalPledged, language)}
          icon={DollarSign}
          colorClass="text-emerald-600 dark:text-emerald-400"
          bgClass="bg-emerald-100 dark:bg-emerald-900/30"
        />
        <FinancialKpiCard
          title={t('financials.pledges.totalCollected')}
          value={formatCurrency(kpis.totalCollected, language)}
          icon={TrendingUp}
          colorClass="text-blue-600 dark:text-blue-400"
          bgClass="bg-blue-100 dark:bg-blue-900/30"
        />
        <FinancialKpiCard
          title={t('financials.pledges.overduePledges')}
          value={kpis.overduePledges}
          icon={AlertTriangle}
          colorClass="text-red-600 dark:text-red-400"
          bgClass="bg-red-100 dark:bg-red-900/30"
        />
        <FinancialKpiCard
          title={t('financials.pledges.fulfillmentRate')}
          value={`${kpis.fulfillmentRate.toFixed(1)}%`}
          icon={CheckCircle}
          colorClass="text-violet-600 dark:text-violet-400"
          bgClass="bg-violet-100 dark:bg-violet-900/30"
        />
      </div>

      {/* ── Pledges Table ──────────────────────────────────────────── */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-slate-700/50">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-slate-800">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 w-8" />
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {t('financials.pledges.donor')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
                {t('financials.pledges.pledgeDate')}
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
                {t('financials.pledges.totalAmount')}
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {t('financials.pledges.paidAmount')}
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {t('financials.pledges.balance')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {t('financials.pledges.status')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {t('financials.pledges.nextDue')}
              </th>
            </tr>
          </thead>
          <tbody>
            {pledges.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-12 text-center text-gray-400 dark:text-gray-500"
                >
                  {t('financials.pledges.noPledges')}
                </td>
              </tr>
            ) : (
              pledges.map((pledge, idx) => {
                const isExpanded = expandedPledgeId === pledge.id;
                const balance = pledge.totalAmount - pledge.paidAmount;
                const completionPercent = getCompletionPercent(pledge);

                return (
                  <React.Fragment key={pledge.id}>
                    {/* ── Pledge Row ───────────────────────────────── */}
                    <tr
                      className={`border-b border-gray-100 dark:border-slate-700/50 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer ${
                        idx % 2 === 1 ? 'bg-gray-50/50 dark:bg-slate-800/25' : ''
                      }`}
                      onClick={() => toggleExpand(pledge.id)}
                    >
                      <td className="px-4 py-3 text-foreground dark:text-dark-foreground">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        )}
                      </td>
                      <td className="px-4 py-3 text-foreground dark:text-dark-foreground font-medium">
                        {pledge.donorName[language]}
                      </td>
                      <td className="px-4 py-3 text-foreground dark:text-dark-foreground">
                        {formatDate(pledge.pledgeDate, language)}
                      </td>
                      <td className="px-4 py-3 text-right text-foreground dark:text-dark-foreground font-medium">
                        {formatCurrency(pledge.totalAmount, language)}
                      </td>
                      <td className="px-4 py-3 text-right text-foreground dark:text-dark-foreground">
                        {formatCurrency(pledge.paidAmount, language)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={
                            balance > 0
                              ? 'text-red-600 dark:text-red-400 font-medium'
                              : 'text-foreground dark:text-dark-foreground'
                          }
                        >
                          {formatCurrency(balance, language)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={pledge.status} />
                      </td>
                      <td className="px-4 py-3 text-foreground dark:text-dark-foreground">
                        {getNextDue(pledge)}
                      </td>
                    </tr>

                    {/* ── Expandable Installments Section ──────────── */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={8} className="p-0">
                          <div className="bg-gray-50/80 dark:bg-slate-800/40 px-8 py-4 border-b border-gray-100 dark:border-slate-700/50">
                            {/* Progress Bar */}
                            <div className="mb-4">
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                                  {t('financials.pledges.installments')}
                                </span>
                                <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                                  {completionPercent.toFixed(1)}%
                                </span>
                              </div>
                              <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-slate-700 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-emerald-500 dark:bg-emerald-400 transition-all duration-300"
                                  style={{ width: `${completionPercent}%` }}
                                />
                              </div>
                            </div>

                            {/* Installment Sub-Table */}
                            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-slate-700/50">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="bg-gray-100 dark:bg-slate-700/50">
                                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                      {t('financials.pledges.dueDate')}
                                    </th>
                                    <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                      {t('financials.transactions.amount')}
                                    </th>
                                    <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                      {t('financials.pledges.paidAmount')}
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                      {t('financials.pledges.pledgeDate')}
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                      {t('financials.pledges.status')}
                                    </th>
                                    <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                      {t('financials.common.actions', 'Actions')}
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {pledge.installments.map((inst) => (
                                    <tr
                                      key={inst.id}
                                      className="border-b border-gray-100 dark:border-slate-700/30 last:border-b-0"
                                    >
                                      <td className="px-3 py-2 text-foreground dark:text-dark-foreground">
                                        {formatDate(inst.dueDate, language)}
                                      </td>
                                      <td className="px-3 py-2 text-right text-foreground dark:text-dark-foreground">
                                        {formatCurrency(inst.amount, language)}
                                      </td>
                                      <td className="px-3 py-2 text-right text-foreground dark:text-dark-foreground">
                                        {formatCurrency(inst.paidAmount, language)}
                                      </td>
                                      <td className="px-3 py-2 text-foreground dark:text-dark-foreground">
                                        {inst.paidDate
                                          ? formatDate(inst.paidDate, language)
                                          : '—'}
                                      </td>
                                      <td className="px-3 py-2">
                                        <StatusBadge status={inst.status} />
                                      </td>
                                      <td className="px-3 py-2 text-right">
                                        {inst.status !== 'paid' && (
                                          <button
                                            onClick={(event) => {
                                              event.stopPropagation();
                                              handleRecordPayment(
                                                pledge,
                                                inst.id,
                                                inst.amount - inst.paidAmount
                                              );
                                            }}
                                            disabled={recordPayment.isPending}
                                            className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:text-gray-300 dark:hover:bg-slate-700"
                                          >
                                            {payingInstallmentId === inst.id && recordPayment.isPending
                                              ? t('common.loading', 'Loading...')
                                              : t('financials.pledges.recordPayment', 'Record Payment')}
                                          </button>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PledgesTab;
