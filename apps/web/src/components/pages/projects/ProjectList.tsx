
import React, { useState, useMemo } from 'react';
import { useLocalization } from '../../../hooks/useLocalization';
import type { Project } from '../../../types';
import { formatCurrency } from '../../../lib/utils';
import EmptyState from '../../common/EmptyState';
import ProjectListControls from './ProjectListControls';
import ProjectCard from './ProjectCard';
import { MapPin, Calendar, ChevronRight } from 'lucide-react';

interface ProjectListProps {
    projects: Project[];
    onProjectSelect: (project: Project) => void;
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

const ProjectList: React.FC<ProjectListProps> = ({ projects, onProjectSelect }) => {
    const { t, language, dir } = useLocalization();
    const [view, setView] = useState<'list' | 'card'>('list');
    const [searchTerm, setSearchTerm] = useState('');

    const filteredProjects = useMemo(() => {
        if (!searchTerm) return projects;
        const lower = searchTerm.toLowerCase();
        return projects.filter(p =>
            (p.name[language] || p.name.en)?.toLowerCase().includes(lower) ||
            p.id.toLowerCase().includes(lower) ||
            p.location?.country?.toLowerCase().includes(lower) ||
            p.location?.city?.toLowerCase().includes(lower)
        );
    }, [projects, searchTerm, language]);
    const formatProjectLocation = (city?: string, country?: string) => {
        if (!city && !country) return '';
        if (!city) return country || '';
        if (!country) return city;
        return language === 'ar' ? `${country}، ${city}` : `${city}, ${country}`;
    };

    const renderListView = () => (
        <div className="bg-card dark:bg-dark-card rounded-xl shadow-soft overflow-hidden border border-gray-200 dark:border-slate-700/50">
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-gray-100 dark:border-slate-700/50">
                            <th className="text-start p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('projects.list.name')}</th>
                            <th className="text-start p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('projects.list.stage')}</th>
                            <th className="text-start p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('projects.list.progress')}</th>
                            <th className="text-end p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('projects.list.budget')}</th>
                            <th className="p-4 w-10"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                        {filteredProjects.map(project => {
                            const stage = stageConfig[project.stage] || stageConfig.design;
                            return (
                                <tr
                                    key={project.id}
                                    className="hover:bg-gray-50/80 dark:hover:bg-slate-800/40 cursor-pointer transition-colors group"
                                    onClick={() => onProjectSelect(project)}
                                >
                                    <td className="p-4">
                                        <p className="font-semibold text-foreground dark:text-dark-foreground group-hover:text-primary dark:group-hover:text-secondary transition-colors">
                                            {project.name[language] || project.name.en}
                                        </p>
                                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                                            {project.location && (
                                                <span className="flex items-center gap-1">
                                                    <MapPin size={11} />
                                                    {formatProjectLocation(project.location.city, project.location.country)}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${stage.bg} ${stage.text}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${stage.dot}`}></span>
                                            {t(`projects.stages.${project.stage}`)}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-3 min-w-[140px]">
                                            <div className="flex-1 bg-gray-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                                                <div className={`h-full rounded-full transition-all ${progressColor(project.progress)}`} style={{ width: `${project.progress}%` }}></div>
                                            </div>
                                            <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 w-10 text-end">{project.progress}%</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-end">
                                        <p className="font-semibold text-foreground dark:text-dark-foreground">{formatCurrency(project.budget, language)}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">{t('projects.list.spent', 'Spent')}: {formatCurrency(project.spent, language)}</p>
                                    </td>
                                    <td className="p-4">
                                        <ChevronRight size={16} className={`text-gray-300 dark:text-slate-600 group-hover:text-primary dark:group-hover:text-secondary transition-colors ${dir === 'rtl' ? 'rotate-180' : ''}`} />
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderCardView = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProjects.map(project => (
                <ProjectCard key={project.id} project={project} onSelect={() => onProjectSelect(project)} />
            ))}
        </div>
    );

    return (
        <div className="space-y-4">
            <ProjectListControls
                view={view}
                onViewChange={setView}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
            />

            {filteredProjects.length > 0 ? (
                <>
                    {view === 'list' && renderListView()}
                    {view === 'card' && renderCardView()}
                </>
            ) : (
                <EmptyState type="NoResults" />
            )}
        </div>
    );
};

export default ProjectList;
