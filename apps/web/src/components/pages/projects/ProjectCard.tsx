import React from 'react';
import { useLocalization } from '../../../hooks/useLocalization';
import type { Project } from '../../../types';
import { formatCurrency } from '../../../lib/utils';
import { motion } from 'framer-motion';
import { MapPin, Calendar, ArrowRight } from 'lucide-react';

interface ProjectCardProps {
    project: Project;
    onSelect: (project: Project) => void;
}

const stageConfig: Record<string, { bg: string; text: string; accent: string }> = {
    design: { bg: 'bg-slate-100 dark:bg-slate-700/40', text: 'text-slate-700 dark:text-slate-300', accent: 'from-slate-400 to-slate-500' },
    planning: { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-300', accent: 'from-amber-400 to-orange-500' },
    implementation: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-300', accent: 'from-blue-500 to-indigo-600' },
    monitoring: { bg: 'bg-violet-50 dark:bg-violet-900/20', text: 'text-violet-700 dark:text-violet-300', accent: 'from-violet-500 to-purple-600' },
    closure: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-300', accent: 'from-emerald-500 to-teal-600' },
};

const progressColor = (progress: number) => {
    if (progress >= 75) return 'bg-emerald-500';
    if (progress >= 40) return 'bg-blue-500';
    if (progress > 0) return 'bg-amber-500';
    return 'bg-gray-300 dark:bg-slate-600';
};

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onSelect }) => {
    const { t, language } = useLocalization();
    const stage = stageConfig[project.stage] || stageConfig.design;
    const budgetUsed = project.budget > 0 ? Math.round((project.spent / project.budget) * 100) : 0;
    const formatProjectLocation = (city?: string, country?: string) => {
        if (!city && !country) return '';
        if (!city) return country || '';
        if (!country) return city;
        return language === 'ar' ? `${country}، ${city}` : `${city}, ${country}`;
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.25 }}
            onClick={() => onSelect(project)}
            className="bg-card dark:bg-dark-card rounded-xl shadow-soft transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 flex flex-col cursor-pointer border border-gray-200 dark:border-slate-700/50 overflow-hidden group"
        >
            <div className={`h-1 bg-gradient-to-r ${stage.accent}`} />

            <div className="p-5 flex flex-col flex-grow">
                <div className="flex justify-between items-start gap-3 mb-3">
                    <h3 className="font-semibold text-foreground dark:text-dark-foreground leading-snug group-hover:text-primary dark:group-hover:text-secondary transition-colors line-clamp-2">
                        {project.name[language] || project.name.en}
                    </h3>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 ${stage.bg} ${stage.text}`}>
                        {t(`projects.stages.${project.stage}`)}
                    </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-gray-400 mb-4">
                    {project.location && (
                        <span className="flex items-center gap-1">
                            <MapPin size={11} />
                            {formatProjectLocation(project.location.city, project.location.country)}
                        </span>
                    )}
                    <span className="flex items-center gap-1">
                        <Calendar size={11} />
                        {new Date(project.plannedStartDate).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', { month: 'short', year: 'numeric' })}
                    </span>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mb-4">
                    <div>
                        <p className="text-xs text-gray-400">{t('projects.list.budget')}</p>
                        <p className="font-semibold text-foreground dark:text-dark-foreground">{formatCurrency(project.budget, language)}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400">{t('projects.list.spent', 'Spent')}</p>
                        <p className={`font-semibold ${budgetUsed > 90 ? 'text-red-500' : 'text-gray-600 dark:text-gray-300'}`}>{formatCurrency(project.spent, language)}</p>
                    </div>
                </div>

                <div className="mt-auto pt-3 border-t border-gray-100 dark:border-slate-700/50">
                    <div className="flex justify-between items-center mb-1.5">
                        <span className="text-xs text-gray-400">{t('projects.list.progress')}</span>
                        <span className="text-xs font-bold text-foreground dark:text-dark-foreground">{project.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${progressColor(project.progress)}`} style={{ width: `${project.progress}%` }}></div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default ProjectCard;
