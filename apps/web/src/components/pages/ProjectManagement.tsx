import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useLocalization } from '../../hooks/useLocalization';
import { useToast } from '../../hooks/useToast';
import type { Project } from '../../types';
import ProjectList from './projects/ProjectList';
import CreateProjectWizard from './projects/CreateProjectWizard';
import ProjectDetailView from './projects/ProjectDetailView';
import SDGAlignmentDashboard from './projects/SDGAlignmentDashboard';
import { formatCurrency } from '../../lib/utils';
import { isOptimisticProject } from '../../lib/projectOptimistic';
import { OPTIMISTIC_HIGHLIGHT_MS } from '../../lib/optimisticSubmit';
import { List, Target, PlusCircle, FolderKanban, DollarSign, TrendingUp, CheckCircle2 } from 'lucide-react';
import { useCreateProject, useProject, useProjects, useUpdateProject } from '../../hooks/useProjects';

const STAT_CARD_SKELETON_COUNT = 4;

const ProjectsStatCardsSkeleton: React.FC = () => (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: STAT_CARD_SKELETON_COUNT }).map((_, i) => (
            <div
                key={i}
                className="bg-card dark:bg-dark-card rounded-xl border border-gray-200 dark:border-slate-700/50 p-4 flex items-center gap-4"
            >
                <div className="p-2.5 rounded-lg bg-gray-100 dark:bg-slate-800">
                    <div className="w-5 h-5 rounded-md bg-gray-200 dark:bg-slate-700 animate-pulse" />
                </div>
                <div className="flex-1 space-y-2">
                    <div className="h-7 w-14 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
                    <div className="h-3 w-24 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
                </div>
            </div>
        ))}
    </div>
);

const ProjectDetailSkeleton: React.FC = () => (
    <div className="animate-fade-in space-y-4">
        <div className="bg-card dark:bg-dark-card rounded-xl border border-gray-200 dark:border-slate-700/50 p-5 space-y-4">
            <div className="h-5 w-32 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                    <div className="h-8 w-2/3 max-w-md bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
                    <div className="h-4 w-48 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
                </div>
                <div className="flex items-center gap-6 shrink-0">
                    <div className="h-10 w-24 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
                    <div className="h-10 w-20 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
                </div>
            </div>
        </div>
        <div className="bg-card dark:bg-dark-card rounded-xl border border-gray-200 dark:border-slate-700/50 overflow-hidden">
            <div className="px-6 pt-4 pb-2 flex gap-2 overflow-hidden">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-8 w-20 shrink-0 bg-gray-200 dark:bg-slate-700 rounded-lg animate-pulse" />
                ))}
            </div>
            <div className="p-6 space-y-4">
                <div className="h-4 w-full bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
                <div className="h-4 w-5/6 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
                <div className="h-48 w-full bg-gray-100 dark:bg-slate-800 rounded-xl animate-pulse" />
            </div>
        </div>
    </div>
);

interface ProjectManagementProps {
  deepLinkTarget?: { id?: string; tab?: string } | null;
}

