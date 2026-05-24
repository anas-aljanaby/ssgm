import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useLocalization } from '../../hooks/useLocalization';
import { useToast } from '../../hooks/useToast';
import type { Project, Beneficiary } from '../../types';
import ProjectList from './projects/ProjectList';
import CreateProjectWizard from './projects/CreateProjectWizard';
import ProjectDetailView from './projects/ProjectDetailView';
import SDGAlignmentDashboard from './projects/SDGAlignmentDashboard';
import { formatCurrency } from '../../lib/utils';
import { isOptimisticProject } from '../../lib/projectOptimistic';
import { OPTIMISTIC_HIGHLIGHT_MS } from '../../lib/optimisticSubmit';
import { List, Target, PlusCircle, FolderKanban, DollarSign, TrendingUp, CheckCircle2 } from 'lucide-react';
import { useCreateProject, useProject, useProjects, useUpdateProject } from '../../hooks/useProjects';

interface ProjectManagementProps {
  beneficiaries: Beneficiary[];
  deepLinkTarget?: { id?: string; tab?: string } | null;
}

const ProjectManagement: React.FC<ProjectManagementProps> = ({ beneficiaries, deepLinkTarget }) => {
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
            return <div className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">{t('common.loading', 'Loading...')}</div>;
        }
        return <ProjectDetailView
                    project={selectedProject}
                    beneficiaries={beneficiaries}
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

                {activeView === 'list' && (
                    <ProjectList
                        projects={projects}
                        highlightedId={highlightedId}
                        onProjectSelect={(project) => {
                            if (isOptimisticProject(project.id)) return;
                            setSelectedProjectId(project.id);
                            setSelectedInitialTab('overview');
                        }}
                    />
                )}

                {activeView === 'sdg' && (
                    <SDGAlignmentDashboard projects={projects} />
                )}
                {isProjectsLoading && (
                    <div className="text-sm text-gray-500 dark:text-gray-400">{t('common.loading', 'Loading...')}</div>
                )}
            </div>

            {isWizardOpen && (
                <CreateProjectWizard
                    isOpen={isWizardOpen}
                    onClose={() => setIsWizardOpen(false)}
                    onCreateProject={handleCreateProject}
                />
            )}
        </>
    );
};

export default ProjectManagement;
