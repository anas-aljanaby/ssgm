
import React from 'react';
import { useLocalization } from '../../../../hooks/useLocalization';
import type { Project } from '../../../../types';
import { formatCurrency, formatDate } from '../../../../lib/utils';
import AiCard from '../../ai/AiCard';
import { MOCK_PROGRAM_DATA } from '../../../../data/programData';
import Tooltip from '../../../common/Tooltip';
import { TrendingUp, DollarSign, Clock, AlertTriangle, Target, Users } from 'lucide-react';

interface ProjectOverviewTabProps {
    project: Project;
}

const InfoItem: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
    <div>
        <dt className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">{label}</dt>
        <dd className="mt-1 text-sm font-semibold text-foreground dark:text-dark-foreground">{value}</dd>
    </div>
);

const ProjectOverviewTab: React.FC<ProjectOverviewTabProps> = ({ project }) => {
    const { t, language } = useLocalization(['projects']);
    const formatProjectLocation = (city?: string, country?: string) => {
        if (!city && !country) return '';
        if (!city) return country || '';
        if (!country) return city;
        return language === 'ar' ? `${country}، ${city}` : `${city}, ${country}`;
    };

    const scheduleStatus = project.costManagement.financialSummary.spi >= 1 ? 'onTrack' : 'atRisk';
    const budgetStatus = project.costManagement.financialSummary.cpi >= 1 ? 'onTrack' : 'overBudget';
    const activeRisks = project.riskManagement.riskRegister.filter(r => r.status === 'open' || r.status === 'in-progress').length;

    const { sdgs } = MOCK_PROGRAM_DATA;
    const alignedSdgs = sdgs.filter(sdg => project.sdgGoals?.includes(sdg.id));

    const kpis = [
        {
            label: t('projects.monitoring.overallCompletion'),
            value: `${project.progress}%`,
            icon: TrendingUp,
            color: 'text-blue-600 dark:text-blue-400',
            bg: 'bg-blue-50 dark:bg-blue-900/20',
            iconBg: 'bg-blue-100 dark:bg-blue-900/30',
        },
        {
            label: t('projects.monitoring.budgetStatus'),
            value: formatCurrency(project.spent, language),
            subtitle: `${t('common.of', 'of')} ${formatCurrency(project.budget, language)}`,
            icon: DollarSign,
            color: budgetStatus === 'onTrack' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400',
            bg: budgetStatus === 'onTrack' ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-red-50 dark:bg-red-900/20',
            iconBg: budgetStatus === 'onTrack' ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-red-100 dark:bg-red-900/30',
        },
        {
            label: t('projects.monitoring.scheduleStatus'),
            value: t(`projects.monitoring.statuses.${scheduleStatus}`),
            icon: Clock,
            color: scheduleStatus === 'onTrack' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400',
            bg: scheduleStatus === 'onTrack' ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-amber-50 dark:bg-amber-900/20',
            iconBg: scheduleStatus === 'onTrack' ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-amber-100 dark:bg-amber-900/30',
        },
        {
            label: t('projects.monitoring.activeRisks'),
            value: String(activeRisks),
            icon: AlertTriangle,
            color: activeRisks > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400',
            bg: activeRisks > 0 ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-emerald-50 dark:bg-emerald-900/20',
            iconBg: activeRisks > 0 ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-emerald-100 dark:bg-emerald-900/30',
        },
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {kpis.map((kpi) => (
                    <div key={kpi.label} className={`rounded-xl p-4 ${kpi.bg}`}>
                        <div className="flex items-center gap-2 mb-2">
                            <div className={`p-1.5 rounded-lg ${kpi.iconBg}`}>
                                <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                            </div>
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{kpi.label}</span>
                        </div>
                        <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
                        {kpi.subtitle && <p className="text-xs text-gray-400 mt-0.5">{kpi.subtitle}</p>}
                    </div>
                ))}
            </div>

            <AiCard title={t('projects.reporting.modal.overview.projectInfo')}>
                <dl className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-5">
                    <InfoItem label={t('projects.reporting.modal.overview.manager')} value={project.stakeholders.primaryContact} />
                    <InfoItem label={t('projects.reporting.modal.overview.dates')} value={`${formatDate(project.plannedStartDate, language)} – ${formatDate(project.plannedEndDate, language)}`} />
                    <InfoItem label={t('projects.overview.location')} value={formatProjectLocation(project.location.city, project.location.country)} />
                    <InfoItem label={t('projects.wizard.form.donor')} value={project.stakeholders.donor} />
                    <div className="col-span-2">
                        <InfoItem label={t('projects.overview.goal')} value={project.goal} />
                    </div>
                </dl>
            </AiCard>

            {alignedSdgs.length > 0 && (
                <AiCard title={t('projects.overview.sdgTitle')}>
                    <div className="flex flex-wrap gap-3">
                        {alignedSdgs.map(sdg => (
                            <Tooltip key={sdg.id} text={t('projects.sdgAnalytics.sdgTooltip', { id: sdg.id, name: sdg.name })}>
                                <img
                                    src={`https://sdgs.un.org/sites/default/files/goals/E_SDG_Icons-${String(sdg.id).padStart(2, '0')}.jpg`}
                                    alt={`SDG ${sdg.id}: ${sdg.name}`}
                                    className="w-16 h-16 rounded-lg object-cover transition-transform hover:scale-110 shadow-sm"
                                    loading="lazy"
                                />
                            </Tooltip>
                        ))}
                    </div>
                </AiCard>
            )}

            <AiCard title={t('projects.hr.projectTeam')}>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {project.humanResources.projectTeam.map(member => (
                        <div key={member.userId} className="flex items-center gap-3 p-2.5 rounded-lg bg-gray-50 dark:bg-slate-800/50">
                            <img className="h-9 w-9 rounded-full object-cover" src={member.photo} alt={member.name} />
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-foreground dark:text-dark-foreground truncate">{member.name}</p>
                                <p className="text-xs text-gray-400 truncate">{member.role}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </AiCard>
        </div>
    );
};

export default ProjectOverviewTab;
