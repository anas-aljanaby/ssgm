import React, { useState } from 'react';
import { Landmark, HandCoins, ChevronDown, ChevronRight } from 'lucide-react';
import { useLocalization } from '../../../hooks/useLocalization';
import { useToast } from '../../../hooks/useToast';
import { formatCurrency, formatDate } from '../../../lib/utils';
import StatusBadge from './shared/StatusBadge';
import type { Fund, Grant, FundType } from '../../../types/financials';
import { useFunds } from '../../../hooks/useFunds';
import { useGrants, useReceiveGrantInstallment } from '../../../hooks/useGrants';

const FUND_TYPE_BADGE_CLASSES: Record<FundType, string> = {
  unrestricted: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  temporarily_restricted: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  permanently_restricted: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
};

const GrantsFundsTab: React.FC = () => {
  const { t, language } = useLocalization();
  const { showSuccess, showError } = useToast();
  const { data: funds = [] } = useFunds();
  const { data: grants = [] } = useGrants();
  const receiveInstallment = useReceiveGrantInstallment();
  const [receivingInstallmentId, setReceivingInstallmentId] = useState<string | null>(null);

  const [activeView, setActiveView] = useState<'funds' | 'grants'>('funds');
  const [expandedGrantId, setExpandedGrantId] = useState<string | null>(null);

  const handleReceiveInstallment = async (grant: Grant, installmentId: string, amount: number) => {
    if (amount <= 0) {
      showError(t('common.error', 'Error'));
      return;
    }

    setReceivingInstallmentId(installmentId);
    try {
      await receiveInstallment.mutateAsync({
        grantId: grant.id,
        installmentId,
        amount,
      });
      showSuccess(t('financials.grantsFunds.receivedAmount', 'Installment received'));
    } catch (error) {
      showError(error instanceof Error ? error.message : t('common.error', 'Error'));
    } finally {
      setReceivingInstallmentId(null);
    }
  };

  const getViewButtonClass = (view: 'funds' | 'grants') =>
    activeView === view
      ? 'bg-primary text-white shadow-md'
      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700';

  return (
    <div className="space-y-6">
      {/* View Toggle */}
      <div className="flex items-center gap-4">
        <div className="p-1 bg-gray-100 dark:bg-dark-card rounded-lg flex items-center space-x-1 rtl:space-x-reverse">
          <button
            onClick={() => setActiveView('funds')}
            className={`flex items-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${getViewButtonClass('funds')}`}
          >
            <Landmark className="w-4 h-4" />
            {t('financials.grantsFunds.fundsView')}
          </button>
          <button
            onClick={() => setActiveView('grants')}
            className={`flex items-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${getViewButtonClass('grants')}`}
          >
            <HandCoins className="w-4 h-4" />
            {t('financials.grantsFunds.grantsView')}
          </button>
        </div>
      </div>

      {activeView === 'funds' && <FundsView language={language} t={t} funds={funds} />}
      {activeView === 'grants' && (
        <GrantsView
          language={language}
          t={t}
          grants={grants}
          expandedGrantId={expandedGrantId}
          onToggleExpand={(id) =>
            setExpandedGrantId((prev) => (prev === id ? null : id))
          }
          onReceiveInstallment={handleReceiveInstallment}
          receivingInstallmentId={receivingInstallmentId}
          isReceivingInstallment={receiveInstallment.isPending}
        />
      )}
    </div>
  );
};

// ─── Funds View ─────────────────────────────────────────────────────────────

interface FundsViewProps {
  language: 'en' | 'ar';
  t: (key: string, options?: any) => string;
  funds: Fund[];
}

