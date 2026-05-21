// FIX: Added 'useCallback' to the import statement from 'react' to resolve 'Cannot find name' errors.
import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocalization } from '../../hooks/useLocalization';
import { BousalaIcon } from '../icons/ModuleIcons';
import { Bell, ChevronDown, CheckCircle, Clock, Loader, Bot, Sparkles, BrainCircuit, ShieldAlert, BarChart3, Target, Briefcase, CheckSquare, GripVertical, Zap, Settings, Volume2, VolumeX, TrendingUp, TrendingDown, Minus, PlusCircle, AlertCircle as AlertCircleIcon, ArrowRightCircle, XCircle, ClipboardList, Link2 } from 'lucide-react';
import AiCard from './ai/AiCard';
import Spinner from '../../common/Spinner';
import ModalPortal from '../../common/ModalPortal';
import { formatCurrency, formatDate, formatNumber } from '../../lib/utils';
import type { Project as MainProject, HrData, Role, BousalaGoal, BousalaProject, BousalaTask, BousalaKpi } from '../../types';
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
import LinkProjectModal from './bousala/LinkProjectModal';
import { playFeedbackSound } from '../../lib/audioFeedback';
import Tooltip from '../common/Tooltip';
import AddKpiModal from './bousala/AddKpiModal';
import KpiCharts from './bousala/KpiCharts';
import PredictiveDashboard from './bousala/PredictiveDashboard';
import SmartAlertsPanel from './bousala/SmartAlertsPanel';
import AlertsCenterPanel from './bousala/AlertsCenterPanel';


// Data based on bousala.data.json
const initialBousalaData = {
  goals: [
    { id: "G1", title: "تعزيز الاستدامة المالية للمنظمة", description: "زيادة مصادر التمويل الذاتي بنسبة 20% خلال العام المالي الحالي.", progress: 45, linkedProjects: ["P1"], responsiblePerson: "Fatma Kaya", deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), kpis: [ { id: "G1-K1", title: "نسبة التمويل الذاتي", value: 9, target: 20, unit: "%", trend: "up", lastUpdated: "2024-07-20T00:00:00Z" }, { id: "G1-K2", title: "حملات التمويل الجديدة", value: 2, target: 5, unit: "حملة", trend: "stable", lastUpdated: "2024-07-18T00:00:00Z" } ] },
    { id: "G2", title: "توسيع نطاق الخدمات التعليمية", description: "الوصول إلى 500 مستفيد جديد في البرامج التعليمية بنهاية العام.", progress: 70, linkedProjects: ["P2"], responsiblePerson: "Ali Veli", deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), kpis: [ { id: "G2-K1", title: "المستفيدون الجدد", value: 350, target: 500, unit: "مستفيد", trend: "up", lastUpdated: "2024-07-22T00:00:00Z" }, { id: "G2-K2", title: "معدل إتمام الدورات", value: 88, target: 90, unit: "%", trend: "down", lastUpdated: "2024-07-15T00:00:00Z" } ] }
  ],
  projects: [
    { id: "P1", title: "إطلاق حملة الوقف السنوية", description: "حملة تسويقية لجمع التبرعات لصالح صندوق الوقف.", progress: 60, linkedGoal: "G1", linkedTasks: ["T1"] },
    { id: "P2", title: "تطوير منصة التعليم عن بعد", description: "إضافة مساقات جديدة وتطوير واجهة المستخدم للمنصة التعليمية.", progress: 85, linkedGoal: "G2", linkedTasks: ["T2"] }
  ],
  tasks: [
    { id: "T1", title: "تصميم المواد الإعلانية للحملة", description: "إنشاء تصاميم وفيديوهات ترويجية لحملة الوقف.", status: "in-progress", linkedProject: "P1", assignee: "فريق التسويق" },
    { id: "T2", title: "برمجة واجهة تسجيل الطلاب الجديدة", description: "تطوير واجهة مستخدم سهلة لتسجيل الطلاب الجدد في المنصة.", status: "completed", linkedProject: "P2", assignee: "فريق التطوير التقني" }
  ]
};

// --- NEW MOCK DATA for KPI Trends ---
const kpiTrendData = [
    { name: 'Jan', value: 65 },
    { name: 'Feb', value: 59 },
    { name: 'Mar', value: 80 },
    { name: 'Apr', value: 81 },
    { name: 'May', value: 56 },
    { name: 'Jun', value: 55 },
    { name: 'Jul', value: 40 },
];


