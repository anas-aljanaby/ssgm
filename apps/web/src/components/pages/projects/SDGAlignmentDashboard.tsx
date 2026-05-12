
import React, { useState, useMemo } from 'react';
import { useLocalization } from '../../../hooks/useLocalization';
import type { Project } from '../../../types';
import { MOCK_PROGRAM_DATA } from '../../../data/programData';
import { formatCurrency } from '../../../lib/utils';
import { Target, Users, DollarSign, BarChart3 as BarChartIcon } from 'lucide-react';

const sdgShortNames: Record<number, { en: string; ar: string }> = {
    1: { en: 'No Poverty', ar: 'القضاء على الفقر' },
    2: { en: 'Zero Hunger', ar: 'القضاء على الجوع' },
    3: { en: 'Good Health', ar: 'الصحة الجيدة' },
    4: { en: 'Quality Education', ar: 'التعليم الجيد' },
    5: { en: 'Gender Equality', ar: 'المساواة بين الجنسين' },
    6: { en: 'Clean Water', ar: 'المياه النظيفة' },
    7: { en: 'Clean Energy', ar: 'طاقة نظيفة' },
    8: { en: 'Decent Work', ar: 'العمل اللائق' },
    9: { en: 'Innovation', ar: 'الابتكار' },
    10: { en: 'Reduced Inequality', ar: 'الحد من عدم المساواة' },
    11: { en: 'Sustainable Cities', ar: 'مدن مستدامة' },
    12: { en: 'Responsible Use', ar: 'الاستهلاك المسؤول' },
    13: { en: 'Climate Action', ar: 'العمل المناخي' },
    14: { en: 'Life Below Water', ar: 'الحياة تحت الماء' },
    15: { en: 'Life on Land', ar: 'الحياة في البر' },
    16: { en: 'Peace & Justice', ar: 'السلام والعدل' },
    17: { en: 'Partnerships', ar: 'الشراكات' },
};

const getSdgIconUrl = (id: number) =>
    `https://sdgs.un.org/sites/default/files/goals/E_SDG_Icons-${String(id).padStart(2, '0')}.jpg`;

const progressColor = (progress: number) => {
    if (progress >= 75) return 'bg-emerald-500';
    if (progress >= 40) return 'bg-blue-500';
    if (progress > 0) return 'bg-amber-500';
    return 'bg-gray-200 dark:bg-slate-700';
};

