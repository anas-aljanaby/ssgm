
import React, { useEffect, useState } from 'react';
import { useLocalization } from '../../../../hooks/useLocalization';
import { useToast } from '../../../../hooks/useToast';
import type { Project, ProjectLifecycleStageId, ProjectType } from '../../../../types';
import { formatCurrency } from '../../../../lib/utils';
import AiCard from '../../ai/AiCard';
import CountryCombobox from '../../../common/CountryCombobox';
import { MOCK_PROGRAM_DATA } from '../../../../data/programData';
import Tooltip from '../../../common/Tooltip';
import { TrendingUp, DollarSign, Clock, AlertTriangle, Pencil, Check, X } from 'lucide-react';
import { formatProjectLocation } from '../utils/location';
import SdgGoalPicker, { getSdgIconUrl } from '../shared/SdgGoalPicker';

interface ProjectOverviewTabProps {
    project: Project;
    onUpdate?: (updated: Project) => void;
    existingCountries?: string[];
}

const STAGES: ProjectLifecycleStageId[] = ['design', 'planning', 'implementation', 'monitoring', 'closure'];
const PROJECT_TYPES: ProjectType[] = ['humanitarian', 'development', 'health', 'education', 'infrastructure'];

type InfoFormState = {
    nameEn: string;
    nameAr: string;
    stage: ProjectLifecycleStageId;
    type: ProjectType;
    country: string;
    city: string;
    donor: string;
    goal: string;
};

const buildInfoForm = (project: Project): InfoFormState => ({
    nameEn: project.name.en || '',
    nameAr: project.name.ar || '',
    stage: project.stage,
    type: project.type,
    country: project.location?.country || '',
    city: project.location?.city || '',
    donor: project.stakeholders?.donor || '',
    goal: project.goal || '',
});

const InfoItem: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
    <div>
        <dt className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">{label}</dt>
        <dd className="mt-1 text-sm font-semibold text-foreground dark:text-dark-foreground">{value}</dd>
    </div>
);

