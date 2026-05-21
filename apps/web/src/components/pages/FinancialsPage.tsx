import React, { useState } from 'react';
import { useLocalization } from '../../hooks/useLocalization';
import Tabs from '../common/Tabs';
import OverviewTab from './financials/OverviewTab';
import TransactionsTab from './financials/TransactionsTab';

const FinancialsPage: React.FC = () => {
  const { t } = useLocalization(['common', 'financials']);
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: t('financials.tabs.overview', 'Overview') },
    { id: 'transactions', label: t('financials.tabs.transactions', 'Transactions') },
  ];

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab onNavigateToTab={setActiveTab} />;
      case 'transactions':
        return <TransactionsTab />;
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