const SDGAlignmentDashboard: React.FC<{ projects: Project[] }> = ({ projects }) => {
    const { t, language } = useLocalization(['projects']);
    const [selectedSdg, setSelectedSdg] = useState<number | null>(null);

    const sdgData = MOCK_PROGRAM_DATA.sdgs;

    const projectsBySdg = useMemo(() => {
        const map = new Map<number, Project[]>();
        projects.forEach(p => {
            p.sdgGoals?.forEach(goalId => {
                if (!map.has(goalId)) map.set(goalId, []);
                map.get(goalId)!.push(p);
            });
        });
        return map;
    }, [projects]);

    const stats = useMemo(() => {
        const alignedProjects = projects.filter(p => p.sdgGoals && p.sdgGoals.length > 0);
        const totalBudget = alignedProjects.reduce((sum, p) => sum + p.budget, 0);

        let mostTargetedSdgId = 0;
        let maxCount = 0;
        projectsBySdg.forEach((projs, sdgId) => {
            if (projs.length > maxCount) {
                maxCount = projs.length;
                mostTargetedSdgId = sdgId;
            }
        });

        const alignmentScore = sdgData.length > 0
            ? Math.round((projectsBySdg.size / sdgData.length) * 100)
            : 0;

        return {
            totalAligned: alignedProjects.length,
            totalBudget,
            mostTargeted: mostTargetedSdgId,
            alignmentScore,
        };
    }, [projects, projectsBySdg, sdgData]);

    const budgetChartData = useMemo(() => {
        const data: { id: number; label: string; budget: number; color: string }[] = [];
        const lang = language === 'ar' ? 'ar' : 'en';
        projectsBySdg.forEach((projs, sdgId) => {
            const sdg = sdgData.find(s => s.id === sdgId);
            if (sdg) {
                const totalBudget = projs.reduce((sum, p) => sum + p.budget, 0);
                if (totalBudget > 0) {
                    const shortName = sdgShortNames[sdg.id]?.[lang] || sdg.name;
                    data.push({ id: sdg.id, label: `${sdg.id}. ${shortName}`, budget: totalBudget, color: sdg.color });
                }
            }
        });
        return data.sort((a, b) => b.budget - a.budget);
    }, [projectsBySdg, sdgData, language]);

    const maxBudget = useMemo(() => Math.max(...budgetChartData.map(d => d.budget), 1), [budgetChartData]);

    const filteredProjects = selectedSdg
        ? projectsBySdg.get(selectedSdg) || []
        : projects.filter(p => p.sdgGoals && p.sdgGoals.length > 0);

    const statCards = [
        { label: t('projects.sdgAnalytics.kpi.alignedProjects'), value: stats.totalAligned, icon: Users, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
        { label: t('projects.sdgAnalytics.kpi.totalBudget'), value: formatCurrency(stats.totalBudget, language), icon: DollarSign, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
        { label: t('projects.sdgAnalytics.kpi.mostTargeted'), value: `SDG ${stats.mostTargeted}`, icon: Target, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-900/20' },
        { label: t('projects.sdgAnalytics.kpi.alignmentScore'), value: `${stats.alignmentScore}%`, icon: BarChartIcon, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
    ];

    return (
        <div className="space-y-6">
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

            <div className="bg-card dark:bg-dark-card rounded-xl p-5 shadow-soft border border-gray-200 dark:border-slate-700/50">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-foreground dark:text-dark-foreground">{t('projects.sdgAnalytics.grid.title')}</h3>
                    {selectedSdg && (
                        <button onClick={() => setSelectedSdg(null)} className="text-sm font-medium text-primary hover:underline">
                            {t('projects.sdgAnalytics.grid.clear')}
                        </button>
                    )}
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-9 gap-2.5">
                    {sdgData.map(sdg => {
                        const projectCount = projectsBySdg.get(sdg.id)?.length || 0;
                        const isSelected = selectedSdg === sdg.id;

                        return (
                            <button
                                key={sdg.id}
                                onClick={() => setSelectedSdg(isSelected ? null : sdg.id)}
                                className={`relative rounded-lg overflow-hidden transition-all duration-200 hover:scale-105 hover:shadow-lg ${isSelected ? 'ring-3 ring-offset-2 ring-primary dark:ring-secondary scale-105 shadow-lg' : ''} ${projectCount === 0 ? 'opacity-40 grayscale' : ''}`}
                                title={`SDG ${sdg.id}: ${sdg.name}`}
                            >
                                <img
                                    src={getSdgIconUrl(sdg.id)}
                                    alt={`SDG ${sdg.id}: ${sdg.name}`}
                                    className="w-full aspect-square object-cover"
                                    loading="lazy"
                                />
                                {projectCount > 0 && (
                                    <div
                                        className="absolute bottom-1 end-1 min-w-[18px] h-[18px] px-1 bg-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm ring-1 ring-black/10"
                                        style={{ color: sdg.color }}
                                    >
                                        {projectCount}
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
                <div className="lg:col-span-3 bg-card dark:bg-dark-card p-5 rounded-xl shadow-soft border border-gray-200 dark:border-slate-700/50">
                    <h3 className="font-bold text-foreground dark:text-dark-foreground mb-4">{t('projects.sdgAnalytics.chart.title')}</h3>
                    <div className="space-y-2 max-h-[320px] overflow-y-auto">
                        {budgetChartData.map(entry => (
                            <div key={entry.id} className="group flex items-center gap-3">
                                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 w-32 shrink-0 truncate text-end" title={entry.label}>
                                    {entry.label}
                                </span>
                                <div className="flex-1 bg-gray-100 dark:bg-slate-700/50 rounded h-6 overflow-hidden relative">
                                    <div
                                        className="h-full rounded transition-all duration-500"
                                        style={{ width: `${(entry.budget / maxBudget) * 100}%`, backgroundColor: entry.color }}
                                    />
                                </div>
                                <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 w-24 shrink-0">
                                    {formatCurrency(entry.budget, language)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="lg:col-span-2 bg-card dark:bg-dark-card p-5 rounded-xl shadow-soft border border-gray-200 dark:border-slate-700/50">
                    <h3 className="font-bold text-foreground dark:text-dark-foreground mb-4">
                        {selectedSdg
                            ? t('projects.sdgAnalytics.list.title', { sdg: selectedSdg })
                            : t('projects.sdgAnalytics.list.titleAll')}
                    </h3>
                    <div className="space-y-2.5 max-h-[280px] overflow-y-auto">
                        {filteredProjects.length > 0 ? filteredProjects.map(p => (
                            <div key={p.id} className="p-3 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
                                <p className="font-semibold text-sm text-foreground dark:text-dark-foreground truncate">{p.name[language]}</p>
                                <div className="flex justify-between items-center text-xs text-gray-500 mt-1.5">
                                    <span className="font-medium">{formatCurrency(p.budget, language)}</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-16 bg-gray-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                                            <div className={`h-full rounded-full ${progressColor(p.progress)}`} style={{ width: `${p.progress}%` }}></div>
                                        </div>
                                        <span className="font-semibold">{p.progress}%</span>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-1 mt-2">
                                    {p.sdgGoals?.map(goalId => {
                                        const sdg = sdgData.find(s => s.id === goalId);
                                        return (
                                            <span
                                                key={goalId}
                                                className="inline-flex items-center gap-0.5 text-[10px] font-bold text-white px-1.5 py-0.5 rounded"
                                                style={{ backgroundColor: sdg?.color || '#ccc' }}
                                            >
                                                {goalId}
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>
                        )) : (
                            <p className="text-sm text-center text-gray-400 py-10">{t('projects.sdgAnalytics.list.placeholder')}</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SDGAlignmentDashboard;