type AiInsight = {
    id: number;
    title: string;
    content: string;
};

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


// --- SUB-COMPONENTS ---
const SplashScreen = ({ onFinish }: { onFinish: () => void }) => {
    const { t } = useLocalization();
    const [isFadingOut, setIsFadingOut] = useState(false);

    useEffect(() => {
        const fadeTimer = setTimeout(() => {
            setIsFadingOut(true);
        }, 2700);

        const finishTimer = setTimeout(onFinish, 3000);

        return () => {
            clearTimeout(fadeTimer);
            clearTimeout(finishTimer);
        };
    }, [onFinish]);

    return (
        <ModalPortal
            isOpen={true}
            onClose={() => {}}
            overlayClassName="fixed inset-0 bg-transparent pointer-events-none"
            containerClassName="relative flex min-h-full w-full items-center justify-center p-0"
        >
            <div
                className={`min-h-[100vh] w-full flex items-center justify-center bg-gradient-to-b from-cyan-100 to-white dark:from-cyan-900 dark:to-dark-background transition-opacity duration-300 ${isFadingOut ? 'opacity-0' : 'opacity-100'}`}
                onClick={(e) => e.stopPropagation()}
            >
            <div className="text-center animate-fade-in-scale">
                 <div className="flex items-center justify-center mx-auto w-24 h-24 bg-white/50 dark:bg-dark-card/50 rounded-full shadow-lg mb-6">
                    {/* Placeholder Logo */}
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-600"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                </div>
                <h1 className="text-3xl font-bold text-cyan-700 dark:text-cyan-300">{t('bousala.splash.title')}</h1>
                <p className="mt-2 text-gray-600 dark:text-gray-400">{t('bousala.splash.subtitle')}</p>
            </div>
            </div>
        </ModalPortal>
    );
};


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
    const { t } = useLocalization();
    return (
        <div className="group">
            <div className="flex justify-between text-sm font-semibold mb-1">
                <span>{t('bousala.common.progressLabel')}</span>
                <span>{progress}%</span>
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

const KpiCard: React.FC<{ kpi: BousalaKpi; isRefreshing: boolean; isPredicting: boolean; showAnimation: boolean }> = ({ kpi, isRefreshing, isPredicting, showAnimation }) => {
    const { language, t } = useLocalization();
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
                <div className="flex justify-between items-start">
                    <h5 className="font-semibold text-sm flex items-center gap-2">
                        {kpi.title}
                        {showAnimation && isRefreshing && <Loader size={12} className="animate-spin text-primary" />}
                    </h5>
                    <Tooltip text={t('bousala.common.lastUpdated', { date: formatDate(kpi.lastUpdated, language) })}>
                        {trendConfig[kpi.trend].icon}
                    </Tooltip>
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
                            {t(`bousala.common.${kpi.prediction.status === 'On Track' ? 'onTrack' : kpi.prediction.status === 'At Risk' ? 'atRisk' : 'unlikely'}`)} ({kpi.prediction.probability}%)
                        </div>
                    </Tooltip>
                )}
            </div>

        </div>
    );
};

const TaskItem: React.FC<{ task: BousalaTask; volunteers: HrData['volunteers'] }> = ({ task, volunteers }) => {
    const { t } = useLocalization();
    const statusConfig = {
        'in-progress': { icon: <Clock className="w-4 h-4 text-yellow-500" />, label: t('bousala.task_status.in-progress') },
        'completed': { icon: <CheckCircle className="w-4 h-4 text-green-500" />, label: t('bousala.task_status.completed') }
    };
    const config = statusConfig[task.status as keyof typeof statusConfig] || { icon: <Loader className="w-4 h-4" />, label: task.status };

    return (
        <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-700/50 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
                <CheckSquare className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <div>
                    <p className="font-semibold">{task.title}</p>
                    <p className="text-xs text-gray-500">{t('bousala.common.assigneeLabel')}: {task.assignee}</p>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <select className="p-1 text-xs border rounded-md bg-gray-50 dark:bg-slate-800 w-32">
                    <option>{t('bousala.common.assignTaskTo')}</option>
                    {volunteers.map(v => <option key={v.volunteer_id} value={v.volunteer_id}>{v.full_name}</option>)}
                </select>
                <div className="flex items-center gap-2 text-sm font-semibold">
                    {config.icon}
                    <span>{config.label}</span>
                </div>
            </div>
        </div>
    );
};

