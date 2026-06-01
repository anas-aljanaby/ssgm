// FIX: Added 'useCallback' to the import statement from 'react' to resolve 'Cannot find name' errors.
import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useTabParam } from '../../hooks/useTabParam';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocalization } from '../../hooks/useLocalization';
import { BousalaIcon } from '../icons/ModuleIcons';
import { Bell, ChevronDown, CheckCircle, Clock, Loader, Bot, Sparkles, BrainCircuit, ShieldAlert, BarChart3, Target, Briefcase, CheckSquare, GripVertical, Zap, Settings, Volume2, VolumeX, TrendingUp, TrendingDown, Minus, PlusCircle, AlertCircle as AlertCircleIcon, ArrowRightCircle, XCircle, ClipboardList, Link2, Pencil, Check, X, Trash2, Unlink } from 'lucide-react';
import AiCard from './ai/AiCard';
import Spinner from '../common/Spinner';
import { formatCurrency, formatDate, formatNumber } from '../../lib/utils';
import type { Project as MainProject, HrData, Role, BousalaGoal, BousalaProject, BousalaTask, BousalaKpi, Language } from '../../types';
import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    // FIX: Aliased the 'Tooltip' component from 'recharts' to 'RechartsTooltip' to resolve a name conflict.
    Tooltip as RechartsTooltip,
    Legend,
    LineChart,
    Line
} from 'recharts';
import { useTheme } from '../../hooks/useTheme';
import ReportGenerationModal from './bousala/ReportGenerationModal';
import AddTaskModal from './bousala/AddTaskModal';
import AddGoalModal from './bousala/AddGoalModal';
import { useToast } from '../../hooks/useToast';
import { useQueryClient } from '@tanstack/react-query';
import {
    BOUSALA_QUERY_KEY,
    useBousala,
    useCreateBousalaGoal,
    useCreateBousalaKpi,
    useCreateBousalaTask,
    useDeleteBousalaGoal,
    useDeleteBousalaKpi,
    useDeleteBousalaTask,
    useLinkBousalaProjects,
    useUnlinkBousalaGoalProject,
    useUpdateBousalaGoal,
    useUpdateBousalaGoalProject,
    useUpdateBousalaKpi,
    useUpdateBousalaTask,
    useUpdateBousalaDirection,
    type TaskUpdatePatch as ApiTaskUpdatePatch,
} from '../../hooks/useBousala';
import { isOptimisticId, OPTIMISTIC_HIGHLIGHT_MS } from '../../lib/optimisticSubmit';
import i18n from '../../lib/i18n';

const OPTIMISTIC_TASK_PREFIX = 'optimistic-task-';

function isOptimisticBousalaTask(id: string): boolean {
    return isOptimisticId(id, OPTIMISTIC_TASK_PREFIX);
}
import LinkProjectModal from './bousala/LinkProjectModal';
import { playFeedbackSound } from '../../lib/audioFeedback';
import Tooltip from '../common/Tooltip';
import AddKpiModal from './bousala/AddKpiModal';
import EditKpiModal from './bousala/EditKpiModal';
import { useProjects } from '../../hooks/useProjects';
import KpiCharts from './bousala/KpiCharts';
import PredictiveDashboard from './bousala/PredictiveDashboard';
import SmartAlertsPanel from './bousala/SmartAlertsPanel';
import AlertsCenterPanel from './bousala/AlertsCenterPanel';
import BousalaSectionEmpty from './bousala/BousalaSectionEmpty';
import StatusBadge from './bousala/StatusBadge';
import StrategicDirectionCard from './bousala/StrategicDirectionCard';
import ResponsiblePersonField from './bousala/ResponsiblePersonField';
import type { BousalaDemoState } from '../../lib/bousalaDemoData';
import type { BousalaDirection } from '../../types';

type AiInsight = {
    id: number;
    title: string;
    content: string;
    isDefault?: boolean;
};

const DEFAULT_AI_INSIGHT_IDS = { tasks: -1, kpis: -2, risks: -3 } as const;
type DefaultAiInsightSection = keyof typeof DEFAULT_AI_INSIGHT_IDS;

function buildDefaultAiInsights(t: (key: string) => string): {
    tasks: AiInsight[];
    kpis: AiInsight[];
    risks: AiInsight[];
} {
    return {
        tasks: [{
            id: DEFAULT_AI_INSIGHT_IDS.tasks,
            isDefault: true,
            title: t('bousala.defaultInsights.tasksTitle'),
            content: t('bousala.defaultInsights.tasksContent'),
        }],
        kpis: [{
            id: DEFAULT_AI_INSIGHT_IDS.kpis,
            isDefault: true,
            title: t('bousala.defaultInsights.kpisTitle'),
            content: t('bousala.defaultInsights.kpisContent'),
        }],
        risks: [{
            id: DEFAULT_AI_INSIGHT_IDS.risks,
            isDefault: true,
            title: t('bousala.defaultInsights.risksTitle'),
            content: t('bousala.defaultInsights.risksContent'),
        }],
    };
}

function matchesEnglishDefaultInsight(insight: AiInsight, section: DefaultAiInsightSection): boolean {
    const enDefaults = (i18n.getResourceBundle('en', 'bousala') as { bousala?: { defaultInsights?: Record<string, string> } } | undefined)
        ?.bousala?.defaultInsights;
    if (!enDefaults) return false;
    const titleKey = section === 'tasks' ? 'tasksTitle' : section === 'kpis' ? 'kpisTitle' : 'risksTitle';
    const contentKey = section === 'tasks' ? 'tasksContent' : section === 'kpis' ? 'kpisContent' : 'risksContent';
    return insight.title === enDefaults[titleKey] && insight.content === enDefaults[contentKey];
}

function syncDefaultInsightList(
    list: AiInsight[],
    defaultInsight: AiInsight,
    section: DefaultAiInsightSection,
): AiInsight[] {
    return list.map((item) =>
        item.isDefault
        || item.id === DEFAULT_AI_INSIGHT_IDS[section]
        || matchesEnglishDefaultInsight(item, section)
            ? { ...defaultInsight, id: DEFAULT_AI_INSIGHT_IDS[section] }
            : item,
    );
}

interface BousalaPageProps {
    projects: MainProject[];
    hrData: HrData;
    role: Role;
}

interface KpiSettings {
    interval: 30 | 60 | 120;
    smartRefresh: boolean;
    showAnimation: boolean;
}

interface BousalaNotificationSettings {
    smartAlertsEnabled: boolean;
    severityThreshold: number;
    alertSoundEnabled: boolean;
    aiAutoRecommendationsEnabled: boolean;
}

const LEGACY_SOURCE_PROJECT_MAP: Record<string, string> = {
    P1: 'PROJ-2020-002',
    P2: 'PROJ-2025-003',
};

const KPI_REFRESH_INTERVALS = [30, 60, 120] as const;

function getSourceProjectId(project: BousalaProject): string | undefined {
    if (project.sourceProjectId) return project.sourceProjectId;
    if (project.id.startsWith('BP-')) return project.id.slice(3);
    return LEGACY_SOURCE_PROJECT_MAP[project.id];
}

function recalculateGoalProgress(projects: BousalaProject[], goal: BousalaGoal): number {
    const linked = projects.filter(p => goal.linkedProjects.includes(p.id));
    if (linked.length === 0) return goal.progress;
    return Math.round(linked.reduce((sum, p) => sum + p.progress, 0) / linked.length);
}

function loadKpiSettings(): KpiSettings {
    const defaults: KpiSettings = { interval: 60, smartRefresh: true, showAnimation: true };
    try {
        const raw = sessionStorage.getItem('bousalaKpiSettings');
        if (!raw) return defaults;
        const parsed = JSON.parse(raw) as Partial<KpiSettings>;
        const interval = KPI_REFRESH_INTERVALS.includes(parsed.interval as (typeof KPI_REFRESH_INTERVALS)[number])
            ? (parsed.interval as KpiSettings['interval'])
            : defaults.interval;
        return {
            interval,
            smartRefresh: parsed.smartRefresh !== false,
            showAnimation: parsed.showAnimation !== false,
        };
    } catch {
        return defaults;
    }
}

function loadNotificationSettings(): BousalaNotificationSettings {
    const defaults: BousalaNotificationSettings = {
        smartAlertsEnabled: true,
        severityThreshold: 70,
        alertSoundEnabled: true,
        aiAutoRecommendationsEnabled: true,
    };
    try {
        const raw = sessionStorage.getItem('bousalaNotificationSettings');
        if (!raw) return defaults;
        const parsed = JSON.parse(raw) as Partial<BousalaNotificationSettings>;
        const threshold = typeof parsed.severityThreshold === 'number'
            ? Math.min(90, Math.max(50, Math.round(parsed.severityThreshold / 10) * 10))
            : defaults.severityThreshold;
        return {
            smartAlertsEnabled: parsed.smartAlertsEnabled !== false,
            severityThreshold: threshold,
            alertSoundEnabled: parsed.alertSoundEnabled !== false,
            aiAutoRecommendationsEnabled: parsed.aiAutoRecommendationsEnabled !== false,
        };
    } catch {
        return defaults;
    }
}

// --- SUB-COMPONENTS ---
const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
    const createMarkup = (text: string) => {
        const html = text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
            .replace(/^- (.*)/gm, '<li class="list-disc ms-4">$1</li>'); // List items
        return { __html: html.replace(/\n/g, '<br />').replace(/<br \/><li/g, '<li') };
    };
    return <div className="text-sm space-y-2" dangerouslySetInnerHTML={createMarkup(content)} />;
};


const ProgressBar: React.FC<{ progress: number, color?: string }> = ({ progress, color = 'bg-primary' }) => {
    const { t, language } = useLocalization(['common', 'bousala']);
    return (
        <div className="group">
            <div className="flex justify-between text-sm font-semibold mb-1">
                <span>{t('bousala.common.progressLabel')}</span>
                <span>{formatNumber(progress, language)}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2.5">
                <div 
                    className={`${color} h-2.5 rounded-full transition-all duration-300 group-hover:shadow-lg group-hover:shadow-primary/50 group-hover:brightness-110`}
                    style={{ width: `${progress}%` }}
                ></div>
            </div>
        </div>
    );
};

