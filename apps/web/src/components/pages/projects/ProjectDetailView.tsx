
import React, { useEffect, useRef } from 'react';
import { useTabParam } from '../../../hooks/useTabParam';
import { useLocalization } from '../../../hooks/useLocalization';
import type { Project } from '../../../types';
import { formatCurrency } from '../../../lib/utils';
import Tabs from '../../common/Tabs';
import ScopeManagementTab from './tabs/ScopeManagementTab';
import ScheduleManagementTab from './tabs/ScheduleManagementTab';
import CostManagementTab from './tabs/CostManagementTab';
import HumanResourcesTab from './tabs/HumanResourcesTab';
import RiskManagementTab from './tabs/RiskManagementTab';
import DocumentsTab from './tabs/DocumentsTab';
import ReportsTab from './tabs/ReportsTab';
import BeneficiariesTab from './tabs/BeneficiariesTab';
import MonitoringTab from './tabs/MonitoringTab';
import ProjectOverviewTab from './tabs/ProjectOverviewTab';
import { ArrowLeft, MapPin, Calendar } from 'lucide-react';
import { formatProjectLocation } from './utils/location';

interface ProjectDetailViewProps {
    project: Project;
    onBack: () => void;
    onUpdate?: (updated: Project) => void;
    initialTab?: string;
    existingCountries?: string[];
}

const stageConfig: Record<string, { bg: string; text: string; dot: string }> = {
    design: { bg: 'bg-slate-100 dark:bg-slate-700/40', text: 'text-slate-700 dark:text-slate-300', dot: 'bg-slate-400' },
    planning: { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-300', dot: 'bg-amber-400' },
    implementation: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-300', dot: 'bg-blue-500' },
    monitoring: { bg: 'bg-violet-50 dark:bg-violet-900/20', text: 'text-violet-700 dark:text-violet-300', dot: 'bg-violet-500' },
    closure: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500' },
};

const progressColor = (progress: number) => {
    if (progress >= 75) return 'bg-emerald-500';
    if (progress >= 40) return 'bg-blue-500';
    if (progress > 0) return 'bg-amber-500';
    return 'bg-gray-300 dark:bg-slate-600';
};

const PROJECT_DETAIL_TABS = [
    'overview',
    'monitoring',
    'scope',
    'schedule',
    'cost',
    'hr',
    'risks',
    'beneficiaries',
    'documents',
    'reports',
] as const;

const ProjectDetailView: React.FC<ProjectDetailViewProps> = ({ project, onBack, onUpdate, initialTab, existingCountries = [] }) => {
    const { t, language, dir } = useLocalization(['common', 'projects']);
    const [activeTab, setActiveTab] = useTabParam('projectTab', 'overview', PROJECT_DETAIL_TABS);
    const syncedProjectIdRef = useRef<string | null>(null);

    // Apply deep-link / list-open intent once per project; do not reset on tab clicks.
    useEffect(() => {
        if (syncedProjectIdRef.current === project.id) return;
        syncedProjectIdRef.current = project.id;

        const tab =
            initialTab && (PROJECT_DETAIL_TABS as readonly string[]).includes(initialTab)
                ? initialTab
                : 'overview';
        setActiveTab(tab as (typeof PROJECT_DETAIL_TABS)[number]);
    }, [project.id, initialTab, setActiveTab]);

    const stage = stageConfig[project.stage] || stageConfig.design;

    const tabs = [
        { id: 'overview', label: t('projects.tabs.overview') },
        { id: 'monitoring', label: t('projects.tabs.monitoring') },
        { id: 'scope', label: t('projects.tabs.scope') },
        { id: 'schedule', label: t('projects.tabs.schedule') },
        { id: 'cost', label: t('projects.tabs.cost') },
        { id: 'hr', label: t('projects.tabs.hr') },
        { id: 'risks', label: t('projects.tabs.risks') },
        { id: 'beneficiaries', label: t('sidebar.beneficiaries') },
        { id: 'documents', label: t('projects.tabs.documents') },
        { id: 'reports', label: t('projects.tabs.reports') },
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'overview':
                return <ProjectOverviewTab project={project} onUpdate={onUpdate} existingCountries={existingCountries} />;
            case 'monitoring':
                return <MonitoringTab project={project} onUpdate={onUpdate} />;
            case 'scope':
                return <ScopeManagementTab project={project} onUpdate={onUpdate} />;
            case 'schedule':
                return <ScheduleManagementTab project={project} onUpdate={onUpdate} />;
            case 'cost':
                return <CostManagementTab project={project} isInitiallyActive={initialTab === 'cost'} onUpdate={onUpdate} />;
            case 'hr':
                return <HumanResourcesTab project={project} onUpdate={onUpdate} />;
            case 'risks':
                return <RiskManagementTab project={project} onUpdate={onUpdate} />;
            case 'beneficiaries':
                return <BeneficiariesTab project={project} />;
            case 'documents':
                return <DocumentsTab project={project} />;
            case 'reports':
                return <ReportsTab project={project} />;
            default:
                return <div className="text-center p-8">{t('placeholder.underConstruction')}</div>;
        }
    };

    return (
        <div className="animate-fade-in space-y-4">
            <div className="bg-card dark:bg-dark-card rounded-xl border border-gray-200 dark:border-slate-700/50 p-5">
                <div className="mb-3">
                    <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-primary dark:hover:text-secondary transition-colors">
                        <ArrowLeft size={16} className={dir === 'rtl' ? 'rotate-180' : undefined} />
                        {t('projects.backToList')}
                    </button>
                </div>

                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-2xl font-bold text-foreground dark:text-dark-foreground truncate">
                                {project.name[language]}
                            </h1>
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full shrink-0 ${stage.bg} ${stage.text}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${stage.dot}`}></span>
                                {t(`projects.stages.${project.stage}`)}
                            </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {project.location && (
                                <span className="flex items-center gap-1">
                                    <MapPin size={13} />
                                    {formatProjectLocation(project.location, t, language)}
                                </span>
                            )}
                            <span className="flex items-center gap-1">
                                <Calendar size={13} />
                                {new Date(project.plannedStartDate).toLocaleDateString()} - {new Date(project.plannedEndDate).toLocaleDateString()}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-6 shrink-0">
                        <div className="text-center">
                            <p className="text-xs text-gray-400 mb-0.5">{t('projects.list.progress')}</p>
                            <div className="flex items-center gap-2">
                                <div className="w-20 bg-gray-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                                    <div className={`h-full rounded-full ${progressColor(project.progress)}`} style={{ width: `${project.progress}%` }} />
                                </div>
                                <span className="text-sm font-bold text-foreground dark:text-dark-foreground">{project.progress}%</span>
                            </div>
                        </div>
                        <div className="text-center">
                            <p className="text-xs text-gray-400 mb-0.5">{t('projects.list.budget')}</p>
                            <p className="text-sm font-bold text-foreground dark:text-dark-foreground">{formatCurrency(project.budget, language)}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-card dark:bg-dark-card rounded-xl shadow-soft border border-gray-200 dark:border-slate-700/50">
                <div className="px-6 pt-2">
                    <Tabs tabs={tabs} activeTab={activeTab} onTabClick={setActiveTab} />
                </div>
                <div className="p-6">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default ProjectDetailView;