const ProjectOverviewTab: React.FC<ProjectOverviewTabProps> = ({ project, onUpdate, existingCountries = [] }) => {
    const { t, language } = useLocalization(['common', 'projects']);
    const toast = useToast();
    const [isEditing, setIsEditing] = useState(false);
    const [isEditingSdg, setIsEditingSdg] = useState(false);
    const [form, setForm] = useState<InfoFormState>(() => buildInfoForm(project));
    const [sdgDraft, setSdgDraft] = useState<number[]>(() => project.sdgGoals ?? []);

    useEffect(() => {
        if (!isEditing) setForm(buildInfoForm(project));
    }, [project, isEditing]);

    useEffect(() => {
        if (!isEditingSdg) setSdgDraft(project.sdgGoals ?? []);
    }, [project.sdgGoals, isEditingSdg]);

    const handleSave = () => {
        if (!form.nameEn.trim()) {
            toast.showError(t('projects.validation.nameRequired', 'Project name (English) is required'));
            return;
        }
        onUpdate?.({
            ...project,
            name: { en: form.nameEn.trim(), ar: form.nameAr.trim() },
            stage: form.stage,
            type: form.type,
            location: { ...project.location, country: form.country.trim(), city: form.city.trim() },
            stakeholders: { ...project.stakeholders, donor: form.donor.trim() },
            goal: form.goal.trim(),
        });
        setIsEditing(false);
        toast.showSuccess(t('projects.updateSuccess', 'Project updated successfully'));
    };

    const handleCancel = () => {
        setForm(buildInfoForm(project));
        setIsEditing(false);
    };

    const handleSdgSave = () => {
        onUpdate?.({ ...project, sdgGoals: sdgDraft });
        setIsEditingSdg(false);
        toast.showSuccess(t('projects.updateSuccess', 'Project updated successfully'));
    };

    const handleSdgCancel = () => {
        setSdgDraft(project.sdgGoals ?? []);
        setIsEditingSdg(false);
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

    const inputClass = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-dark-foreground focus:ring-1 focus:ring-primary';
    const labelClass = 'block text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1';

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

            <div className="bg-card dark:bg-dark-card rounded-2xl shadow-soft border dark:border-slate-700/50 p-5">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold">{t('projects.reporting.modal.overview.projectInfo')}</h3>
                    {onUpdate && (
                        !isEditing ? (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-gray-500 hover:text-primary hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            >
                                <Pencil size={13} />
                                {t('common.edit', 'Edit')}
                            </button>
                        ) : (
                            <div className="flex items-center gap-2">
                                <button onClick={handleCancel} className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-gray-500 hover:text-red-600 rounded-lg">
                                    <X size={13} /> {t('common.cancel')}
                                </button>
                                <button onClick={handleSave} className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-white bg-primary hover:bg-primary-dark rounded-lg">
                                    <Check size={13} /> {t('common.save')}
                                </button>
                            </div>
                        )
                    )}
                </div>

                {!isEditing ? (
                    <dl className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-5">
                        <InfoItem label={t('projects.wizard.form.nameEn', 'Project Name (English)')} value={project.name.en} />
                        <InfoItem label={t('projects.wizard.form.nameAr', 'Project Name (Arabic)')} value={project.name.ar} />
                        <InfoItem label={t('projects.list.stage', 'Stage')} value={t(`projects.stages.${project.stage}`)} />
                        <InfoItem label={t('projects.wizard.form.type', 'Type')} value={t(`projects.types.${project.type}`)} />
                        <InfoItem label={t('projects.overview.location')} value={formatProjectLocation(project.location, t, language)} />
                        <InfoItem label={t('projects.wizard.form.donor')} value={project.stakeholders.donor} />
                        <div className="col-span-2 md:col-span-3">
                            <InfoItem label={t('projects.overview.goal')} value={project.goal} />
                        </div>
                    </dl>
                ) : (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>{t('projects.wizard.form.nameEn', 'Project Name (English)')}</label>
                                <input className={inputClass} value={form.nameEn} onChange={e => setForm(f => ({ ...f, nameEn: e.target.value }))} />
                            </div>
                            <div>
                                <label className={labelClass}>{t('projects.wizard.form.nameAr', 'Project Name (Arabic)')}</label>
                                <input className={inputClass} dir="rtl" value={form.nameAr} onChange={e => setForm(f => ({ ...f, nameAr: e.target.value }))} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <label className={labelClass}>{t('projects.list.stage', 'Stage')}</label>
                                <select className={inputClass} value={form.stage} onChange={e => setForm(f => ({ ...f, stage: e.target.value as ProjectLifecycleStageId }))}>
                                    {STAGES.map(s => <option key={s} value={s}>{t(`projects.stages.${s}`)}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className={labelClass}>{t('projects.wizard.form.type', 'Type')}</label>
                                <select className={inputClass} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as ProjectType }))}>
                                    {PROJECT_TYPES.map(pt => <option key={pt} value={pt}>{t(`projects.types.${pt}`)}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className={labelClass}>{t('projects.overview.country', 'Country')}</label>
                                <CountryCombobox
                                    value={form.country}
                                    onChange={(country) => setForm(f => ({ ...f, country }))}
                                    existingCountries={existingCountries}
                                    placeholder={t('common.countryField.placeholder')}
                                    noResultsText={t('common.countryField.noResults')}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>{t('projects.overview.city', 'City')}</label>
                                <input className={inputClass} value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
                            </div>
                        </div>
                        <div>
                            <label className={labelClass}>{t('projects.wizard.form.donor', 'Donor')}</label>
                            <input className={inputClass} value={form.donor} onChange={e => setForm(f => ({ ...f, donor: e.target.value }))} />
                        </div>
                        <div>
                            <label className={labelClass}>{t('projects.overview.goal', 'Goal')}</label>
                            <textarea className={`${inputClass} resize-none`} rows={2} value={form.goal} onChange={e => setForm(f => ({ ...f, goal: e.target.value }))} />
                        </div>
                    </div>
                )}
            </div>

            {(onUpdate || alignedSdgs.length > 0) && (
                <div className="bg-card dark:bg-dark-card rounded-2xl shadow-soft border dark:border-slate-700/50 p-5">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold">{t('projects.overview.sdgTitle')}</h3>
                        {onUpdate && (
                            !isEditingSdg ? (
                                <button
                                    onClick={() => setIsEditingSdg(true)}
                                    className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-gray-500 hover:text-primary hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                >
                                    <Pencil size={13} />
                                    {t('common.edit', 'Edit')}
                                </button>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <button onClick={handleSdgCancel} className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-gray-500 hover:text-red-600 rounded-lg">
                                        <X size={13} /> {t('common.cancel')}
                                    </button>
                                    <button onClick={handleSdgSave} className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-white bg-primary hover:bg-primary-dark rounded-lg">
                                        <Check size={13} /> {t('common.save')}
                                    </button>
                                </div>
                            )
                        )}
                    </div>
                    {!isEditingSdg ? (
                        alignedSdgs.length > 0 ? (
                            <div className="flex flex-wrap gap-3">
                                {alignedSdgs.map(sdg => (
                                    <Tooltip key={sdg.id} text={t('projects.sdgAnalytics.sdgTooltip', { id: sdg.id, name: sdg.name })}>
                                        <img
                                            src={getSdgIconUrl(sdg.id)}
                                            alt={`SDG ${sdg.id}: ${sdg.name}`}
                                            className="w-16 h-16 rounded-lg object-cover transition-transform hover:scale-110 shadow-sm"
                                            loading="lazy"
                                        />
                                    </Tooltip>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {t('projects.overview.sdgEmpty')}
                            </p>
                        )
                    ) : (
                        <>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                                {t('projects.overview.sdgEditHint')}
                            </p>
                            <SdgGoalPicker value={sdgDraft} onChange={setSdgDraft} />
                        </>
                    )}
                </div>
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