const KpiCard: React.FC<{
    kpi: BousalaKpi;
    isRefreshing: boolean;
    isPredicting: boolean;
    showAnimation: boolean;
    onEdit: () => void;
    onDelete: () => void;
}> = ({ kpi, isRefreshing, isPredicting, showAnimation, onEdit, onDelete }) => {
    const { t, language } = useLocalization(['common', 'bousala']);
    const progress = (kpi.value / kpi.target) * 100;
    const trendConfig = {
        up: { icon: <TrendingUp className="w-4 h-4 text-green-500" />, color: 'text-green-500' },
        down: { icon: <TrendingDown className="w-4 h-4 text-red-500" />, color: 'text-red-500' },
        stable: { icon: <Minus className="w-4 h-4 text-gray-500" />, color: 'text-gray-500' },
    };

    const getPredictionColor = (status: BousalaKpi['prediction']['status']) => {
        if (status === 'On Track') return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
        if (status === 'At Risk') return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
    };

    const getPredictionIcon = (status: BousalaKpi['prediction']['status']) => {
        if (status === 'On Track') return <ArrowRightCircle size={12} />;
        if (status === 'At Risk') return <AlertCircleIcon size={12} />;
        return <XCircle size={12} />;
    };


    return (
        <div className="bg-white dark:bg-slate-700/50 p-3 rounded-lg flex flex-col justify-between h-full">
            <div>
                <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                        <h5 className="font-semibold text-sm flex items-center gap-2 min-w-0" dir="auto">
                            {kpi.title}
                            {showAnimation && isRefreshing && <Loader size={12} className="animate-spin text-primary" />}
                        </h5>
                        {kpi.description && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-snug" dir="auto">{kpi.description}</p>
                        )}
                    </div>
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                        <button type="button" onClick={onEdit} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-600 text-gray-500" aria-label={t('bousala.kpiEdit.editAria')}>
                            <Pencil size={14} />
                        </button>
                        <button type="button" onClick={onDelete} className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500" aria-label={t('bousala.kpiEdit.deleteAria')}>
                            <Trash2 size={14} />
                        </button>
                        <Tooltip text={t('bousala.common.lastUpdated', { date: formatDate(kpi.lastUpdated, language) })}>
                            {trendConfig[kpi.trend].icon}
                        </Tooltip>
                    </div>
                </div>
                <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-2xl font-bold">{formatNumber(kpi.value, language)}</span>
                    <span className="text-sm text-gray-500">/ {formatNumber(kpi.target, language)} {kpi.unit}</span>
                </div>
                 <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                    <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${progress}%` }}></div>
                </div>
            </div>

            <div className="mt-3">
                {isPredicting ? (
                    <div className="text-xs font-bold flex items-center gap-1 text-gray-500 animate-pulse">
                        <Sparkles size={12} />
                        {t('bousala.common.predictiveAnalysis')}
                    </div>
                ) : kpi.prediction && (
                    <Tooltip text={t('bousala.common.predictionConfidence', { percentage: kpi.prediction.probability })}>
                        <div className={`text-xs font-bold px-2 py-1 rounded-full inline-flex items-center gap-1 ${getPredictionColor(kpi.prediction.status)}`}>
                            {getPredictionIcon(kpi.prediction.status)}
                            {kpi.prediction.status === 'On Track' ? t('bousala.common.onTrack') : kpi.prediction.status === 'At Risk' ? t('bousala.common.atRisk') : t('bousala.common.unlikely')} ({kpi.prediction.probability}%)
                        </div>
                    </Tooltip>
                )}
            </div>

        </div>
    );
};

type TaskUpdatePatch = Pick<BousalaTask, 'assignee' | 'status'>;

const TaskItem: React.FC<{
    task: BousalaTask;
    volunteers: HrData['volunteers'];
    hrData: HrData;
    unassignedLabel: string;
    highlighted?: boolean;
    isUpdating?: boolean;
    onUpdate: (taskId: string, patch: TaskUpdatePatch) => void | Promise<void>;
    onDelete: (taskId: string) => void;
}> = ({ task, volunteers, hrData, unassignedLabel, highlighted = false, isUpdating = false, onUpdate, onDelete }) => {
    const { t, language } = useLocalization(['common', 'bousala']);
    const optimistic = isOptimisticBousalaTask(task.id);
    const disabled = optimistic || isUpdating;

    const handleAssigneeChange = (assignee: string) => {
        const next = assignee.trim() || unassignedLabel;
        if (next === task.assignee) return;
        void onUpdate(task.id, { assignee: next });
    };

    const taskMeta = optimistic || isUpdating
        ? t('common.saving')
        : [
            `${t('bousala.common.assigneeLabel')}: ${task.assignee}`,
            task.dueDate ? t('bousala.common.taskDueDate', { date: formatDate(task.dueDate, language) }) : null,
            task.priority ? t('bousala.common.taskPriority', { priority: t(`bousala.addTaskModal.priorities.${task.priority}`) }) : null,
        ].filter(Boolean).join(' · ');

    const handleStatusChange = (status: BousalaTask['status']) => {
        if (status === task.status) return;
        void onUpdate(task.id, { status });
    };

    return (
        <div className={`flex items-center justify-between p-4 bg-white dark:bg-slate-700/50 rounded-xl shadow-sm transition-shadow ${
            disabled
                ? 'opacity-70'
                : 'hover:shadow-md'
        } ${optimistic ? 'animate-pulse' : ''} ${highlighted ? 'ring-2 ring-emerald-300 dark:ring-emerald-700' : ''}`}>
            <div className="flex items-center gap-3 min-w-0">
                <CheckSquare className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <div className="min-w-0">
                    <p className="font-semibold truncate" dir="auto">{task.title}</p>
                    <p className="text-xs text-gray-500" dir="auto">{taskMeta}</p>
                </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
                <label className="sr-only">{t('bousala.common.assignTaskTo')}</label>
                <ResponsiblePersonField
                    value={task.assignee === unassignedLabel ? '' : task.assignee}
                    onChange={handleAssigneeChange}
                    disabled={disabled}
                    hrData={hrData}
                    id={`task-assignee-${task.id}`}
                    className="p-1.5 text-xs border rounded-md bg-gray-50 dark:bg-slate-800 w-40 max-w-[10rem] disabled:opacity-50"
                />
                <label className="sr-only">{t('bousala.taskEdit.statusLabel')}</label>
                <select
                    value={task.status}
                    onChange={e => handleStatusChange(e.target.value as BousalaTask['status'])}
                    disabled={disabled}
                    className={`p-1.5 text-xs font-semibold border rounded-md bg-gray-50 dark:bg-slate-800 disabled:opacity-50 ${
                        task.status === 'completed'
                            ? 'text-green-700 dark:text-green-300'
                            : 'text-yellow-700 dark:text-yellow-300'
                    }`}
                >
                    <option value="in-progress">{t('bousala.task_status.in-progress')}</option>
                    <option value="completed">{t('bousala.task_status.completed')}</option>
                </select>
                {isUpdating && <Loader size={16} className="animate-spin text-primary" />}
                <button
                    type="button"
                    onClick={() => onDelete(task.id)}
                    disabled={disabled}
                    className="p-1.5 rounded-md text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 disabled:opacity-50"
                    aria-label={t('bousala.taskEdit.deleteAria')}
                >
                    <Trash2 size={16} />
                </button>
            </div>
        </div>
    );
};

type ProjectEditForm = { title: string; description: string; status: string };

const ProjectItem: React.FC<{
    project: BousalaProject;
    tasks: BousalaTask[];
    highlightedTaskId?: string | null;
    updatingTaskId?: string | null;
    unassignedLabel: string;
    isAiLoading: boolean;
    onSuggestTasks: () => void;
    onPredictRisk: () => void;
    onUpdateTask: (taskId: string, patch: TaskUpdatePatch) => void | Promise<void>;
    onDeleteTask: (taskId: string) => void;
    onSaveProject: (projectId: string, data: ProjectEditForm) => void | Promise<void>;
    onUnlinkProject: (projectId: string) => void;
    isSavingProject?: boolean;
    mainProjects: MainProject[];
    volunteers: HrData['volunteers'];
    hrData: HrData;
}> = ({ project, tasks, highlightedTaskId = null, updatingTaskId = null, unassignedLabel, isAiLoading, onSuggestTasks, onPredictRisk, onUpdateTask, onDeleteTask, onSaveProject, onUnlinkProject, isSavingProject = false, mainProjects, volunteers, hrData }) => {
    const { t, language, pickLocalized } = useLocalization(['common', 'bousala', 'projects']);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [form, setForm] = useState<ProjectEditForm>({
        title: project.title,
        description: project.description,
        status: project.status ?? '',
    });
    const [titleError, setTitleError] = useState<string | undefined>();
    const statusOptions = useMemo(
        () => Object.values(t('bousala.statusOptions', { returnObjects: true }) as Record<string, string>),
        [t],
    );

    useEffect(() => {
        if (!isEditing) {
            setForm({
                title: project.title,
                description: project.description,
                status: project.status ?? '',
            });
            setTitleError(undefined);
        }
    }, [project.title, project.description, project.status, isEditing]);

    const sourceId = getSourceProjectId(project);
    const linkedSystemProject = sourceId ? mainProjects.find(p => p.id === sourceId) : undefined;

    const handleProjectSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.title.trim()) {
            setTitleError(t('bousala.projectEdit.titleRequired'));
            return;
        }
        try {
            await Promise.resolve(onSaveProject(project.id, {
                title: form.title.trim(),
                description: form.description.trim(),
                status: form.status,
            }));
            setIsEditing(false);
        } catch {
            // Parent handles errors.
        }
    };

    return (
        <div className="bg-gray-50 dark:bg-slate-800/50 p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-2">
                <button type="button" onClick={() => setIsExpanded(!isExpanded)} className="flex-1 flex items-start justify-between text-left min-w-0">
                    <div className="flex items-start gap-4 min-w-0">
                        <Briefcase className="w-6 h-6 text-gray-600 dark:text-gray-400 mt-1 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                            {isEditing ? (
                                <form onSubmit={handleProjectSave} className="space-y-2" onClick={e => e.stopPropagation()}>
                                    <input
                                        type="text"
                                        value={form.title}
                                        onChange={e => { setForm(f => ({ ...f, title: e.target.value })); if (titleError) setTitleError(undefined); }}
                                        disabled={isSavingProject}
                                        className="w-full p-2 border rounded-md bg-white dark:bg-slate-800 text-base font-bold disabled:opacity-50"
                                        dir="auto"
                                    />
                                    {titleError && <p className="text-xs text-red-600">{titleError}</p>}
                                    <textarea
                                        value={form.description}
                                        onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                        rows={2}
                                        disabled={isSavingProject}
                                        className="w-full p-2 border rounded-md bg-white dark:bg-slate-800 text-sm disabled:opacity-50"
                                        dir="auto"
                                    />
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-1">{t('bousala.projectEdit.status')}</label>
                                        <select
                                            value={form.status}
                                            onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                                            disabled={isSavingProject}
                                            className="w-full p-2 border rounded-md bg-white dark:bg-slate-800 text-sm disabled:opacity-50"
                                        >
                                            <option value="">—</option>
                                            {statusOptions.map(option => (
                                                <option key={option} value={option}>{option}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex gap-2 justify-end">
                                        <button type="submit" disabled={isSavingProject} className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded bg-primary text-white disabled:opacity-50">
                                            {isSavingProject ? <Loader size={12} className="animate-spin" /> : <Check size={12} />}
                                            {isSavingProject ? t('common.saving') : t('common.save')}
                                        </button>
                                        <button type="button" onClick={() => setIsEditing(false)} disabled={isSavingProject} className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded border disabled:opacity-50">
                                            <X size={12} /> {t('common.cancel')}
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <>
                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                        <h4 className="font-bold text-lg text-foreground dark:text-dark-foreground" dir="auto">{project.title}</h4>
                                        <StatusBadge status={project.status} />
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400" dir="auto">{project.description}</p>
                                </>
                            )}
                        </div>
                    </div>
                    <ChevronDown className={`w-5 h-5 transition-transform flex-shrink-0 ms-2 ${isExpanded ? 'rotate-180' : ''}`} />
                </button>
                {!isEditing && (
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                        <button type="button" onClick={() => setIsEditing(true)} className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-500" aria-label={t('bousala.projectEdit.editAria')}>
                            <Pencil size={16} />
                        </button>
                        <button type="button" onClick={() => onUnlinkProject(project.id)} className="p-1.5 rounded hover:bg-amber-50 dark:hover:bg-amber-900/30 text-amber-700 dark:text-amber-300" aria-label={t('bousala.projectEdit.unlinkAria')}>
                            <Unlink size={16} />
                        </button>
                    </div>
                )}
            </div>
            <div className="mt-4">
                <ProgressBar progress={project.progress} />
            </div>
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0, marginTop: 0 }}
                        animate={{ height: 'auto', opacity: 1, marginTop: '1.25rem' }}
                        exit={{ height: 0, opacity: 0, marginTop: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="space-y-3">
                            <h5 className="font-semibold text-sm">{t('bousala.common.linkedTasks')}:</h5>
                            {tasks.length === 0 ? (
                                <p className="text-center text-sm text-gray-500 py-3" dir="auto">{t('bousala.empty.noTasks.description')}</p>
                            ) : tasks.map(task => (
                                <TaskItem
                                    key={task.id}
                                    task={task}
                                    volunteers={volunteers}
                                    hrData={hrData}
                                    unassignedLabel={unassignedLabel}
                                    highlighted={highlightedTaskId === task.id}
                                    isUpdating={updatingTaskId === task.id}
                                    onUpdate={onUpdateTask}
                                    onDelete={onDeleteTask}
                                />
                            ))}
                            <div className="flex gap-2 pt-2">
                                <button disabled={isAiLoading} onClick={onSuggestTasks} className="flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold border rounded-lg hover:bg-gray-100 disabled:opacity-50"><Sparkles size={14}/> {t('bousala.common.suggestTasksAi')}</button>
                                <button disabled={isAiLoading} onClick={onPredictRisk} className="flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold border rounded-lg hover:bg-gray-100 disabled:opacity-50"><ShieldAlert size={14}/> {t('bousala.common.predictRiskAi')}</button>
                            </div>
                            {linkedSystemProject && (
                                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
                                    <h5 className="font-semibold text-sm mb-2">{t('bousala.common.linkedExecutionProject')}:</h5>
                                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm space-y-1">
                                        <p className="font-bold text-blue-800 dark:text-blue-300">{pickLocalized(linkedSystemProject.name)}</p>
                                        <p><strong>{t('bousala.common.budget')}:</strong> {formatCurrency(linkedSystemProject.budget, language)}</p>
                                        <p><strong>{t('bousala.common.progress')}:</strong> {formatNumber(linkedSystemProject.progress, language)}%</p>
                                        <h6 className="font-semibold mt-2">{t('bousala.common.kpiIndicators')}:</h6>
                                        <ul className="list-disc list-inside text-xs">
                                            {(linkedSystemProject.kpis ?? []).map(kpi => (
                                                <li key={kpi.id} dir="auto">{kpi.name}: {kpi.target}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

type GoalEditForm = {
    title: string;
    description: string;
    responsiblePerson: string;
    status: string;
};

const GoalCard: React.FC<{
    goal: BousalaGoal;
    isExpanded: boolean;
    isAiLoading: boolean;
    isSaving: boolean;
    hrData: HrData;
    onToggle: () => void;
    onAnalyze: () => void;
    onAddKpiClick: () => void;
    onSave: (goalId: string, data: GoalEditForm) => void | Promise<void>;
    onDelete: (goalId: string) => void;
    isRefreshingKpis: boolean;
    showAnimation: boolean;
    isPredicting: boolean;
}> = ({ goal, isExpanded, isAiLoading, isSaving, hrData, onToggle, onAnalyze, onAddKpiClick, onSave, onDelete, isRefreshingKpis, showAnimation, isPredicting }) => {
    const { t } = useLocalization(['common', 'bousala']);
    const [isEditing, setIsEditing] = useState(false);
    const [form, setForm] = useState<GoalEditForm>({
        title: goal.title,
        description: goal.description,
        responsiblePerson: goal.responsiblePerson,
        status: goal.status ?? '',
    });
    const [titleError, setTitleError] = useState<string | undefined>();
    const statusOptions = useMemo(
        () => Object.values(t('bousala.statusOptions', { returnObjects: true }) as Record<string, string>),
        [t],
    );

    useEffect(() => {
        if (!isEditing) {
            setForm({
                title: goal.title,
                description: goal.description,
                responsiblePerson: goal.responsiblePerson,
                status: goal.status ?? '',
            });
            setTitleError(undefined);
        }
    }, [goal.title, goal.description, goal.responsiblePerson, goal.status, isEditing]);

    const handleCancel = () => {
        setForm({
            title: goal.title,
            description: goal.description,
            responsiblePerson: goal.responsiblePerson,
            status: goal.status ?? '',
        });
        setTitleError(undefined);
        setIsEditing(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.title.trim()) {
            setTitleError(t('bousala.goalEdit.titleRequired'));
            return;
        }
        try {
            await Promise.resolve(onSave(goal.id, {
                title: form.title.trim(),
                description: form.description.trim(),
                responsiblePerson: form.responsiblePerson.trim(),
                status: form.status,
            }));
            setIsEditing(false);
        } catch {
            // Parent shows errors; keep edit mode open.
        }
    };

    return (
        <div className="bg-card dark:bg-dark-card rounded-t-xl shadow-soft border dark:border-slate-700/50 overflow-hidden">
            <div className="p-6">
                <div className="flex justify-between items-start gap-3">
                    <div className="flex items-start gap-4 min-w-0 flex-1">
                        <Target className="w-8 h-8 text-primary dark:text-secondary flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                            {isEditing ? (
                                <form onSubmit={handleSubmit} className="space-y-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500">{t('bousala.addGoalModal.goalTitle')}</label>
                                        <input
                                            type="text"
                                            value={form.title}
                                            onChange={e => { setForm(f => ({ ...f, title: e.target.value })); if (titleError) setTitleError(undefined); }}
                                            disabled={isSaving}
                                            className="mt-1 w-full p-2 border rounded-md bg-gray-50 dark:bg-slate-800 text-base font-bold disabled:opacity-50"
                                            dir="auto"
                                        />
                                        {titleError && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{titleError}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500">{t('bousala.addGoalModal.description')}</label>
                                        <textarea
                                            value={form.description}
                                            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                            rows={3}
                                            disabled={isSaving}
                                            className="mt-1 w-full p-2 border rounded-md bg-gray-50 dark:bg-slate-800 text-sm disabled:opacity-50"
                                            dir="auto"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500">{t('bousala.addGoalModal.responsiblePerson')}</label>
                                        <ResponsiblePersonField
                                            value={form.responsiblePerson}
                                            onChange={value => setForm(f => ({ ...f, responsiblePerson: value }))}
                                            disabled={isSaving}
                                            hrData={hrData}
                                            className="mt-1 w-full p-2 border rounded-md bg-gray-50 dark:bg-slate-800 text-sm disabled:opacity-50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500">{t('bousala.goalEdit.status')}</label>
                                        <select
                                            value={form.status}
                                            onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                                            disabled={isSaving}
                                            className="mt-1 w-full p-2 border rounded-md bg-gray-50 dark:bg-slate-800 text-sm disabled:opacity-50"
                                        >
                                            <option value="">—</option>
                                            {statusOptions.map(option => (
                                                <option key={option} value={option}>{option}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex flex-wrap justify-end gap-2 pt-1">
                                        <button
                                            type="submit"
                                            disabled={isSaving}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold disabled:opacity-50"
                                        >
                                            {isSaving ? <Loader size={14} className="animate-spin" /> : <Check size={14} />}
                                            {isSaving ? t('common.saving') : t('common.save')}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleCancel}
                                            disabled={isSaving}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-50"
                                        >
                                            <X size={14} /> {t('common.cancel')}
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h3 className="font-bold text-xl text-primary dark:text-secondary" dir="auto">{goal.title}</h3>
                                        <StatusBadge status={goal.status} />
                                    </div>
                                    {goal.description && (
                                        <p className="text-sm text-gray-500 mt-1" dir="auto">{goal.description}</p>
                                    )}
                                    {goal.responsiblePerson && (
                                        <p className="text-xs text-gray-500 mt-2">
                                            <span className="font-semibold">{t('bousala.addGoalModal.responsiblePerson')}:</span>{' '}
                                            <span dir="auto">{goal.responsiblePerson}</span>
                                        </p>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                    <div className="flex items-start gap-1 flex-shrink-0">
                        {!isEditing && (
                            <>
                                <button
                                    type="button"
                                    onClick={() => setIsEditing(true)}
                                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700/50 text-gray-500 hover:text-foreground"
                                    aria-label={t('bousala.goalEdit.editAria')}
                                >
                                    <Pencil size={18} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onDelete(goal.id)}
                                    className="p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500"
                                    aria-label={t('bousala.goalEdit.deleteAria')}
                                >
                                    <Trash2 size={18} />
                                </button>
                            </>
                        )}
                        <button type="button" onClick={onToggle} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700/50 flex-shrink-0">
                            <ChevronDown className={`w-6 h-6 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                    </div>
                </div>
                 <div className="mt-4">
                     <ProgressBar progress={goal.progress} />
                </div>
                 <div className="mt-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <button disabled={isAiLoading} onClick={onAnalyze} className="flex items-center gap-2 py-2 px-4 text-sm font-semibold border rounded-lg hover:bg-gray-100 disabled:opacity-50"><BrainCircuit size={16}/> {t('bousala.aiSuggestions')}</button>
                    </div>
                    <div>
                         <button onClick={onAddKpiClick} className="flex items-center gap-1 text-xs font-semibold text-primary dark:text-secondary-light hover:underline">
                            <PlusCircle size={14} /> {t('bousala.common.addKpi')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const AccordionSection: React.FC<{
    title: string;
    icon: React.ReactNode;
    isLoading: boolean;
    insights: AiInsight[];
}> = ({ title, icon, isLoading, insights }) => {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <div className="border-b dark:border-slate-700/50">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center p-3 text-left hover:bg-gray-50 dark:hover:bg-slate-800/50">
                <h4 className="font-bold flex items-center gap-2 text-foreground dark:text-dark-foreground">
                    {icon}
                    {title}
                </h4>
                <ChevronDown className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="p-4 space-y-3">
                            {isLoading ? (
                                <div className="flex justify-center items-center h-24">
                                    <Spinner />
                                </div>
                            ) : (
                                insights.map(insight => (
                                    <div key={insight.id} className="bg-white/50 dark:bg-black/20 p-3 rounded-lg">
                                        <h5 className="font-semibold text-sm" dir="auto">{insight.title}</h5>
                                        <div dir="auto">
                                            <MarkdownRenderer content={insight.content} />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const SmartAiPanel: React.FC<{ 
    loadingSection: 'tasks' | 'kpis' | 'risks' | null; 
    insights: { tasks: AiInsight[], kpis: AiInsight[], risks: AiInsight[] };
    onAddTaskClick: () => void;
    onAddGoalClick: () => void;
    onLinkProjectClick: () => void;
    onViewReportsClick: () => void;
    aiAnalyticsSummary: string;
}> = ({ loadingSection, insights, onAddTaskClick, onAddGoalClick, onLinkProjectClick, onViewReportsClick, aiAnalyticsSummary }) => {
    const { t } = useLocalization();
    const [isPanelOpen, setIsPanelOpen] = useState(true);

    return (
        <div className="bg-card dark:bg-dark-card rounded-2xl shadow-soft border dark:border-slate-700/50">
            <button onClick={() => setIsPanelOpen(!isPanelOpen)} className="w-full flex items-center justify-between p-4 text-left">
                 <h3 className="font-bold text-lg flex items-center gap-2"><Bot className="text-primary"/> {t('bousala.aiPanel.title')}</h3>
                 <div className="flex items-center gap-2">
                     <GripVertical size={20} className="cursor-grab text-gray-400"/>
                     <ChevronDown className={`transition-transform ${isPanelOpen ? 'rotate-180' : ''}`} />
                 </div>
            </button>
            <AnimatePresence>
                {isPanelOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="border-t dark:border-slate-700/50">
                             {aiAnalyticsSummary && (
                                <div className="p-4 border-b dark:border-slate-700/50">
                                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
                                        <h4 className="font-bold text-blue-800 dark:text-blue-200">{t('bousala.aiPanel.predictiveHeading')}</h4>
                                        <p className="text-sm mt-1 text-blue-700 dark:text-blue-300" dir="auto">{aiAnalyticsSummary}</p>
                                    </div>
                                </div>
                            )}
                            <AccordionSection
                                title={t('bousala.aiPanel.recommendations')} 
                                icon={<Sparkles size={16} className="text-blue-500" />} 
                                isLoading={loadingSection === 'tasks'} 
                                insights={insights.tasks}
                            />
                            <AccordionSection
                                title={t('bousala.aiPanel.performanceInsights')} 
                                icon={<BrainCircuit size={16} className="text-purple-500" />} 
                                isLoading={loadingSection === 'kpis'} 
                                insights={insights.kpis}
                            />
                            <AccordionSection
                                title={t('bousala.aiPanel.riskForecast')} 
                                icon={<ShieldAlert size={16} className="text-red-500" />} 
                                isLoading={loadingSection === 'risks'} 
                                insights={insights.risks}
                            />
                             <div className="p-4 border-t dark:border-slate-700/50">
                                <h4 className="font-bold flex items-center gap-2 mb-3 text-foreground dark:text-dark-foreground">
                                    <Zap size={16} className="text-green-500" />
                                    {t('bousala.aiPanel.suggestedActions')}
                                </h4>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <button onClick={onAddGoalClick} className="p-2 bg-gray-100 dark:bg-slate-700/50 rounded-lg text-left hover:bg-gray-200 dark:hover:bg-slate-700 flex items-center gap-1.5"><PlusCircle size={14} /> {t('bousala.aiPanel.actions.addGoal')}</button>
                                    <button onClick={onAddTaskClick} className="p-2 bg-gray-100 dark:bg-slate-700/50 rounded-lg text-left hover:bg-gray-200 dark:hover:bg-slate-700 flex items-center gap-1.5"><ClipboardList size={14} /> {t('bousala.aiPanel.actions.addTask')}</button>
                                    <button onClick={onLinkProjectClick} className="p-2 bg-gray-100 dark:bg-slate-700/50 rounded-lg text-left hover:bg-gray-200 dark:hover:bg-slate-700 flex items-center gap-1.5"><Link2 size={14} /> {t('bousala.aiPanel.actions.linkProject')}</button>
                                    <button onClick={onViewReportsClick} className="p-2 bg-gray-100 dark:bg-slate-700/50 rounded-lg text-left hover:bg-gray-200 dark:hover:bg-slate-700 flex items-center gap-1.5"><BarChart3 size={14} /> {t('bousala.aiPanel.actions.viewReports')}</button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const AnalyticsDashboard: React.FC<{ goals: BousalaGoal[]; projects: BousalaProject[] }> = ({ goals, projects }) => {
    const { theme } = useTheme();
    const { t } = useLocalization();
    const isDark = theme === 'dark';

    const textColor = isDark ? '#f1f5f9' : '#334155';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    const COLORS = ['hsl(210, 40%, 50%)', 'hsl(145, 63%, 49%)', '#FFBB28', '#FF8042'];

    const goalProgressData = goals.map(g => ({ name: g.title, value: g.progress }));
    const projectProgressData = projects.map(p => ({ name: p.title, progress: p.progress }));

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Goal Progress Pie Chart */}
            <div className="lg:col-span-1 bg-card dark:bg-dark-card/50 p-4 rounded-xl shadow-md border dark:border-slate-700/50">
                <h4 className="font-bold text-center mb-2">{t('bousala.analytics.goalProgress')}</h4>
                <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                        <Pie data={goalProgressData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}>
                            {goalProgressData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <RechartsTooltip formatter={(value) => `${value}%`} />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            {/* Project Comparison Bar Chart */}
            <div className="lg:col-span-2 bg-card dark:bg-dark-card/50 p-4 rounded-xl shadow-md border dark:border-slate-700/50">
                 <h4 className="font-bold text-center mb-2">{t('bousala.analytics.projectComparison')}</h4>
                 <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={projectProgressData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                        <XAxis dataKey="name" tick={{ fill: textColor, fontSize: 10 }} />
                        <YAxis domain={[0, 100]} tick={{ fill: textColor }} />
                        <RechartsTooltip formatter={(value) => `${value}%`} />
                        <Bar dataKey="progress" fill="hsl(145, 63%, 49%)" />
                    </BarChart>
                 </ResponsiveContainer>
            </div>
            
        </div>
    );
};

const CollapsibleAnalytics: React.FC<{ goals: BousalaGoal[]; projects: BousalaProject[] }> = ({ goals, projects }) => {
    const { t } = useLocalization();
    const [isOpen, setIsOpen] = useState(true);
    
    return (
        <div className="bg-card dark:bg-dark-card rounded-xl shadow-soft border dark:border-slate-700/50 overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center p-4 text-left"
            >
                <h2 className="text-xl font-bold flex items-center gap-2"><BarChart3 size={20} /> {t('bousala.analytics.title')}</h2>
                <ChevronDown className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="p-4 border-t dark:border-slate-700/50">
                            <AnalyticsDashboard goals={goals} projects={projects} />
                            <div className="mt-8 pt-8 border-t dark:border-slate-700/50">
                                <h2 className="text-xl font-bold flex items-center gap-2 mb-4"><TrendingUp size={20} /> {t('bousala.kpisVisualization')}</h2>
                                <KpiCharts goals={goals} />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

const ToggleSwitch: React.FC<{ checked: boolean; onChange: (checked: boolean) => void; id?: string }> = ({ checked, onChange, id }) => (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`${checked ? 'bg-green-500' : 'bg-gray-300 dark:bg-slate-600'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out`}
    >
      <span
        aria-hidden="true"
        className={`${checked ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
      />
    </button>
);

const InPresentationAlert: React.FC<{ alert: { message: string; icon: React.ReactNode } | null }> = ({ alert }) => {
    return (
        <AnimatePresence>
            {alert && (
                <motion.div
                    initial={{ opacity: 0, y: 50, x: -50 }}
                    animate={{ opacity: 1, y: 0, x: 0 }}
                    exit={{ opacity: 0, y: 50, x: 0 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                    className="fixed bottom-4 left-4 z-[100] pointer-events-none"
                    style={{direction: 'ltr'}} // Force LTR for positioning
                >
                   <div className="bg-slate-800/80 text-white backdrop-blur-md rounded-xl p-4 flex items-center gap-3 shadow-2xl pointer-events-auto">
                       {alert.icon}
                       <span className="font-semibold">{alert.message}</span>
                   </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};


// --- MAIN PAGE COMPONENT ---

const BOUSALA_VIEW_TABS = ['dashboard', 'predictive'] as const;

const BousalaPage: React.FC<BousalaPageProps> = ({ projects: mainProjects, hrData, role }) => {
    const { t, language, dir } = useLocalization(['common', 'bousala', 'projects', 'misc']);
    const toast = useToast();
    const { data: apiProjects } = useProjects();
    const linkableProjects = useMemo(
        () => (apiProjects && apiProjects.length > 0 ? apiProjects : mainProjects),
        [apiProjects, mainProjects],
    );
    const [aiAnalyticsSummary, setAiAnalyticsSummary] = useState('');
    const [activeView, setActiveView] = useTabParam('tab', 'dashboard', BOUSALA_VIEW_TABS);
    const [presentationAlert, setPresentationAlert] = useState<{ message: string; icon: React.ReactNode } | null>(null);


    const queryClient = useQueryClient();
    const { data: bousalaQueryData, isLoading: isBousalaLoading, isError: isBousalaError } = useBousala();
    const createGoalMutation = useCreateBousalaGoal();
    const updateGoalMutation = useUpdateBousalaGoal();
    const deleteGoalMutation = useDeleteBousalaGoal();
    const createKpiMutation = useCreateBousalaKpi();
    const updateKpiMutation = useUpdateBousalaKpi();
    const deleteKpiMutation = useDeleteBousalaKpi();
    const linkProjectsMutation = useLinkBousalaProjects();
    const updateGoalProjectMutation = useUpdateBousalaGoalProject();
    const unlinkProjectMutation = useUnlinkBousalaGoalProject();
    const createTaskMutation = useCreateBousalaTask();
    const updateTaskMutation = useUpdateBousalaTask();
    const updateDirectionMutation = useUpdateBousalaDirection();
    const deleteTaskMutation = useDeleteBousalaTask();

    const emptyBousalaState = useMemo<BousalaDemoState>(() => ({ goals: [], projects: [], tasks: [] }), []);
    const bousalaState = bousalaQueryData ?? emptyBousalaState;
    const [isSavingDirection, setIsSavingDirection] = useState(false);

    const setBousalaState = useCallback((updater: BousalaDemoState | ((prev: BousalaDemoState) => BousalaDemoState)) => {
        queryClient.setQueryData(BOUSALA_QUERY_KEY, (old) => {
            const prev = old ?? emptyBousalaState;
            return typeof updater === 'function' ? updater(prev) : updater;
        });
    }, [queryClient, emptyBousalaState]);

    const [expandedGoal, setExpandedGoal] = useState<string | null>(null);
    const initialGoalExpandDoneRef = useRef(false);

    useEffect(() => {
        if (bousalaState.goals.length === 0) {
            initialGoalExpandDoneRef.current = false;
            return;
        }
        if (initialGoalExpandDoneRef.current) return;
        setExpandedGoal(bousalaState.goals[0].id);
        initialGoalExpandDoneRef.current = true;
    }, [bousalaState.goals]);
    const [aiLoading, setAiLoading] = useState<'tasks' | 'kpis' | 'risks' | null>(null);
    const [aiInsights, setAiInsights] = useState(() => buildDefaultAiInsights(t));

    useEffect(() => {
        const defaults = buildDefaultAiInsights(t);
        setAiInsights((prev) => ({
            tasks: syncDefaultInsightList(prev.tasks, defaults.tasks[0], 'tasks'),
            kpis: syncDefaultInsightList(prev.kpis, defaults.kpis[0], 'kpis'),
            risks: syncDefaultInsightList(prev.risks, defaults.risks[0], 'risks'),
        }));
    }, [language, t]);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
    const [isAddGoalModalOpen, setIsAddGoalModalOpen] = useState(false);
    const [isLinkProjectModalOpen, setIsLinkProjectModalOpen] = useState(false);
    const [isPresentationMode, setIsPresentationMode] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const settingsRef = useRef<HTMLDivElement>(null);
    const [isAddKpiModalOpen, setIsAddKpiModalOpen] = useState(false);
    const [goalForNewKpi, setGoalForNewKpi] = useState<string | null>(null);
    const [refreshingKpiIds, setRefreshingKpiIds] = useState<Set<string>>(new Set());
    const [predictingKpiIds, setPredictingKpiIds] = useState<Set<string>>(new Set());
    const [predictingGoals, setPredictingGoals] = useState<Set<string>>(new Set());

    const [isAlertsCenterOpen, setIsAlertsCenterOpen] = useState(false);
    const [alertCount, setAlertCount] = useState(0);
    const [initialTaskData, setInitialTaskData] = useState(null);
    const [highlightedTaskId, setHighlightedTaskId] = useState<string | null>(null);
    const [savingGoalId, setSavingGoalId] = useState<string | null>(null);
    const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
    const [savingKpiId, setSavingKpiId] = useState<string | null>(null);
    const [savingProjectId, setSavingProjectId] = useState<string | null>(null);
    const [editingKpi, setEditingKpi] = useState<{ goalId: string; kpi: BousalaKpi } | null>(null);
    const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const presentationWasOnRef = useRef(false);
    const settingsDefaultsNotifiedRef = useRef(false);

     const [kpiSettings, setKpiSettings] = useState<KpiSettings>(() => loadKpiSettings());
    const [tempKpiSettings, setTempKpiSettings] = useState(kpiSettings);
    
     const [notificationSettings, setNotificationSettings] = useState<BousalaNotificationSettings>(() => loadNotificationSettings());
    const [tempNotificationSettings, setTempNotificationSettings] = useState(notificationSettings);

    useEffect(() => {
        if (settingsDefaultsNotifiedRef.current) return;
        const rawKpi = sessionStorage.getItem('bousalaKpiSettings');
        const rawNotif = sessionStorage.getItem('bousalaNotificationSettings');
        let invalid = false;
        if (rawKpi) {
            try {
                const parsed = JSON.parse(rawKpi) as Partial<KpiSettings>;
                if (!KPI_REFRESH_INTERVALS.includes(parsed.interval as (typeof KPI_REFRESH_INTERVALS)[number])) invalid = true;
            } catch {
                invalid = true;
            }
        }
        if (rawNotif) {
            try {
                JSON.parse(rawNotif);
            } catch {
                invalid = true;
            }
        }
        if (invalid) {
            settingsDefaultsNotifiedRef.current = true;
            toast.showInfo(t('bousala.settings.settingsRestored'));
        }
    }, [toast, t]);

    const showPresentationAlert = useCallback((message: string, icon: React.ReactNode) => {
        setPresentationAlert({ message, icon });
        setTimeout(() => {
            setPresentationAlert(null);
        }, 5000);
    }, []);

    useEffect(() => {
        if (isPresentationMode && !presentationWasOnRef.current) {
            showPresentationAlert(t('bousala.presentationModeActive'), <Zap size={20} className="text-yellow-500" />);
        }
        presentationWasOnRef.current = isPresentationMode;
    }, [isPresentationMode, showPresentationAlert, t]);

     const generateAiAnalyticsSummary = useCallback((updatedGoals: BousalaGoal[]) => {
        const allKpiPredictions = updatedGoals.flatMap(g => g.kpis?.map(k => k.prediction?.probability) || []);
        const validPredictions = allKpiPredictions.filter(p => p !== undefined) as number[] | undefined;

        if (!validPredictions || validPredictions.length === 0) {
            setAiAnalyticsSummary('');
            return;
        }

        const averageSuccessProbability = Math.round(validPredictions.reduce((a, b) => a + b, 0) / validPredictions.length);
        
        const summaryText = t('bousala.common.goalPredictionSummary', { percentage: averageSuccessProbability });
        
        setAiAnalyticsSummary(summaryText);
    }, []);

    const handleAiImpactAnalysis = useCallback((goal: BousalaGoal) => {
        setAiLoading('kpis');
        setTimeout(() => {
            const linkedProject = bousalaState.projects.find(p => p.linkedGoal === goal.id);
            const mockResponse = t('bousala.mockInsights.goalImpactContent', {
                goalTitle: goal.title,
                progress: goal.progress,
                projectTitle: linkedProject?.title ?? '—',
                projectProgress: linkedProject?.progress ?? 0,
            });
            const newInsight = {
                id: Date.now(),
                title: t('bousala.mockInsights.goalImpactTitle', { goalTitle: goal.title }),
                content: mockResponse,
            };

            const kpiInsights: AiInsight[] = [];
            if (goal.kpis) {
                goal.kpis.forEach(kpi => {
                    if (kpi.target > 0 && kpi.value < kpi.target) {
                        const progressPercentage = (kpi.value / kpi.target) * 100;
                        if (progressPercentage < 80) {
                            const gapPercentage = Math.round(100 - progressPercentage);
                            kpiInsights.push({
                                id: Date.now() + Math.random(),
                                title: t('bousala.mockInsights.kpiGapTitle', { kpiTitle: kpi.title }),
                                content: t('bousala.mockInsights.kpiGapContent', { gap: gapPercentage }),
                            });
                        }
                    }
                });
            }

            setAiInsights(prev => ({...prev, kpis: [...kpiInsights, newInsight].filter((v,i,a)=>a.findIndex(item=>(item.title === v.title))===i) }));
            setAiLoading(null);
        }, 1500);
    }, [bousalaState.projects, t]);

     const runPredictiveAnalysis = useCallback((goalIdToAnalyze: string) => {
        setBousalaState(prevState => {
            const goal = prevState.goals.find(g => g.id === goalIdToAnalyze);
            if (!goal || !goal.kpis || !goal.deadline) return prevState;

            const kpiIds = goal.kpis.map(k => k.id);
            setPredictingKpiIds(prev => new Set([...Array.from(prev), ...kpiIds]));

            // Simulate API delay
            setTimeout(() => {
                setBousalaState(innerPrevState => {
                    const newGoals = innerPrevState.goals.map(g => {
                        if (g.id === goalIdToAnalyze) {
                            const updatedKpis = g.kpis?.map(kpi => {
                                const timeRemaining = new Date(g.deadline!).getTime() - new Date().getTime();
                                const timeElapsed = new Date().getTime() - new Date(kpi.lastUpdated).getTime();
                                const totalTime = timeRemaining + timeElapsed;
                                const timeElapsedPercentage = totalTime > 0 ? Math.min(1, timeElapsed / totalTime) : 0;
                                
                                const progressToTarget = kpi.target > 0 ? kpi.value / kpi.target : 0;
                                
                                let probability = progressToTarget * 100;
                                if (timeElapsedPercentage > 0.1 && timeElapsedPercentage < 1) {
                                    const requiredRunRate = (1 - progressToTarget) / (1 - timeElapsedPercentage);
                                    if (requiredRunRate > 1.2) probability -= 20;
                                    if (requiredRunRate < 0.8) probability += 15;
                                }
                                probability += (Math.random() - 0.5) * 10;
                                probability = Math.max(0, Math.min(100, Math.round(probability)));

                                let status: BousalaKpi['prediction']['status'] = 'At Risk';
                                if (probability >= 75) status = 'On Track';
                                else if (probability < 40) status = 'Unlikely';

                                return { ...kpi, prediction: { probability, status } };
                            });
                             const updatedGoalWithKpis = { ...g, kpis: updatedKpis };
                            
                            // --- GOAL PREDICTION ---
                            setPredictingGoals(prev => new Set([...Array.from(prev), g.id]));
                            let goalPrediction: BousalaGoal['prediction'] | undefined = undefined;
                            const kpiPredictions = updatedKpis?.map(k => k.prediction?.probability).filter(p => p !== undefined) as number[] | undefined;
                            if (kpiPredictions && kpiPredictions.length > 0) {
                                const avgProbability = kpiPredictions.reduce((a, b) => a + b, 0) / kpiPredictions.length;
                                const trend: 'up' | 'down' | 'stable' = avgProbability > updatedGoalWithKpis.progress + 3 ? 'up' : avgProbability < updatedGoalWithKpis.progress - 3 ? 'down' : 'stable';
                                const resourceIncrease = Math.round(Math.max(0, (95 - avgProbability) / 4));
                                const recommendation = t('bousala.prediction.recommendation', { percentage: resourceIncrease });
                                goalPrediction = {
                                    probability: Math.round(avgProbability),
                                    trend,
                                    recommendation,
                                };
                            }
                            // --- END GOAL PREDICTION ---

                            return { ...updatedGoalWithKpis, prediction: goalPrediction };
                        }
                        return g;
                    });
                    return { ...innerPrevState, goals: newGoals };
                });

                // Clear loading states
                setPredictingKpiIds(prev => {
                    const newSet = new Set(prev);
                    kpiIds.forEach(id => newSet.delete(id));
                    return newSet;
                });
                 setTimeout(() => {
                    setPredictingGoals(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(goalIdToAnalyze);
                        return newSet;
                    });
                }, 500);
            }, 1500); 

            return prevState;
        });
    }, [t]);

    const refreshKpiData = useCallback((goalId?: string) => {
        const goalsToRefresh = goalId ? bousalaState.goals.filter(g => g.id === goalId) : bousalaState.goals;
        if (goalsToRefresh.length === 0) return;

        const allKpiIds = goalsToRefresh.flatMap(g => g.kpis?.map(k => k.id) || []);
        if (allKpiIds.length === 0) return;

        setRefreshingKpiIds(prev => new Set([...Array.from(prev), ...allKpiIds]));

        setTimeout(() => {
            setBousalaState(prevState => {
                const goalIdsToRefresh = new Set(goalsToRefresh.map(g => g.id));
                const newGoals = prevState.goals.map(g => {
                    if (goalIdsToRefresh.has(g.id)) {
                        const refreshedKpis = (g.kpis || []).map(kpi => {
                            const change = (Math.random() - 0.5) * (kpi.target * 0.1);
                            let newValue = Math.round(kpi.value + change);
                            newValue = Math.max(0, Math.min(kpi.target * 1.5, newValue));
                            let newTrend: "up" | "down" | "stable" = kpi.value === newValue ? "stable" : newValue > kpi.value ? "up" : "down";
                            return { ...kpi, value: newValue, trend: newTrend, lastUpdated: new Date().toISOString(), prediction: undefined };
                        });
                        const updatedGoal = { ...g, kpis: refreshedKpis };
                        handleAiImpactAnalysis(updatedGoal);
                        return updatedGoal;
                    }
                    return g;
                });
                 return { ...prevState, goals: newGoals };
            });
            
            // Run predictions after state update
            goalsToRefresh.forEach(g => runPredictiveAnalysis(g.id));

            if (isPresentationMode) {
                showPresentationAlert(t('bousala.kpiUpdateNotification'), <TrendingUp size={20} />);
            }

            setTimeout(() => {
                setRefreshingKpiIds(prev => {
                    const newSet = new Set(prev);
                    allKpiIds.forEach(id => newSet.delete(id!));
                    return newSet;
                });
            }, 500);
        }, 1000);
    }, [bousalaState.goals, runPredictiveAnalysis, handleAiImpactAnalysis, isPresentationMode, showPresentationAlert, t]);

    useEffect(() => {
        const intervalId = setInterval(() => {
            refreshKpiData();
            toast.showSuccess(t('bousala.kpiUpdateNotification'));
        }, 300000); // 5 minutes

        return () => clearInterval(intervalId);
    }, [refreshKpiData, toast, t]);

    useEffect(() => {
        if (isSettingsOpen) {
            setTempKpiSettings(kpiSettings);
            setTempNotificationSettings(notificationSettings);
        }
    }, [isSettingsOpen, kpiSettings, notificationSettings]);
    
    useEffect(() => {
        const allKpis = bousalaState.goals.flatMap(g => g.kpis || []);
        // Only run if there are KPIs and all of them have prediction data.
        if (allKpis.length > 0 && allKpis.every(k => k.prediction !== undefined)) {
            generateAiAnalyticsSummary(bousalaState.goals);
        }
    }, [bousalaState.goals, generateAiAnalyticsSummary]);


    const handleSaveSettings = () => {
        setKpiSettings(tempKpiSettings);
        sessionStorage.setItem('bousalaKpiSettings', JSON.stringify(tempKpiSettings));
        setNotificationSettings(tempNotificationSettings);
        sessionStorage.setItem('bousalaNotificationSettings', JSON.stringify(tempNotificationSettings));
        toast.showSuccess(t('bousala.settingsSaved'));
        setIsSettingsOpen(false);
    };

    useEffect(() => {
        if (!kpiSettings.interval || kpiSettings.interval <= 0) return;

        const intervalId = setInterval(() => {
            refreshKpiData();
        }, kpiSettings.interval * 1000);

        return () => clearInterval(intervalId);
    }, [kpiSettings.interval, refreshKpiData]);


    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
                setIsSettingsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        return () => {
            if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
        };
    }, []);

    const flashTaskHighlight = useCallback((id: string) => {
        if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
        setHighlightedTaskId(id);
        highlightTimerRef.current = setTimeout(() => setHighlightedTaskId(null), OPTIMISTIC_HIGHLIGHT_MS);
    }, []);

    const handleToggle = (goalId: string) => {
        setExpandedGoal(prev => prev === goalId ? null : goalId);
    };
    
    const unassignedAssigneeLabel = t('bousala.demoData.teams.unassigned');

    const handleAddTask = (newTaskData: { title: string; goalId: string; dueDate: string; priority: 'high' | 'medium' | 'low'; }) => {
        const project = bousalaState.projects.find(p => p.linkedGoal === newTaskData.goalId);
        if (!project) {
            toast.showError(t('bousala.messages.noLinkedProjectForTask'));
            return Promise.reject(new Error('no linked project'));
        }

        return createTaskMutation.mutateAsync({
            goalProjectId: project.id,
            title: newTaskData.title,
            description: t('bousala.demoData.newTaskDescription'),
            assignee: unassignedAssigneeLabel,
            dueDate: newTaskData.dueDate,
            priority: newTaskData.priority,
        }).then((created) => {
            flashTaskHighlight(created.id);
            toast.showSuccess(t('bousala.addTaskModal.success'));
            if (isPresentationMode && notificationSettings.alertSoundEnabled) playFeedbackSound('success');
            if (kpiSettings.smartRefresh && project) {
                refreshKpiData(project.linkedGoal);
            }
        }).catch(() => {
            toast.showError(t('common.error', 'Error'));
            throw new Error('task persist failed');
        });
    };
    
    const handleLinkProject = (projectIds: string[]) => {
        if (!expandedGoal) return;

        linkProjectsMutation.mutate(
            { goalId: expandedGoal, projectIds },
            {
                onSuccess: () => {
                    toast.showSuccess(t('bousala.messages.projectLinkedSuccess'));
                    if (isPresentationMode && notificationSettings.alertSoundEnabled) playFeedbackSound('success');
                    if (kpiSettings.smartRefresh) {
                        refreshKpiData(expandedGoal);
                    }
                },
                onError: () => toast.showError(t('common.error', 'Error')),
            },
        );
    };

    const handleUpdateTask = useCallback(async (taskId: string, patch: TaskUpdatePatch) => {
        setUpdatingTaskId(taskId);
        try {
            await updateTaskMutation.mutateAsync({ taskId, patch: patch as ApiTaskUpdatePatch });
            toast.showSuccess(t('bousala.taskEdit.saved'));
        } catch {
            toast.showError(t('common.error', 'Error'));
            throw new Error('task update failed');
        } finally {
            setUpdatingTaskId(null);
        }
    }, [toast, t, updateTaskMutation]);

    const handleSaveGoal = useCallback(async (goalId: string, data: GoalEditForm) => {
        if (!data.title.trim()) {
            toast.showError(t('bousala.goalEdit.titleRequired'));
            throw new Error('validation');
        }
        setSavingGoalId(goalId);
        try {
            await updateGoalMutation.mutateAsync({
                goalId,
                data: {
                    title: data.title,
                    description: data.description,
                    responsiblePerson: data.responsiblePerson,
                    status: data.status || undefined,
                },
            });
            toast.showSuccess(t('bousala.goalEdit.saved'));
        } catch {
            toast.showError(t('common.error', 'Error'));
            throw new Error('save failed');
        } finally {
            setSavingGoalId(null);
        }
    }, [toast, t, updateGoalMutation]);

    const handleSaveDirection = useCallback(async (data: BousalaDirection) => {
        setIsSavingDirection(true);
        try {
            await updateDirectionMutation.mutateAsync(data);
            toast.showSuccess(t('bousala.direction.saved'));
        } catch {
            toast.showError(t('common.error', 'Error'));
            throw new Error('direction save failed');
        } finally {
            setIsSavingDirection(false);
        }
    }, [toast, t, updateDirectionMutation]);

    const handleAddGoal = (goalData: { title: string; description: string; progress: number; responsiblePerson: string; status?: string }) => {
        createGoalMutation.mutate(
            {
                title: goalData.title,
                description: goalData.description,
                responsiblePerson: goalData.responsiblePerson,
                progress: goalData.progress,
                status: goalData.status,
            },
            {
                onSuccess: () => {
                    toast.showSuccess(t('bousala.messages.goalAddedSuccess', { title: goalData.title }));
                    if (isPresentationMode && notificationSettings.alertSoundEnabled) playFeedbackSound('success');
                    setIsAddGoalModalOpen(false);
                },
                onError: () => toast.showError(t('common.error', 'Error')),
            },
        );
    };
    
    const handleDeleteGoal = useCallback((goalId: string) => {
        if (!window.confirm(t('bousala.goalEdit.deleteConfirm'))) return;
        deleteGoalMutation.mutate(goalId, {
            onSuccess: () => {
                setExpandedGoal(prev => (prev === goalId ? null : prev));
                toast.showSuccess(t('bousala.messages.goalDeletedSuccess'));
            },
            onError: () => toast.showError(t('common.error', 'Error')),
        });
    }, [toast, t, deleteGoalMutation]);

    const handleDeleteKpi = useCallback((_goalId: string, kpiId: string) => {
        if (!window.confirm(t('bousala.kpiEdit.deleteConfirm'))) return;
        deleteKpiMutation.mutate(kpiId, {
            onSuccess: () => toast.showSuccess(t('bousala.messages.kpiDeletedSuccess')),
            onError: () => toast.showError(t('common.error', 'Error')),
        });
    }, [toast, t, deleteKpiMutation]);

    const handleSaveKpi = useCallback(async (data: { title: string; value: number; target: number; unit: string; kpiDescription?: string }) => {
        if (!editingKpi) return;
        setSavingKpiId(editingKpi.kpi.id);
        try {
            await updateKpiMutation.mutateAsync({ kpiId: editingKpi.kpi.id, data });
            toast.showSuccess(t('bousala.kpiEdit.saved'));
            setEditingKpi(null);
        } catch {
            toast.showError(t('common.error', 'Error'));
            throw new Error('kpi save failed');
        } finally {
            setSavingKpiId(null);
        }
    }, [editingKpi, toast, t, updateKpiMutation]);

    const handleDeleteTask = useCallback((taskId: string) => {
        if (!window.confirm(t('bousala.taskEdit.deleteConfirm'))) return;
        deleteTaskMutation.mutate(taskId, {
            onSuccess: () => toast.showSuccess(t('bousala.messages.taskDeletedSuccess')),
            onError: () => toast.showError(t('common.error', 'Error')),
        });
    }, [toast, t, deleteTaskMutation]);

    const handleSaveProject = useCallback(async (projectId: string, data: ProjectEditForm) => {
        if (!data.title.trim()) {
            toast.showError(t('bousala.projectEdit.titleRequired'));
            throw new Error('validation');
        }
        setSavingProjectId(projectId);
        try {
            await updateGoalProjectMutation.mutateAsync({
                projectId,
                data: {
                    title: data.title,
                    description: data.description,
                    status: data.status || undefined,
                },
            });
            toast.showSuccess(t('bousala.projectEdit.saved'));
        } catch {
            toast.showError(t('common.error', 'Error'));
            throw new Error('project save failed');
        } finally {
            setSavingProjectId(null);
        }
    }, [toast, t, updateGoalProjectMutation]);

    const handleUnlinkProject = useCallback((projectId: string) => {
        if (!window.confirm(t('bousala.projectEdit.unlinkConfirm'))) return;
        unlinkProjectMutation.mutate(projectId, {
            onSuccess: () => toast.showSuccess(t('bousala.messages.projectUnlinkedSuccess')),
            onError: () => toast.showError(t('common.error', 'Error')),
        });
    }, [toast, t, unlinkProjectMutation]);

    const handleAddKpi = (kpiData: { title: string; value: number; target: number; unit: string; goalId: string; }) => {
        createKpiMutation.mutate(
            {
                goalId: kpiData.goalId,
                title: kpiData.title,
                value: kpiData.value,
                target: kpiData.target,
                unit: kpiData.unit,
            },
            {
                onSuccess: () => {
                    toast.showSuccess(t('bousala.messages.kpiAddedSuccess'));
                    if (isPresentationMode && notificationSettings.alertSoundEnabled) playFeedbackSound('success');
                    if (kpiSettings.smartRefresh) {
                        refreshKpiData(kpiData.goalId);
                    }
                },
                onError: () => toast.showError(t('common.error', 'Error')),
            },
        );
    };

    const handleAiTaskSuggestion = async (project: BousalaProject) => {
        setAiLoading('tasks');
        setTimeout(() => {
            const newInsight = {
                id: Date.now(),
                title: t('bousala.mockInsights.taskSuggestionTitle', { projectTitle: project.title }),
                content: t('bousala.mockInsights.taskSuggestionContent', { projectTitle: project.title }),
            };
            setAiInsights(prev => ({...prev, tasks: [newInsight, ...prev.tasks]}));
            setAiLoading(null);
        }, 1500);
    };

    const handleAiRiskPrediction = async (project: BousalaProject) => {
        setAiLoading('risks');
        setTimeout(() => {
            const criticalTask = bousalaState.tasks.find(task => task.linkedProject === project.id);
            const newInsight = {
                id: Date.now(),
                title: t('bousala.mockInsights.riskPredictionTitle', { projectTitle: project.title }),
                content: t('bousala.mockInsights.riskPredictionContent', {
                    projectTitle: project.title,
                    progress: project.progress,
                    criticalTaskTitle: criticalTask?.title ?? '—',
                }),
            };
            setAiInsights(prev => ({...prev, risks: [newInsight, ...prev.risks]}));
            setAiLoading(null);
        }, 1500);
    };
    
    const linkedMainProjectIdsForCurrentGoal = useMemo(() => {
        if (!expandedGoal) return [];
        const goal = bousalaState.goals.find(g => g.id === expandedGoal);
        if (!goal) return [];
        return bousalaState.projects
            .filter(p => goal.linkedProjects.includes(p.id))
            .map(p => getSourceProjectId(p))
            .filter((id): id is string => !!id);
    }, [expandedGoal, bousalaState.goals, bousalaState.projects]);

    const handleOpenTaskModal = (initialData = null) => {
        setInitialTaskData(initialData);
        setIsAddTaskModalOpen(true);
    };
    
    const PredictionBar: React.FC<{ progress: number }> = ({ progress }) => (
        <div className="group">
            <div className="flex justify-between text-xs font-semibold mb-1">
                <span>{t('bousala.common.predictionLabel')}</span>
                <span>{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                <div className="bg-blue-400 h-2 rounded-full" style={{ width: `${progress}%` }}></div>
            </div>
        </div>
    );
    
    const predictionTrendIcons = {
        up: <TrendingUp className="w-5 h-5 text-green-500" />,
        down: <TrendingDown className="w-5 h-5 text-red-500" />,
        stable: <Minus className="w-5 h-5 text-gray-500" />,
    };

    const renderContent = () => {
        if (isBousalaLoading) {
            return (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center py-16">
                    <Spinner />
                </motion.div>
            );
        }
        if (isBousalaError) {
            return (
                <div className="text-center py-16 text-red-500">
                    {t('common.error', 'Error')}
                </div>
            );
        }
        switch (activeView) {
            case 'predictive':
                return (
                    <PredictiveDashboard
                        goals={bousalaState.goals}
                        onGoToDashboard={() => setActiveView('dashboard')}
                    />
                );
            case 'dashboard':
            default:
                if (bousalaState.goals.length === 0) {
                    return (
                        <BousalaSectionEmpty
                            title={t('bousala.empty.noGoals.title')}
                            description={t('bousala.empty.noGoals.description')}
                            actionLabel={t('bousala.empty.noGoals.action')}
                            onAction={() => setIsAddGoalModalOpen(true)}
                        />
                    );
                }
                return (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-6">
                            {bousalaState.goals.map(goal => {
                                const linkedProjects = bousalaState.projects.filter(p => goal.linkedProjects.includes(p.id));
                                const isRefreshingKpis = !!goal.kpis?.some(kpi => refreshingKpiIds.has(kpi.id));
                                const isPredictingKpis = !!goal.kpis?.some(kpi => predictingKpiIds.has(kpi.id));
                                return (
                                    <div key={goal.id}>
                                        <GoalCard
                                            goal={goal}
                                            isExpanded={expandedGoal === goal.id}
                                            isAiLoading={aiLoading === 'kpis'}
                                            isSaving={savingGoalId === goal.id}
                                            hrData={hrData}
                                            onToggle={() => handleToggle(goal.id)}
                                            onAnalyze={() => handleAiImpactAnalysis(goal)}
                                            onAddKpiClick={() => {
                                                setGoalForNewKpi(goal.id);
                                                setIsAddKpiModalOpen(true);
                                            }}
                                            onSave={handleSaveGoal}
                                            onDelete={handleDeleteGoal}
                                            isRefreshingKpis={isRefreshingKpis}
                                            showAnimation={kpiSettings.showAnimation}
                                            isPredicting={isPredictingKpis || predictingGoals.has(goal.id)}
                                        />
                                        <AnimatePresence>
                                        {expandedGoal === goal.id && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="p-4 bg-card dark:bg-dark-card rounded-b-xl border-x border-b dark:border-slate-700/50 space-y-4">
                                                    <div>
                                                        <h5 className="font-semibold text-sm mb-2">{t('bousala.kpis')}</h5>
                                                        {goal.kpis && goal.kpis.length > 0 ? (
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                                {goal.kpis.map(kpi => (
                                                                    <KpiCard
                                                                        key={kpi.id}
                                                                        kpi={kpi}
                                                                        isRefreshing={refreshingKpiIds.has(kpi.id)}
                                                                        isPredicting={predictingKpiIds.has(kpi.id)}
                                                                        showAnimation={kpiSettings.showAnimation}
                                                                        onEdit={() => setEditingKpi({ goalId: goal.id, kpi })}
                                                                        onDelete={() => handleDeleteKpi(goal.id, kpi.id)}
                                                                    />
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <BousalaSectionEmpty
                                                                compact
                                                                title={t('bousala.empty.noKpis.title')}
                                                                description={t('bousala.empty.noKpis.description')}
                                                                actionLabel={t('bousala.empty.noKpis.action')}
                                                                onAction={() => {
                                                                    setGoalForNewKpi(goal.id);
                                                                    setIsAddKpiModalOpen(true);
                                                                }}
                                                            />
                                                        )}
                                                    </div>
                                                    {predictingGoals.has(goal.id) ? (
                                                        <div className="text-center p-4 text-sm text-gray-500"><Spinner text={t('bousala.common.goalPredictionsAnalysis')}/></div>
                                                    ) : goal.prediction && (
                                                        <div className="pt-4 border-t border-gray-200 dark:border-slate-700/50 space-y-4">
                                                            <h5 className="font-semibold text-sm">{t('bousala.prediction.title')}</h5>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                                                                <div>
                                                                    <PredictionBar progress={goal.prediction.probability} />
                                                                </div>
                                                                <div className="flex items-center gap-4 text-sm font-semibold">
                                                                    {predictionTrendIcons[goal.prediction.trend]}
                                                                    <span dir="auto">{t('bousala.prediction.summary', { percentage: goal.prediction.probability })}</span>
                                                                </div>
                                                            </div>
                                                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm flex items-center gap-2">
                                                                <Bot size={16} className="text-blue-600"/>
                                                                <span className="text-blue-800 dark:text-blue-200" dir="auto">{goal.prediction.recommendation}</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                    <div className="pt-4 border-t border-gray-200 dark:border-slate-700/50">
                                                        <h5 className="font-semibold text-sm mb-2">{t('bousala.projects')}:</h5>
                                                        {linkedProjects.length > 0 ? (
                                                            <div className="space-y-3">
                                                                {linkedProjects.map(project => (
                                                                    <ProjectItem 
                                                                        key={project.id} 
                                                                        project={project} 
                                                                        tasks={bousalaState.tasks.filter(t => t.linkedProject === project.id)}
                                                                        highlightedTaskId={highlightedTaskId}
                                                                        updatingTaskId={updatingTaskId}
                                                                        unassignedLabel={unassignedAssigneeLabel}
                                                                        isAiLoading={aiLoading === 'tasks' || aiLoading === 'risks'}
                                                                        onSuggestTasks={() => handleAiTaskSuggestion(project)}
                                                                        onPredictRisk={() => handleAiRiskPrediction(project)}
                                                                        onUpdateTask={handleUpdateTask}
                                                                        onDeleteTask={handleDeleteTask}
                                                                        onSaveProject={handleSaveProject}
                                                                        onUnlinkProject={handleUnlinkProject}
                                                                        isSavingProject={savingProjectId === project.id}
                                                                        mainProjects={linkableProjects}
                                                                        volunteers={hrData.volunteers}
                                                                        hrData={hrData}
                                                                    />
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <BousalaSectionEmpty
                                                                compact
                                                                title={t('bousala.empty.noProjects.title')}
                                                                description={t('bousala.empty.noProjects.description')}
                                                                actionLabel={t('bousala.empty.noProjects.action')}
                                                                onAction={() => {
                                                                    setExpandedGoal(goal.id);
                                                                    setIsLinkProjectModalOpen(true);
                                                                }}
                                                            />
                                                        )}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                        </AnimatePresence>
                                    </div>
                                )
                            })}
                        </div>
    
                        <div className="lg:col-span-1">
                            <div className="sticky top-24">
                                <SmartAiPanel
                                    loadingSection={aiLoading}
                                    insights={aiInsights}
                                    onAddTaskClick={() => handleOpenTaskModal()}
                                    onAddGoalClick={() => setIsAddGoalModalOpen(true)}
                                    onLinkProjectClick={() => setIsLinkProjectModalOpen(true)}
                                    onViewReportsClick={() => setIsReportModalOpen(true)}
                                    aiAnalyticsSummary={aiAnalyticsSummary}
                                />
                            </div>
                        </div>
                    </div>
                );
        }
    };

    return (
        <>
            <ReportGenerationModal 
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
                bousalaData={bousalaState}
                aiInsights={aiInsights}
            />
            <AddTaskModal 
                isOpen={isAddTaskModalOpen}
                onClose={() => { setIsAddTaskModalOpen(false); setInitialTaskData(null); }}
                onAdd={handleAddTask}
                goals={bousalaState.goals}
                initialData={initialTaskData}
            />
            <AddGoalModal 
                isOpen={isAddGoalModalOpen}
                onClose={() => setIsAddGoalModalOpen(false)}
                onAdd={handleAddGoal}
                hrData={hrData}
            />
            <LinkProjectModal 
                isOpen={isLinkProjectModalOpen}
                onClose={() => setIsLinkProjectModalOpen(false)}
                onLink={handleLinkProject}
                allProjects={linkableProjects}
                linkedProjectIds={linkedMainProjectIdsForCurrentGoal}
            />
             <AddKpiModal 
                isOpen={isAddKpiModalOpen}
                onClose={() => setIsAddKpiModalOpen(false)}
                onAdd={handleAddKpi}
                goalId={goalForNewKpi || ''}
            />
            <EditKpiModal
                isOpen={editingKpi !== null}
                onClose={() => setEditingKpi(null)}
                kpi={editingKpi?.kpi ?? null}
                onSave={handleSaveKpi}
                isSaving={savingKpiId !== null}
            />
            <AlertsCenterPanel
                isOpen={isAlertsCenterOpen}
                onClose={() => setIsAlertsCenterOpen(false)}
                goals={bousalaState.goals}
                onCreateTask={handleOpenTaskModal}
                setNotificationCount={setAlertCount}
            />
            <InPresentationAlert alert={presentationAlert} />
            <div className="animate-fade-in space-y-8" dir={dir}>
                {(bousalaState.direction || role === 'Admin' || role === 'Manager') && (
                    <StrategicDirectionCard
                        direction={bousalaState.direction}
                        canEdit={role === 'Admin' || role === 'Manager'}
                        isSaving={isSavingDirection}
                        onSave={handleSaveDirection}
                    />
                )}
                 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <BousalaIcon className="w-10 h-10" />
                        <div>
                            <h1 className="text-3xl font-bold text-foreground dark:text-dark-foreground">{t('bousala.title')}</h1>
                            <p className="text-gray-500 text-sm mt-1">{t('bousala.linkedModules')}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={() => setIsAlertsCenterOpen(true)} className="relative p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700">
                            <Bell size={24} />
                            {alertCount > 0 && (
                                <span className="absolute top-1 right-1 flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                </span>
                            )}
                        </button>
                        {(role === 'Admin' || role === 'Manager') && (
                            <button 
                                onClick={() => setIsReportModalOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium border rounded-lg hover:bg-gray-100 dark:border-slate-600 dark:hover:bg-slate-700"
                            >
                                <BarChart3 size={16} />
                                <span>{t('bousala.reports.title')}</span>
                            </button>
                        )}
                        <div className="flex items-center gap-2 text-sm font-medium p-2 border rounded-lg bg-card dark:bg-dark-card/50 dark:border-slate-700">
                            <Zap size={16} className={`transition-colors ${isPresentationMode ? 'text-yellow-500 animate-pulse' : 'text-gray-400'}`} />
                            <label htmlFor="presentation-toggle" className="cursor-pointer font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap">{t('bousala.presentationMode')}</label>
                            <ToggleSwitch checked={isPresentationMode} onChange={setIsPresentationMode} id="presentation-toggle" />
                        </div>
                        <div className="relative">
                            <button onClick={() => setIsSettingsOpen(prev => !prev)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700">
                                <Settings size={20} />
                            </button>
                            <AnimatePresence>
                                {isSettingsOpen && (
                                    <motion.div
                                        ref={settingsRef}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        className="absolute end-0 mt-2 w-80 bg-card dark:bg-dark-card rounded-xl shadow-lg border dark:border-slate-700 z-20"
                                    >
                                        <div className="p-4 border-b dark:border-slate-700/50">
                                            <h4 className="font-bold">{t('bousala.settings.title')}</h4>
                                        </div>

                                        <div className="p-4 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
                                            
                                            <div>
                                                <h5 className="font-bold mb-3 text-base">{t('bousala.settings.notificationsTitle')}</h5>
                                                <div className="space-y-3 text-sm">
                                                    <div className="flex items-center justify-between">
                                                        <label htmlFor="smart-alerts-toggle">{t('bousala.settings.enableSmartAlerts')}</label>
                                                        <ToggleSwitch id="smart-alerts-toggle" checked={tempNotificationSettings.smartAlertsEnabled} onChange={c => setTempNotificationSettings({...tempNotificationSettings, smartAlertsEnabled: c})} />
                                                    </div>
                                                    <div>
                                                        <label htmlFor="severity-threshold">{t('bousala.settings.severityThreshold', {threshold: tempNotificationSettings.severityThreshold})}</label>
                                                        <input id="severity-threshold" type="range" min="50" max="90" step="10" value={tempNotificationSettings.severityThreshold} onChange={e => setTempNotificationSettings({...tempNotificationSettings, severityThreshold: Number(e.target.value)})} className="w-full mt-1" />
                                                        <div className="flex justify-between text-xs text-gray-400">
                                                            <span>{t('bousala.settings.severityCritical')}</span>
                                                            <span>{t('bousala.settings.severityWarning', { threshold: tempNotificationSettings.severityThreshold })}</span>
                                                            <span>{t('bousala.settings.severityInfo')}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <label htmlFor="alert-sound-toggle">{t('bousala.settings.alertSound')}</label>
                                                        <ToggleSwitch id="alert-sound-toggle" checked={tempNotificationSettings.alertSoundEnabled} onChange={c => setTempNotificationSettings({...tempNotificationSettings, alertSoundEnabled: c})} />
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <label htmlFor="ai-recs-toggle">{t('bousala.settings.aiAutoRecs')}</label>
                                                        <ToggleSwitch id="ai-recs-toggle" checked={tempNotificationSettings.aiAutoRecommendationsEnabled} onChange={c => setTempNotificationSettings({...tempNotificationSettings, aiAutoRecommendationsEnabled: c})} />
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div>
                                                <h5 className="font-bold mb-3 text-base">{t('bousala.settings.kpiTitle')}</h5>
                                                <div className="space-y-3 text-sm">
                                                    <div>
                                                        <label htmlFor="refresh-interval" className="font-semibold">{t('bousala.settings.refreshInterval')}</label>
                                                        <select id="refresh-interval" value={tempKpiSettings.interval} onChange={e => setTempKpiSettings({...tempKpiSettings, interval: Number(e.target.value) as KpiSettings['interval']})} className="w-full p-2 mt-1 border rounded-md bg-gray-50 dark:bg-slate-800">
                                                            <option value={30}>{t('bousala.settings.seconds30')}</option>
                                                            <option value={60}>{t('bousala.settings.seconds60')}</option>
                                                            <option value={120}>{t('bousala.settings.seconds120')}</option>
                                                        </select>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <label htmlFor="smart-refresh-toggle" className="cursor-pointer">{t('bousala.settings.smartRefresh')}</label>
                                                        <ToggleSwitch id="smart-refresh-toggle" checked={tempKpiSettings.smartRefresh} onChange={c => setTempKpiSettings({...tempKpiSettings, smartRefresh: c})} />
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <label htmlFor="animation-toggle" className="cursor-pointer">{t('bousala.settings.showAnimation')}</label>
                                                        <ToggleSwitch id="animation-toggle" checked={tempKpiSettings.showAnimation} onChange={c => setTempKpiSettings({...tempKpiSettings, showAnimation: c})} />
                                                    </div>
                                                </div>
                                            </div>

                                        </div>
                                        <div className="p-4 border-t dark:border-slate-700/50">
                                            <button onClick={handleSaveSettings} className="w-full px-4 py-2 bg-secondary text-white font-semibold rounded-lg text-sm">{t('bousala.settings.save')}</button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {notificationSettings.smartAlertsEnabled && <SmartAlertsPanel goals={bousalaState.goals} isVoiceFeedbackEnabled={notificationSettings.alertSoundEnabled} severityThreshold={notificationSettings.severityThreshold} aiAutoRecommendationsEnabled={notificationSettings.aiAutoRecommendationsEnabled} />}

                <div className="flex items-center gap-2 border-b border-gray-200 dark:border-slate-700 pb-2">
                    <button
                        onClick={() => setActiveView('dashboard')}
                        className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
                            activeView === 'dashboard'
                            ? 'bg-primary text-white'
                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                        }`}
                    >
                        {t('bousala.tabs.dashboard')}
                    </button>
                    <button
                        onClick={() => setActiveView('predictive')}
                        className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
                            activeView === 'predictive'
                            ? 'bg-primary text-white'
                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                        }`}
                    >
                        {t('bousala.tabs.predictive')}
                    </button>
                </div>
                
                {renderContent()}

            </div>
        </>
    );
};

export default BousalaPage;
