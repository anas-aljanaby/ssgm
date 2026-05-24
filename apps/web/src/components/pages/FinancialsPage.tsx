import React from 'react';
import { useLocalization } from '../../hooks/useLocalization';
import { useTabParam } from '../../hooks/useTabParam';
import Tabs from '../common/Tabs';
import OverviewTab from './financials/OverviewTab';
import TransactionsTab from './financials/TransactionsTab';
import DisbursementsTab from './financials/DisbursementsTab';
import ApprovalsTab from './financials/ApprovalsTab';

const FINANCIALS_TABS = ['overview', 'transactions', 'disbursements', 'approvals'] as const;

const FinancialsPage: React.FC = () => {
  const { t } = useLocalization(['common', 'financials']);
  const [activeTab, setActiveTab] = useTabParam('tab', 'overview', FINANCIALS_TABS);

  const tabs = [
    { id: 'overview', label: t('financials.tabs.overview', 'Overview') },
    { id: 'transactions', label: t('financials.tabs.transactions', 'Transactions') },
    { id: 'disbursements', label: t('financials.tabs.disbursements', 'Disbursements') },
    { id: 'approvals', label: t('financials.tabs.approvals', 'Approvals') },
  ];

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab onNavigateToTab={setActiveTab} />;
      case 'transactions':
        return <TransactionsTab />;
      case 'disbursements':
        return <DisbursementsTab />;
      case 'approvals':
        return <ApprovalsTab />;
      default:
        return <OverviewTab onNavigateToTab={setActiveTab} />;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground dark:text-dark-foreground">
          {t('financials.title', 'Financials')}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {t('financials.subtitle', 'Manage donations, budgets, disbursements, and financial reporting')}
        </p>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onTabClick={setActiveTab} />

      {renderActiveTab()}
    </div>
  );
};

export default FinancialsPage;