const ProjectManagement: React.FC<ProjectManagementProps> = ({ deepLinkTarget }) => {
    const { t, language } = useLocalization(['common', 'projects', 'beneficiaries', 'misc']);
    const toast = useToast();
    const { data: projects = [], isLoading: isProjectsLoading } = useProjects();
    const createProject = useCreateProject();
    const updateProject = useUpdateProject();
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
    const [selectedInitialTab, setSelectedInitialTab] = useState<string | undefined>(undefined);
    const { data: selectedProject, isLoading: isSelectedProjectLoading } = useProject(selectedProjectId);
    const [activeView, setActiveView] = useState('list');
    const [highlightedId, setHighlightedId] = useState<string | null>(null);
    const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        return () => {
            if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
        };
    }, []);

    const flashHighlight = useCallback((id: string) => {
        if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
        setHighlightedId(id);
        highlightTimerRef.current = setTimeout(() => setHighlightedId(null), OPTIMISTIC_HIGHLIGHT_MS);
    }, []);

    useEffect(() => {
        if (deepLinkTarget?.id) {
            const projectToSelect = projects.find(p => p.id === deepLinkTarget.id);
            if (projectToSelect) {
                setSelectedProjectId(projectToSelect.id);
                setSelectedInitialTab(deepLinkTarget.tab);
            }
        }
    }, [deepLinkTarget, projects]);

    const existingCountries = useMemo(
        () => Array.from(new Set(projects.map((p) => p.location?.country).filter(Boolean) as string[])).sort(),
        [projects],
    );

    const stats = useMemo(() => {
        const realProjects = projects.filter((p) => !isOptimisticProject(p.id));
        const totalBudget = realProjects.reduce((sum, p) => sum + p.budget, 0);
        const totalSpent = realProjects.reduce((sum, p) => sum + p.spent, 0);
        const activeCount = realProjects.filter(p => p.stage === 'implementation' || p.stage === 'monitoring').length;
        const completedCount = realProjects.filter(p => p.stage === 'closure').length;
        const avgProgress = realProjects.length > 0
            ? Math.round(realProjects.reduce((sum, p) => sum + p.progress, 0) / realProjects.length)
            : 0;
        return { totalBudget, totalSpent, activeCount, completedCount, avgProgress, total: realProjects.length };
    }, [projects]);

    const handleCreateProject = (newProjectData: Omit<Project, 'id'>) => {
        void createProject.mutateAsync(newProjectData).then((created) => {
            flashHighlight(created.id);
            toast.showSuccess(t('projects.createSuccess', 'Project created successfully'));
        }).catch(() => {
            toast.showError(t('projects.createFailed', 'Unable to create project. Please try again.'));
        });
    };

    const handleUpdateProject = (updated: Project) => {
        void updateProject.mutateAsync(updated).catch(() => {
            toast.showError(t('projects.updateFailed', 'Unable to update project. Please try again.'));
        });
    };

    if (selectedProjectId) {
        if (isSelectedProjectLoading || !selectedProject) {
            return <ProjectDetailSkeleton />;
        }
        return <ProjectDetailView
                    project={selectedProject}
                    existingCountries={existingCountries}
                    onBack={() => {
                        setSelectedProjectId(null);
                        setSelectedInitialTab(undefined);
                    }}
                    onUpdate={handleUpdateProject}
                    initialTab={selectedInitialTab}
                />;
    }

    const getViewButtonClass = (view: string) => {
        return activeView === view
            ? 'bg-primary text-white shadow-md'
            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700';
    };

    const statCards = [
        { label: t('projects.stats.total', 'Total Projects'), value: stats.total, icon: FolderKanban, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
        { label: t('projects.stats.active', 'Active'), value: stats.activeCount, icon: TrendingUp, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
        { label: t('projects.stats.completed', 'Completed'), value: stats.completedCount, icon: CheckCircle2, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-900/20' },
        { label: t('projects.stats.totalBudget', 'Total Budget'), value: formatCurrency(stats.totalBudget, language), icon: DollarSign, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
    ];

    return (
        <>
            <div className="space-y-6 animate-fade-in">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground dark:text-dark-foreground">
                            {t('projects.title')}
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {t('projects.subtitle', 'Track and manage all organizational projects')}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="p-1 bg-gray-100 dark:bg-dark-card rounded-lg flex items-center space-x-1 rtl:space-x-reverse">
                            <button onClick={() => setActiveView('list')} className={`flex items-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${getViewButtonClass('list')}`}>
                                <List size={16} />
                                <span>{t('projects.projectList')}</span>
                            </button>
                            <button onClick={() => setActiveView('sdg')} className={`flex items-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${getViewButtonClass('sdg')}`}>
                                <Target size={16} />
                                <span>{t('projects.sdgAnalytics.title')}</span>
                            </button>
                        </div>
                         <button
                            onClick={() => setIsWizardOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-secondary hover:bg-secondary-dark rounded-lg transition-colors shadow-sm"
                        >
                            <PlusCircle size={18} />
                            {t('projects.createProject')}
                        </button>
                    </div>
                </div>

                {isProjectsLoading ? (
                    <ProjectsStatCardsSkeleton />
                ) : (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {statCards.map((stat) => (
                            <div key={stat.label} className="bg-card dark:bg-dark-card rounded-xl border border-gray-200 dark:border-slate-700/50 p-4 flex items-center gap-4">
                                <div className={`p-2.5 rounded-lg ${stat.bg}`}>
                                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-foreground dark:text-dark-foreground">{stat.value}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeView === 'list' && (
                    <ProjectList
                        projects={projects}
                        isLoading={isProjectsLoading}
                        highlightedId={highlightedId}
                        onProjectSelect={(project) => {
                            if (isOptimisticProject(project.id)) return;
                            setSelectedProjectId(project.id);
                            setSelectedInitialTab('overview');
                        }}
                    />
                )}

                {activeView === 'sdg' && !isProjectsLoading && (
                    <SDGAlignmentDashboard projects={projects} />
                )}
                {activeView === 'sdg' && isProjectsLoading && (
                    <div className="h-64 bg-gray-100 dark:bg-slate-800 rounded-xl animate-pulse border border-gray-200 dark:border-slate-700/50" />
                )}
            </div>

            {isWizardOpen && (
                <CreateProjectWizard
                    isOpen={isWizardOpen}
                    onClose={() => setIsWizardOpen(false)}
                    onCreateProject={handleCreateProject}
                    existingCountries={existingCountries}
                />
            )}
        </>
    );
};

export default ProjectManagement;