const FundsView: React.FC<FundsViewProps> = ({ language, t, funds }) => {
  if (funds.length === 0) {
    return (
      <p className="text-center text-gray-400 dark:text-gray-500 py-12">
        {t('financials.grantsFunds.noFunds')}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {funds.map((fund) => (
        <FundCard key={fund.id} fund={fund} language={language} t={t} />
      ))}
    </div>
  );
};

interface FundCardProps {
  fund: Fund;
  language: 'en' | 'ar';
  t: (key: string, options?: any) => string;
}

const FundCard: React.FC<FundCardProps> = ({ fund, language, t }) => {
  const utilizationPercent =
    fund.totalReceived > 0
      ? Math.min((fund.totalSpent / fund.totalReceived) * 100, 100)
      : 0;

  return (
    <div className="bg-card dark:bg-dark-card rounded-xl border border-gray-200 dark:border-slate-700/50 p-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <h3 className="text-sm font-semibold text-foreground dark:text-dark-foreground leading-tight">
          {fund.name[language]}
        </h3>
        <span
          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${FUND_TYPE_BADGE_CLASSES[fund.type]}`}
        >
          {t(`financials.fundType.${fund.type}`)}
        </span>
      </div>

      {/* Balance */}
      <p className="text-2xl font-bold text-foreground dark:text-dark-foreground mb-4">
        {formatCurrency(fund.balance, language)}
      </p>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t('financials.grantsFunds.received')}
          </p>
          <p className="text-sm font-semibold text-foreground dark:text-dark-foreground">
            {formatCurrency(fund.totalReceived, language)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t('financials.grantsFunds.spent')}
          </p>
          <p className="text-sm font-semibold text-foreground dark:text-dark-foreground">
            {formatCurrency(fund.totalSpent, language)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t('financials.grantsFunds.committed')}
          </p>
          <p className="text-sm font-semibold text-foreground dark:text-dark-foreground">
            {formatCurrency(fund.totalCommitted, language)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t('financials.grantsFunds.available')}
          </p>
          <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
            {formatCurrency(
              fund.totalReceived - fund.totalSpent - fund.totalCommitted,
              language
            )}
          </p>
        </div>
      </div>

      {/* Utilization Bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
          <span>{t('financials.budgets.utilization')}</span>
          <span>{utilizationPercent.toFixed(1)}%</span>
        </div>
        <div className="w-full h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${utilizationPercent}%` }}
          />
        </div>
      </div>

      {/* Donor Restriction */}
      {fund.donorRestriction && (
        <p className="text-xs italic text-gray-500 dark:text-gray-400 mb-2">
          {fund.donorRestriction}
        </p>
      )}

      {/* Linked Project */}
      {fund.projectName && (
        <div className="flex items-center gap-1.5 text-xs text-primary dark:text-primary-light">
          <Landmark className="w-3.5 h-3.5" />
          <span>{fund.projectName[language]}</span>
        </div>
      )}
    </div>
  );
};

// ─── Grants View ────────────────────────────────────────────────────────────

interface GrantsViewProps {
  language: 'en' | 'ar';
  t: (key: string, options?: any) => string;
  grants: Grant[];
  expandedGrantId: string | null;
  onToggleExpand: (id: string) => void;
  onReceiveInstallment: (grant: Grant, installmentId: string, amount: number) => void;
  receivingInstallmentId: string | null;
  isReceivingInstallment: boolean;
}