const ProjectItem: React.FC<{ project: BousalaProject; tasks: BousalaTask[]; isAiLoading: boolean; onSuggestTasks: () => void; onPredictRisk: () => void; mainProjects: MainProject[]; volunteers: HrData['volunteers']; }> = ({ project, tasks, isAiLoading, onSuggestTasks, onPredictRisk, mainProjects, volunteers }) => {
    const { t } = useLocalization();
    const [isExpanded, setIsExpanded] = useState(false);
     // Hardcoded mapping for demonstration
    const linkedProjectMapping: Record<string, string> = {
        'P1': 'PROJ-2020-002',
        'P2': 'PROJ-2025-003',
    };
    const linkedSystemProject = mainProjects.find(p => p.id === linkedProjectMapping[project.id]);

    return (
        <div className="bg-gray-50 dark:bg-slate-800/50 p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <button onClick={() => setIsExpanded(!isExpanded)} className="w-full flex items-start justify-between text-left">
                <div className="flex items-start gap-4">
                    <Briefcase className="w-6 h-6 text-gray-600 dark:text-gray-400 mt-1 flex-shrink-0" />
                    <div>
                        <h4 className="font-bold text-lg text-foreground dark:text-dark-foreground">{project.title}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{project.description}</p>
                    </div>
                </div>
                <ChevronDown className={`w-5 h-5 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`} />
            </button>
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
                            {tasks.map(task => <TaskItem key={task.id} task={task} volunteers={volunteers}/>)}
                             <div className="flex gap-2 pt-2">
                                <button disabled={isAiLoading} onClick={onSuggestTasks} className="flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold border rounded-lg hover:bg-gray-100 disabled:opacity-50"><Sparkles size={14}/> {t('bousala.common.suggestTasksAi')}</button>
                                <button disabled={isAiLoading} onClick={onPredictRisk} className="flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold border rounded-lg hover:bg-gray-100 disabled:opacity-50"><ShieldAlert size={14}/> {t('bousala.common.predictRiskAi')}</button>
                            </div>
                            {linkedSystemProject && (
                                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
                                    <h5 className="font-semibold text-sm mb-2">{t('bousala.common.linkedExecutionProject')}:</h5>
                                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm space-y-1">
                                        <p className="font-bold text-blue-800 dark:text-blue-300">{linkedSystemProject.name.ar}</p>
                                        <p><strong>{t('bousala.common.budget')}:</strong> {formatCurrency(linkedSystemProject.budget, 'ar')}</p>
                                        <p><strong>{t('bousala.common.progress')}:</strong> {linkedSystemProject.progress}%</p>
                                        <h6 className="font-semibold mt-2">{t('bousala.common.kpiIndicators')}:</h6>
                                        <ul className="list-disc list-inside text-xs">
                                            {linkedSystemProject.kpis.map(kpi => <li key={kpi.id}>{kpi.name}: {kpi.target}</li>)}
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

const GoalCard: React.FC<{ goal: BousalaGoal; isExpanded: boolean; isAiLoading: boolean; onToggle: () => void; onAnalyze: () => void; onAddKpiClick: () => void; isRefreshingKpis: boolean; showAnimation: boolean; isPredicting: boolean; }> = ({ goal, isExpanded, isAiLoading, onToggle, onAnalyze, onAddKpiClick, isRefreshingKpis, showAnimation, isPredicting }) => {
    const { t } = useLocalization();
    return (
        <div className="bg-card dark:bg-dark-card rounded-t-xl shadow-soft border dark:border-slate-700/50 overflow-hidden">
            <div className="p-6">
                <div className="flex justify-between items-start">
                    <div className="flex items-start gap-4">
                        <Target className="w-8 h-8 text-primary dark:text-secondary flex-shrink-0" />
                        <div>
                            <h3 className="font-bold text-xl text-primary dark:text-secondary">{goal.title}</h3>
                            <p className="text-sm text-gray-500 mt-1">{goal.description}</p>
                        </div>
                    </div>
                     <button onClick={onToggle} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700/50 flex-shrink-0">
                        <ChevronDown className={`w-6 h-6 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>
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
                                        <h5 className="font-semibold text-sm">{insight.title}</h5>
                                        <MarkdownRenderer content={insight.content} />
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
    t: (key: string) => string;
    onAddTaskClick: () => void;
    onAddGoalClick: () => void;
    onLinkProjectClick: () => void;
    onViewReportsClick: () => void;
    aiAnalyticsSummary: string;
}> = ({ loadingSection, insights, t, onAddTaskClick, onAddGoalClick, onLinkProjectClick, onViewReportsClick, aiAnalyticsSummary }) => {
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
                                        <p className="text-sm mt-1 text-blue-700 dark:text-blue-300">{aiAnalyticsSummary}</p>
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

const AnalyticsDashboard: React.FC = () => {
    const { theme } = useTheme();
    const { t } = useLocalization();
    const isDark = theme === 'dark';

    const textColor = isDark ? '#f1f5f9' : '#334155';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    const COLORS = ['hsl(210, 40%, 50%)', 'hsl(145, 63%, 49%)', '#FFBB28', '#FF8042'];

    const goalProgressData = initialBousalaData.goals.map(g => ({ name: g.title, value: g.progress }));
    const projectProgressData = initialBousalaData.projects.map(p => ({ name: p.title, progress: p.progress }));

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

const CollapsibleAnalytics: React.FC<{goals: BousalaGoal[]}> = ({goals}) => {
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
                            <AnalyticsDashboard />
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

const BousalaPage: React.FC<BousalaPageProps> = ({ projects: mainProjects, hrData, role }) => {
    const { language, dir, t } = useLocalization();
    const toast = useToast();
    const [aiAnalyticsSummary, setAiAnalyticsSummary] = useState('');
    const [activeView, setActiveView] = useState('dashboard');
    const [presentationAlert, setPresentationAlert] = useState<{ message: string; icon: React.ReactNode } | null>(null);

    const [bousalaState, setBousalaState] = useState(initialBousalaData);
    const [expandedGoal, setExpandedGoal] = useState<string | null>(bousalaState.goals[0]?.id || null);
    const [aiLoading, setAiLoading] = useState<'tasks' | 'kpis' | 'risks' | null>(null);
    const [aiInsights, setAiInsights] = useState<{ tasks: AiInsight[]; kpis: AiInsight[]; risks: AiInsight[] }>({
        tasks: [{ id: Date.now(), title: t('bousala.defaultInsights.tasksTitle'), content: t('bousala.defaultInsights.tasksContent') }],
        kpis: [{ id: Date.now() + 1, title: t('bousala.defaultInsights.kpisTitle'), content: t('bousala.defaultInsights.kpisContent') }],
        risks: [{ id: Date.now() + 2, title: t('bousala.defaultInsights.risksTitle'), content: t('bousala.defaultInsights.risksContent') }]
    });
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
    
    const [showSplashScreen, setShowSplashScreen] = useState(true);
    const [isAlertsCenterOpen, setIsAlertsCenterOpen] = useState(false);
    const [alertCount, setAlertCount] = useState(0);
    const [initialTaskData, setInitialTaskData] = useState(null);

     const [kpiSettings, setKpiSettings] = useState<KpiSettings>(() => {
        const saved = sessionStorage.getItem('bousalaKpiSettings');
        return saved ? JSON.parse(saved) : { interval: 60, smartRefresh: true, showAnimation: true };
    });
    const [tempKpiSettings, setTempKpiSettings] = useState(kpiSettings);
    
     const [notificationSettings, setNotificationSettings] = useState<BousalaNotificationSettings>(() => {
        const saved = sessionStorage.getItem('bousalaNotificationSettings');
        return saved ? JSON.parse(saved) : {
            smartAlertsEnabled: true,
            severityThreshold: 70,
            alertSoundEnabled: true,
            aiAutoRecommendationsEnabled: true,
        };
    });
    const [tempNotificationSettings, setTempNotificationSettings] = useState(notificationSettings);

    
    const showPresentationAlert = useCallback((message: string, icon: React.ReactNode) => {
        setPresentationAlert({ message, icon });
        setTimeout(() => {
            setPresentationAlert(null);
        }, 5000);
    }, []);

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
            const mockResponse = `**تحليل الأداء لهدف: "${goal.title}"**
- **التقدم الحالي:** ${goal.progress}%
- **الأداء الإيجابي:** المشروع الرئيسي ("${bousalaState.projects.find(p => p.linkedGoal === goal.id)?.title}") يسير بشكل جيد (${bousalaState.projects.find(p => p.linkedGoal === goal.id)?.progress}%)، مما يدعم الهدف مباشرة.
- **توقع مستقبلي:** إذا استمر التقدم بنفس الوتيرة، من المتوقع تحقيق **85-90%** من الهدف بحلول نهاية الربع.`;
            const newInsight = { id: Date.now(), title: `تحليل أثر الهدف: ${goal.title}`, content: mockResponse };

            const kpiInsights: AiInsight[] = [];
            if (goal.kpis) {
                goal.kpis.forEach(kpi => {
                    if (kpi.target > 0 && kpi.value < kpi.target) {
                        const progressPercentage = (kpi.value / kpi.target) * 100;
                        if (progressPercentage < 80) {
                            const gapPercentage = Math.round(100 - progressPercentage);
                            const insightContent = `الأداء أقل من المستهدف بنسبة ${gapPercentage}%، يُنصح بزيادة الموارد أو مراجعة الخطة.`;
                            kpiInsights.push({ id: Date.now() + Math.random(), title: `تحليل أداء مؤشر: ${kpi.title}`, content: insightContent });
                        }
                    }
                });
            }

            setAiInsights(prev => ({...prev, kpis: [...kpiInsights, newInsight].filter((v,i,a)=>a.findIndex(t=>(t.title === v.title))===i) }));
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


    const handleToggle = (goalId: string) => {
        setExpandedGoal(prev => prev === goalId ? null : goalId);
    };
    
    const handleAddTask = (newTaskData: { title: string; goalId: string; dueDate: string; priority: string; }) => {
        const project = bousalaState.projects.find(p => p.linkedGoal === newTaskData.goalId);
        const newTask: BousalaTask = {
            id: `T-${Date.now()}`,
            title: newTaskData.title,
            description: 'New task added via modal',
            status: 'in-progress',
            linkedProject: project?.id || '',
            assignee: 'Unassigned'
        };
        setBousalaState(prev => ({
            ...prev,
            tasks: [newTask, ...prev.tasks]
        }));
        toast.showSuccess(t('bousala.addTaskModal.success'));
        if (isPresentationMode && notificationSettings.alertSoundEnabled) playFeedbackSound('success');
        setIsAddTaskModalOpen(false);
        setInitialTaskData(null); // Clear pre-filled data

        if (kpiSettings.smartRefresh && project) {
            refreshKpiData(project.linkedGoal);
        }
    };
    
    const handleLinkProject = (projectIds: string[]) => {
        if (!expandedGoal) return;

        setBousalaState(prev => {
            const newState = JSON.parse(JSON.stringify(prev));
            const goal = newState.goals.find((g: BousalaGoal) => g.id === expandedGoal);
            if (!goal) return prev;

            projectIds.forEach(id => {
                const mainProject = mainProjects.find(p => p.id === id);
                if (mainProject) {
                    const newBousalaProjectId = `BP-${id}`;
                    if (newState.projects.some((p: BousalaProject) => p.id === newBousalaProjectId)) return;
                    
                    const newBousalaProject: BousalaProject = {
                        id: newBousalaProjectId,
                        title: mainProject.name.ar,
                        description: mainProject.goal,
                        progress: mainProject.progress,
                        linkedGoal: goal.id,
                        linkedTasks: []
                    };
                    newState.projects.push(newBousalaProject);
                    goal.linkedProjects.push(newBousalaProjectId);
                }
            });

            const linkedBousalaProjects = newState.projects.filter((p: BousalaProject) => goal.linkedProjects.includes(p.id));
            if (linkedBousalaProjects.length > 0) {
                const totalProgress = linkedBousalaProjects.reduce((sum: number, p: BousalaProject) => sum + p.progress, 0);
                goal.progress = Math.round(totalProgress / linkedBousalaProjects.length);
            }

            return newState;
        });

        toast.showSuccess(t('bousala.messages.projectLinkedSuccess'));
        if (isPresentationMode && notificationSettings.alertSoundEnabled) playFeedbackSound('success');
        setIsLinkProjectModalOpen(false);
        if (kpiSettings.smartRefresh) {
            refreshKpiData(expandedGoal);
        }
    };

    const handleAddGoal = (goalData: { title: string; description: string; progress: number; responsiblePerson: string; }) => {
        const newGoal: BousalaGoal = {
            id: `G-${Date.now()}`,
            title: goalData.title,
            description: goalData.description,
            progress: goalData.progress,
            responsiblePerson: goalData.responsiblePerson,
            linkedProjects: [],
            kpis: [],
        };
        setBousalaState(prev => ({
            ...prev,
            goals: [newGoal, ...prev.goals]
        }));
        toast.showSuccess(t('bousala.messages.goalAddedSuccess', { title: goalData.title }));
        if (isPresentationMode && notificationSettings.alertSoundEnabled) playFeedbackSound('success');
        setIsAddGoalModalOpen(false);
    };
    
    const handleAddKpi = (kpiData: { title: string; value: number; target: number; unit: string; goalId: string; }) => {
        const newKpi: BousalaKpi = {
            id: `KPI-${Date.now()}`,
            title: kpiData.title,
            value: kpiData.value,
            target: kpiData.target,
            unit: kpiData.unit,
            trend: 'stable',
            lastUpdated: new Date().toISOString(),
        };
        setBousalaState(prev => {
            const newGoals = prev.goals.map(goal => {
                if (goal.id === kpiData.goalId) {
                    return {
                        ...goal,
                        kpis: [...(goal.kpis || []), newKpi]
                    };
                }
                return goal;
            });
            return { ...prev, goals: newGoals };
        });
        toast.showSuccess(t('bousala.messages.kpiAddedSuccess'));
        if (isPresentationMode && notificationSettings.alertSoundEnabled) playFeedbackSound('success');
        setIsAddKpiModalOpen(false);
        if (kpiSettings.smartRefresh) {
            refreshKpiData(kpiData.goalId);
        }
    };

    const handleAiTaskSuggestion = async (project: BousalaProject) => {
        setAiLoading('tasks');
        setTimeout(() => {
            const mockResponse = `بناءً على وصف مشروع **"${project.title}"**، إليك بعض المهام المقترحة:
- **مرحلة التخطيط:** تحديد الجمهور المستهدف للحملة ووضع الرسائل التسويقية الرئيسية.
- **مرحلة التنفيذ:** إطلاق الحملة عبر منصات التواصل الاجتماعي والبريد الإلكتروني.
- **مرحلة المتابعة:** تحليل أداء الحملة وإعداد تقرير للمانحين.
- **مهمة إضافية:** تنظيم حدث افتراضي للتعريف بالحملة وأهدافها.`;
            const newInsight = { id: Date.now(), title: `مهام مقترحة لمشروع: ${project.title}`, content: mockResponse };
            setAiInsights(prev => ({...prev, tasks: [newInsight, ...prev.tasks]}));
            setAiLoading(null);
        }, 1500);
    };

    const handleAiRiskPrediction = async (project: BousalaProject) => {
        setAiLoading('risks');
        setTimeout(() => {
             const mockResponse = `**توقع المخاطر: متوسط**
- **السيناريو المحتمل:** بناءً على التقدم الحالي (60%)، من المتوقع أن يتأخر المشروع عن الموعد النهائي بنسبة 15-20% إذا لم يتم اتخاذ إجراء.
- **العوامل المؤثرة:**
  - الاعتماد على فريق التسويق لإنجاز مهمة حرجة ("تصميم المواد الإعلانية").
  - عدم وجود مهام مجدولة للمرحلة التالية من المشروع.
- **إجراء وقائي مقترح:**
  1. **عاجل:** قم بجدولة اجتماع مع فريق التسويق لتحديد موعد نهائي واضح لمهمة التصميم.
  2. **تخطيط:** ابدأ في تحديد وإضافة المهام للمرحلة التالية من المشروع لضمان استمرارية العمل.`;
            const newInsight = { id: Date.now(), title: `توقع مخاطر التأخير لمشروع: ${project.title}`, content: mockResponse };
            setAiInsights(prev => ({...prev, risks: [newInsight, ...prev.risks]}));
            setAiLoading(null);
        }, 1500);
    };
    
    const linkedProjectNamesForCurrentGoal = bousalaState.projects
        .filter(p => expandedGoal && bousalaState.goals.find(g => g.id === expandedGoal)?.linkedProjects.includes(p.id))
        .map(p => p.title);

    const handleOpenTaskModal = (initialData = null) => {
        setInitialTaskData(initialData);
        setIsAddTaskModalOpen(true);
    };
    
    if (showSplashScreen) {
        return <SplashScreen onFinish={() => setShowSplashScreen(false)} />;
    }
    
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
        switch (activeView) {
            case 'predictive':
                return <PredictiveDashboard goals={bousalaState.goals} />;
            case 'dashboard':
            default:
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
                                            onToggle={() => handleToggle(goal.id)}
                                            onAnalyze={() => handleAiImpactAnalysis(goal)}
                                            onAddKpiClick={() => {
                                                setGoalForNewKpi(goal.id);
                                                setIsAddKpiModalOpen(true);
                                            }}
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
                                                    {goal.kpis && goal.kpis.length > 0 && (
                                                        <div>
                                                            <div className="flex justify-between items-center mb-2">
                                                                <h5 className="font-semibold text-sm">{t('bousala.kpis')}</h5>
                                                            </div>
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                                {goal.kpis.map(kpi => <KpiCard key={kpi.id} kpi={kpi} isRefreshing={refreshingKpiIds.has(kpi.id)} isPredicting={predictingKpiIds.has(kpi.id)} showAnimation={kpiSettings.showAnimation}/>)}
                                                            </div>
                                                        </div>
                                                    )}
                                                    {predictingGoals.has(goal.id) ? (
                                                        <div className="text-center p-4 text-sm text-gray-500"><Spinner text={t('bousala.common.goalPredictionsAnalysis')} /></div>
                                                    ) : goal.prediction && (
                                                        <div className="pt-4 border-t border-gray-200 dark:border-slate-700/50 space-y-4">
                                                            <h5 className="font-semibold text-sm">{t('bousala.prediction.title')}</h5>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                                                                <div>
                                                                    <PredictionBar progress={goal.prediction.probability} />
                                                                </div>
                                                                <div className="flex items-center gap-4 text-sm font-semibold">
                                                                    {predictionTrendIcons[goal.prediction.trend]}
                                                                    <span>{t('bousala.prediction.summary', { percentage: goal.prediction.probability })}</span>
                                                                </div>
                                                            </div>
                                                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm flex items-center gap-2">
                                                                <Bot size={16} className="text-blue-600"/>
                                                                <span className="text-blue-800 dark:text-blue-200">{goal.prediction.recommendation}</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {linkedProjects.length > 0 && (
                                                        <div className="pt-4 border-t border-gray-200 dark:border-slate-700/50">
                                                            <h5 className="font-semibold text-sm mb-2">{t('bousala.projects')}:</h5>
                                                            <div className="space-y-3">
                                                                {linkedProjects.map(project => (
                                                                    <ProjectItem 
                                                                        key={project.id} 
                                                                        project={project} 
                                                                        tasks={bousalaState.tasks.filter(t => t.linkedProject === project.id)}
                                                                        isAiLoading={aiLoading === 'tasks' || aiLoading === 'risks'}
                                                                        onSuggestTasks={() => handleAiTaskSuggestion(project)}
                                                                        onPredictRisk={() => handleAiRiskPrediction(project)}
                                                                        mainProjects={mainProjects}
                                                                        volunteers={hrData.volunteers}
                                                                    />
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
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
                                    t={t}
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
                allProjects={mainProjects}
                linkedProjectNames={linkedProjectNamesForCurrentGoal}
            />
             <AddKpiModal 
                isOpen={isAddKpiModalOpen}
                onClose={() => setIsAddKpiModalOpen(false)}
                onAdd={handleAddKpi}
                goalId={goalForNewKpi || ''}
            />
            <AlertsCenterPanel
                isOpen={isAlertsCenterOpen}
                onClose={() => setIsAlertsCenterOpen(false)}
                goals={bousalaState.goals}
                onCreateTask={handleOpenTaskModal}
                setNotificationCount={setAlertCount}
            />
            <InPresentationAlert alert={presentationAlert} />
            <div className="animate-fade-in space-y-8" dir="rtl">
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
