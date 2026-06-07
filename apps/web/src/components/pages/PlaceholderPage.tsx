import React from 'react';
import { useLocalization } from '../../hooks/useLocalization';
import { SIDEBAR_MODULES } from '../../constants';

interface PlaceholderPageProps {
  moduleKey: string;
}

/**
 * PlaceholderPage - مكون يعرض صفحة مؤقتة للوحدات قيد الإنشاء.
 * 
 * @component
 * @param {PlaceholderPageProps} props - الخصائص.
 * @returns {JSX.Element} - مكون React
 * 
 * @example
 * <PlaceholderPage moduleKey="financials" />
 */
const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ moduleKey }) => {
  const { t, sidebarLabel } = useLocalization(['common', 'misc', 'sidebar']);
  
  const moduleInfo = SIDEBAR_MODULES.find(m => m.key === moduleKey);
  const Icon = moduleInfo?.icon || (() => null);
  const moduleName = sidebarLabel(moduleKey);

  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-card dark:bg-dark-card rounded-2xl shadow-soft">
        <div className="p-6 bg-primary-light dark:bg-primary/20 rounded-full mb-6">
            <div className="text-primary dark:text-secondary">
                <Icon />
            </div>
        </div>
        <h1 className="text-4xl font-bold text-foreground dark:text-dark-foreground mb-2">
            {moduleName}
        </h1>
        <p className="text-lg text-gray-500 dark:text-gray-400 mb-4">
            {t('placeholder.underConstruction')}
        </p>
        <p className="max-w-xl text-gray-400 dark:text-gray-500">
            {t('placeholder.wip', { moduleName: moduleName.toLowerCase() })}
        </p>
    </div>
  );
};

export default PlaceholderPage;
