import React from 'react';
import { useLocalization } from '../../hooks/useLocalization';
import { useTabParam } from '../../hooks/useTabParam';
import OrganizationSettings from './settings/OrganizationSettings';
import UserManagement from './settings/UserManagement';
import FinancialSettings from './settings/FinancialSettings';
import DocumentSettings from './settings/DocumentSettings';
import ProgramSettings from './settings/ProgramSettings';
import TranslationManagement from './settings/TranslationManagement';
import type { Language, SettingsCategory } from '../../types';

import {
    OrganizationIcon,
    UsersSettingsIcon,
    LanguagesIcon,
    FinancialsSettingsIcon,
    HrSettingsIcon,
    ProjectsSettingsIcon,
    DocumentsIcon,
    SystemIcon,
    ReportingIcon,
    NotificationsIcon,
    AdvancedIcon
} from '../icons/SettingsIcons';


interface SettingsPageProps {
    enabledLanguages: Language[];
    onEnabledLanguagesChange: (langs: Language[]) => void;
}

const SETTINGS_TABS: readonly SettingsCategory[] = [
    'organization',
    'users',
    'translations',
    'financials',
    'hr',
    'projects',
    'documents',
    'system',
    'reporting',
    'notifications',
    'advanced',
];

const SettingsPage: React.FC<SettingsPageProps> = ({ enabledLanguages, onEnabledLanguagesChange }) => {
    const { t, dir } = useLocalization(['common', 'settings', 'misc']);
    const [activeCategory, setActiveCategory] = useTabParam('tab', 'organization', SETTINGS_TABS);

    const categories: { id: SettingsCategory; icon: React.FC<{className?: string}> }[] = [
        { id: 'organization', icon: OrganizationIcon },
        { id: 'users', icon: UsersSettingsIcon },
        { id: 'translations', icon: LanguagesIcon },
        { id: 'financials', icon: FinancialsSettingsIcon },
        { id: 'hr', icon: HrSettingsIcon },
        { id: 'projects', icon: ProjectsSettingsIcon },
        { id: 'documents', icon: DocumentsIcon },
        { id: 'system', icon: SystemIcon },
        { id: 'reporting', icon: ReportingIcon },
        { id: 'notifications', icon: NotificationsIcon },
        { id: 'advanced', icon: AdvancedIcon },
    ];

    const renderActiveCategory = () => {
        switch (activeCategory) {
            case 'organization':
                return <OrganizationSettings enabledLanguages={enabledLanguages} onEnabledLanguagesChange={onEnabledLanguagesChange} />;
            case 'users':
                return <UserManagement />;
            case 'translations':
                return <TranslationManagement />;
            case 'financials':
                return <FinancialSettings />;
            case 'documents':
                return <DocumentSettings />;
            case 'projects':
                return <ProgramSettings />;
            default:
                return (
                     <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-card dark:bg-dark-card rounded-2xl shadow-soft">
                        <div className="text-6xl mb-4">🚧</div>
                        <h2 className="text-2xl font-bold mb-2">{t(`settings.categories.${activeCategory}`)}</h2>
                        <p>{t('placeholder.underConstruction')}</p>
                    </div>
                );
        }
    };
    
    return (
        <div className="animate-fade-in space-y-4">
            <h1 className="text-3xl font-bold text-foreground dark:text-dark-foreground">{t('settings.title')}</h1>
            <div className="flex flex-col md:flex-row gap-8">
                <aside className="md:w-1/4 lg:w-1/5">
                    <nav className="space-y-2">
                        {categories.map(cat => {
                            const Icon = cat.icon;
                            return (
                                <button
                                    key={cat.id}
                                    onClick={() => setActiveCategory(cat.id)}
                                    className={`w-full flex items-center gap-3 p-3 rounded-lg text-sm font-semibold transition-colors text-left ${
                                        activeCategory === cat.id
                                        ? 'bg-primary text-white shadow'
                                        : 'text-foreground dark:text-dark-foreground hover:bg-gray-200 dark:hover:bg-slate-700/50'
                                    } ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}
                                >
                                    <Icon className="w-5 h-5 flex-shrink-0" />
                                    <span>{t(`settings.categories.${cat.id}`)}</span>
                                </button>
                            );
                        })}
                    </nav>
                </aside>
                <main className="flex-1">
                    {renderActiveCategory()}
                </main>
            </div>
        </div>
    );
};

export default SettingsPage;
