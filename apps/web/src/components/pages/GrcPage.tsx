import React, { useState } from 'react';
import { useLocalization } from '../../hooks/useLocalization';
import { useGrc } from '../../hooks/useGrc';
import { GrcIcon } from '../icons/ModuleIcons';
import Tabs from '../common/Tabs';
import OverviewTab from './grc/OverviewTab';
import GovernanceTab from './grc/GovernanceTab';
import RiskTab from './grc/RiskTab';
import ComplianceTab from './grc/ComplianceTab';
import ScreeningTab from './grc/ScreeningTab';
import AuditTab from './grc/AuditTab';

const GrcPage: React.FC = () => {
  const { t } = useLocalization(['common', 'grc', 'projects', 'sidebar', 'compliance']);
  const [activeTab, setActiveTab] = useState('overview');
  const { data, isLoading, isError, error } = useGrc();

  const tabs = [
    { id: 'overview', label: t('grc.tabs.overview') },
    { id: 'governance', label: t('grc.tabs.governance') },
    { id: 'risk', label: t('grc.tabs.risk') },
    { id: 'compliance', label: t('grc.tabs.compliance') },
    { id: 'screening', label: t('grc.tabs.screening') },
    { id: 'audit', label: t('grc.tabs.audit') },
  ];

  const grcData = data ?? {
    policies: [],
    decisions: [],
    risks: [],
    requirements: [],
    assessments: [],
    auditLog: [],
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab grcData={grcData} />;
      case 'governance':
        return <GovernanceTab policies={grcData.policies} decisions={grcData.decisions} />;
      case 'risk':
        return <RiskTab risks={grcData.risks} />;
      case 'compliance':
        return (
          <ComplianceTab
            requirements={grcData.requirements}
            assessments={grcData.assessments}
          />
        );
      case 'screening':
        return <ScreeningTab />;
      case 'audit':
        return <AuditTab log={grcData.auditLog} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-3xl font-bold text-foreground dark:text-dark-foreground flex items-center gap-3">
        <GrcIcon />
        {t('sidebar.grc')}
      </h1>

      <Tabs tabs={tabs} activeTab={activeTab} onTabClick={setActiveTab} />

      {isLoading && (
        <div className="flex justify-center py-16">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-dashed border-primary" />
        </div>
      )}

      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
          {error instanceof Error ? error.message : t('common.error')}
        </div>
      )}

      {!isLoading && !isError && <div className="mt-6">{renderActiveTab()}</div>}
    </div>
  );
};

export default GrcPage;