const GrantsView: React.FC<GrantsViewProps> = ({
  language,
  t,
  grants,
  expandedGrantId,
  onToggleExpand,
  onReceiveInstallment,
  receivingInstallmentId,
  isReceivingInstallment,
}) => {
  if (grants.length === 0) {
    return (
      <p className="text-center text-gray-400 dark:text-gray-500 py-12">
        {t('financials.grantsFunds.noGrants')}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-slate-700/50">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 dark:bg-slate-800">
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 text-left w-8" />
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 text-left">
              {t('financials.grantsFunds.grantNumber')}
            </th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 text-left">
              {t('financials.grantsFunds.grantor')}
            </th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 text-left">
              {t('financials.grantsFunds.grantTitle')}
            </th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 text-right">
              {t('financials.grantsFunds.totalAmount')}
            </th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 text-right">
              {t('financials.grantsFunds.receivedAmount')}
            </th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 text-left">
              {t('financials.grantsFunds.period')}
            </th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 text-left">
              {t('financials.grantsFunds.status')}
            </th>
          </tr>
        </thead>
        <tbody>
          {grants.map((grant, idx) => (
            <GrantRow
              key={grant.id}
              grant={grant}
              language={language}
              t={t}
              isExpanded={expandedGrantId === grant.id}
              onToggle={() => onToggleExpand(grant.id)}
              isEven={idx % 2 === 1}
              onReceiveInstallment={onReceiveInstallment}
              receivingInstallmentId={receivingInstallmentId}
              isReceivingInstallment={isReceivingInstallment}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

interface GrantRowProps {
  grant: Grant;
  language: 'en' | 'ar';
  t: (key: string, options?: any) => string;
  isExpanded: boolean;
  onToggle: () => void;
  isEven: boolean;
  onReceiveInstallment: (grant: Grant, installmentId: string, amount: number) => void;
  receivingInstallmentId: string | null;
  isReceivingInstallment: boolean;
}

const GrantRow: React.FC<GrantRowProps> = ({
  grant,
  language,
  t,
  isExpanded,
  onToggle,
  isEven,
  onReceiveInstallment,
  receivingInstallmentId,
  isReceivingInstallment,
}) => {
  const progressPercent =
    grant.totalAmount > 0
      ? Math.min((grant.receivedAmount / grant.totalAmount) * 100, 100)
      : 0;

  return (
    <>
      {/* Main Row */}
      <tr
        className={`border-b border-gray-100 dark:border-slate-700/50 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer ${
          isEven ? 'bg-gray-50/50 dark:bg-slate-800/25' : ''
        }`}
        onClick={onToggle}
      >
        <td className="px-4 py-3 text-foreground dark:text-dark-foreground">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-400" />
          )}
        </td>
        <td className="px-4 py-3 text-sm font-mono text-foreground dark:text-dark-foreground">
          {grant.grantNumber}
        </td>
        <td className="px-4 py-3 text-sm text-foreground dark:text-dark-foreground">
          {grant.grantorName}
        </td>
        <td className="px-4 py-3 text-sm font-medium text-foreground dark:text-dark-foreground">
          {grant.title[language]}
        </td>
        <td className="px-4 py-3 text-sm font-semibold text-foreground dark:text-dark-foreground text-right whitespace-nowrap">
          {formatCurrency(grant.totalAmount, language)}
        </td>
        <td className="px-4 py-3 text-sm font-semibold text-foreground dark:text-dark-foreground text-right whitespace-nowrap">
          {formatCurrency(grant.receivedAmount, language)}
        </td>
        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
          {formatDate(grant.startDate, language, 'medium')} —{' '}
          {formatDate(grant.endDate, language, 'medium')}
        </td>
        <td className="px-4 py-3">
          <StatusBadge status={grant.status} />
        </td>
      </tr>

      {/* Expanded Detail Row */}
      {isExpanded && (
        <tr>
          <td
            colSpan={8}
            className="px-4 py-4 bg-gray-50/80 dark:bg-slate-800/40 border-b border-gray-200 dark:border-slate-700/50"
          >
            <div className="space-y-4">
              {/* Progress Bar */}
              <div>
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                  <span>
                    {formatCurrency(grant.receivedAmount, language)}{' '}
                    {t('financials.common.of')}{' '}
                    {formatCurrency(grant.totalAmount, language)}
                  </span>
                  <span>{progressPercent.toFixed(1)}%</span>
                </div>
                <div className="w-full h-2.5 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 dark:bg-emerald-400 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Installment Schedule */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                  {t('financials.grantsFunds.installmentSchedule')}
                </h4>
                <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-slate-700/50">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-100 dark:bg-slate-700/50">
                        <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 text-left">
                          {t('financials.pledges.dueDate')}
                        </th>
                        <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 text-right">
                          {t('financials.disbursements.amount')}
                        </th>
                        <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 text-right">
                          {t('financials.grantsFunds.receivedAmount')}
                        </th>
                        <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 text-left">
                          {t('financials.disbursements.date')}
                        </th>
                        <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 text-left">
                          {t('financials.grantsFunds.status')}
                        </th>
                        <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 text-right">
                          {t('financials.common.actions', 'Actions')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {grant.installments.map((inst) => (
                        <tr
                          key={inst.id}
                          className="border-b border-gray-100 dark:border-slate-700/30 last:border-b-0"
                        >
                          <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
                            {formatDate(inst.dueDate, language, 'medium')}
                          </td>
                          <td className="px-3 py-2 text-sm font-medium text-foreground dark:text-dark-foreground text-right whitespace-nowrap">
                            {formatCurrency(inst.amount, language)}
                          </td>
                          <td className="px-3 py-2 text-sm font-medium text-foreground dark:text-dark-foreground text-right whitespace-nowrap">
                            {formatCurrency(inst.receivedAmount, language)}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
                            {inst.receivedDate
                              ? formatDate(inst.receivedDate, language, 'medium')
                              : '—'}
                          </td>
                          <td className="px-3 py-2">
                            <StatusBadge status={inst.status} />
                          </td>
                          <td className="px-3 py-2 text-right">
                            {inst.status !== 'received' && (
                              <button
                                onClick={(event) => {
                                  event.stopPropagation();
                                  onReceiveInstallment(grant, inst.id, inst.amount - inst.receivedAmount);
                                }}
                                disabled={isReceivingInstallment}
                                className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:text-gray-300 dark:hover:bg-slate-700"
                              >
                                {receivingInstallmentId === inst.id && isReceivingInstallment
                                  ? t('common.loading', 'Loading...')
                                  : t('financials.grantsFunds.receiveInstallment', 'Receive')}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

export default GrantsFundsTab;
