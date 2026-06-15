import React, { useState } from 'react';
import { useLocalization } from '../../hooks/useLocalization';
import { ShariaBoardIcon } from '../icons/ModuleIcons';
import Tabs from '../common/Tabs';
import MeetingsTab from './sharia_board/MeetingsTab';
import MembersTab from './sharia_board/MembersTab';

interface ShariaBoardManagementPageProps {
  setActiveModule?: (module: string) => void;
}

const ShariaBoardManagementPage: React.FC<ShariaBoardManagementPageProps> = () => {
  const { t } = useLocalization(['sharia']);

  const [activeTab, setActiveTab] = useState('members');

  const tabs = [
    { id: 'members', label: t('sharia.board.tabs.members') },
    { id: 'meetings', label: t('sharia.board.tabs.meetings') },
  ];

  const renderTab = () => {
    switch (activeTab) {
      case 'members':
        return <MembersTab />;
      case 'meetings':
        return <MeetingsTab />;
      default:
        return <MembersTab />;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-3xl font-bold text-foreground dark:text-dark-foreground flex items-center gap-3">
        <ShariaBoardIcon className="w-8 h-8" />
        {t('sharia.board.title')}
      </h1>

      <Tabs tabs={tabs} activeTab={activeTab} onTabClick={setActiveTab} />

      <div className="mt-6">{renderTab()}</div>
    </div>
  );
};

export default ShariaBoardManagementPage;
