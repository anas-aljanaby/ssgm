import React, { useState } from 'react';
import { useLocalization } from '../../hooks/useLocalization';
import Tabs from '../common/Tabs';
import OverviewTab from './financials/OverviewTab';
import TransactionsTab from './financials/TransactionsTab';
import DonationsTab from './financials/DonationsTab';
import PledgesTab from './financials/PledgesTab';
import BudgetsTab from './financials/BudgetsTab';
import DisbursementsTab from './financials/DisbursementsTab';
import GrantsFundsTab from './financials/GrantsFundsTab';
import ApprovalsTab from './financials/ApprovalsTab';
import ReportsTab from './financials/ReportsTab';

const FinancialsPage: React.FC = () => {
  const { t } = useLocalization(['common', 'financials']);
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: t('financials.tabs.overview', 'Overview') },
    { id: 'transactions', label: t('financials.tabs.transactions', 'Transactions') },
    { id: 'donations', label: t('financials.tabs.donations', 'Donations') },
    { id: 'pledges', label: t('financials.tabs.pledges', 'Pledges') },
    { id: 'budgets', label: t('financials.tabs.budgets', 'Budgets') },
    { id: 'disbursements', label: t('financials.tabs.disbursements', 'Disbursements') },
    { id: 'grantsFunds', label: t('financials.tabs.grantsFunds', 'Grants & Funds') },
    { id: 'approvals', label: t('financials.tabs.approvals', 'Approvals') },
    { id: 'reports', label: t('financials.tabs.reports', 'Reports') },
  ];

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab onNavigateToTab={setActiveTab} />;
      case 'transactions':
        return <TransactionsTab />;
      case 'donations':
        return <DonationsTab />;
      case 'pledges':
        return <PledgesTab />;
      case 'budgets':
        return <BudgetsTab />;
      case 'disbursements':
        return <DisbursementsTab />;
      case 'grantsFunds':
        return <GrantsFundsTab />;
      case 'approvals':
        return <ApprovalsTab />;
      case 'reports':
        return <ReportsTab />;
      default:
        return <OverviewTab />;
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
