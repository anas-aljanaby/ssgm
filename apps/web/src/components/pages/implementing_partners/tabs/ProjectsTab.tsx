import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Calendar, ChevronDown, DollarSign, MapPin, Tag, UsersRound } from 'lucide-react';
import { useLocalization } from '../../../../hooks/useLocalization';
import { formatCurrency } from '../../../../lib/utils';
import { MOCK_PARTNER_PROJECTS, type PartnerProject } from '../partnerStaticData';
import { MOCK_PROJECTS } from '../../../../data/projectData';
import ModalPortal from '../../../common/ModalPortal';
import { X } from 'lucide-react';
import { useToast } from '../../../../hooks/useToast';

const STATUS_STYLES: Record<string, { badge: string; bar: string }> = {
    'مكتمل': { badge: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300', bar: 'bg-green-500' },
    'جاري التنفيذ': { badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300', bar: 'bg-blue-500' },
    'متوقف': { badge: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300', bar: 'bg-orange-500' },
};

const SECTOR_BORDER: Record<string, string> = {
    'التعليم': 'border-blue-500',
    'الصحة': 'border-red-500',
    'التنمية': 'border-purple-500',
};

const ProjectCard: React.FC<{ project: PartnerProject }> = ({ project }) => {
    const { t, language } = useLocalization(['partners']);
    const style = STATUS_STYLES[project.status] ?? STATUS_STYLES['جاري التنفيذ'];

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className={`bg-gray-50 dark:bg-slate-700/50 p-4 rounded-xl border-r-4 ${SECTOR_BORDER[project.sector] ?? 'border-gray-500'}`}
        >
            <div className="flex justify-between items-start">
                <h4 className="font-bold text-lg mb-2">{project.name}</h4>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${style.badge}`}>{project.status}</span>
            </div>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <p className="flex items-center gap-2"><Tag size={14} /> {project.sector}</p>
                <p className="flex items-center gap-2"><Calendar size={14} /> {project.duration}</p>
                <p className="flex items-center gap-2"><DollarSign size={14} /> {formatCurrency(project.budget, language)}</p>
                <p className="flex items-center gap-2"><UsersRound size={14} /> {project.beneficiaries} {t('partners.projects.beneficiaries')}</p>
                <p className="flex items-center gap-2"><MapPin size={14} /> {project.location}</p>
            </div>
            <div className="mt-4">
                <div className="flex justify-between text-xs font-semibold mb-1">
                    <span>{t('partners.projects.progress')}</span>
                    <span>{project.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-slate-600 rounded-full h-2">
                    <div className={`${style.bar} h-2 rounded-full`} style={{ width: `${project.progress}%` }} />
                </div>
            </div>
            <button type="button" className="mt-4 w-full py-2 text-sm border border-gray-300 dark:border-slate-600 font-semibold rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
                {t('partners.projects.viewDetails')}
            </button>
        </motion.div>
    );
};

const ProjectsTab: React.FC = () => {
    const { t, language } = useLocalization(['partners', 'projects']);
    const toast = useToast();
    const [projects, setProjects] = useState(MOCK_PARTNER_PROJECTS);
    const [statusFilter, setStatusFilter] = useState('الكل');
    const [sortBy, setSortBy] = useState('الأحدث');
    const [linkOpen, setLinkOpen] = useState(false);
    const [selectedProjectId, setSelectedProjectId] = useState('');

    const filtered = useMemo(() => {
        let list = statusFilter === 'الكل' ? projects : projects.filter((p) => p.status === statusFilter);
        return [...list].sort((a, b) => {
            if (sortBy === 'حسب الميزانية') return b.budget - a.budget;
            return 0;
        });
    }, [projects, statusFilter, sortBy]);

    const availableProjects = useMemo(
        () => MOCK_PROJECTS.filter((p) => !projects.some((linked) => linked.name === p.name.ar)),
        [projects],
    );

    const handleLink = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProjectId) return;
        const project = MOCK_PROJECTS.find((p) => p.id === selectedProjectId);
        if (!project) return;
        const linked: PartnerProject = {
            status: 'جاري التنفيذ',
            name: project.name.ar,
            sector: t(`projects.types.${project.type}`, project.type),
            duration: `${project.plannedStartDate} - ${project.plannedEndDate}`,
            budget: project.budget,
            beneficiaries: parseInt(project.stakeholders.targetBeneficiaries.replace(/\D/g, ''), 10) || 0,
            location: project.location.city,
            progress: project.progress,
        };
        setProjects((prev) => [linked, ...prev]);
        toast.showSuccess(t('partners.projects.linkSuccess', { name: linked.name }));
        setLinkOpen(false);
        setSelectedProjectId('');
    };

    const statusFilters = ['الكل', 'جاري التنفيذ', 'مكتمل', 'متوقف'];

    return (
        <>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                    <div className="flex flex-wrap items-center gap-2">
                        {statusFilters.map((status) => (
                            <button
                                key={status}
                                type="button"
                                onClick={() => setStatusFilter(status)}
                                className={`px-3 py-1 text-sm font-semibold rounded-full ${statusFilter === status ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-600 hover:bg-gray-200'}`}
                            >
                                {status === 'الكل' ? t('partners.projects.filterAll') : status}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="appearance-none p-2 pr-8 text-sm border rounded-lg bg-white dark:bg-slate-600 dark:border-slate-500"
                            >
                                <option value="الأحدث">{t('partners.projects.sortNewest')}</option>
                                <option value="الأقدم">{t('partners.projects.sortOldest')}</option>
                                <option value="حسب الميزانية">{t('partners.projects.sortBudget')}</option>
                            </select>
                            <ChevronDown size={16} className="absolute top-1/2 -translate-y-1/2 left-2 pointer-events-none" />
                        </div>
                        <button type="button" onClick={() => setLinkOpen(true)} className="text-sm font-semibold text-blue-600 hover:underline">
                            {t('partners.projects.linkProject')}
                        </button>
                    </div>
                </div>
                <AnimatePresence>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filtered.map((project) => (
                            <ProjectCard key={project.name} project={project} />
                        ))}
                    </div>
                </AnimatePresence>
            </div>

            {linkOpen && (
                <ModalPortal>
                    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in" onClick={() => setLinkOpen(false)}>
                        <div className="bg-card dark:bg-dark-card rounded-2xl shadow-xl w-full max-w-lg m-4" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between p-4 border-b dark:border-slate-700">
                                <h2 className="text-xl font-bold">{t('partners.projects.linkModalTitle')}</h2>
                                <button type="button" onClick={() => setLinkOpen(false)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700">
                                    <X />
                                </button>
                            </div>
                            <form onSubmit={handleLink}>
                                <div className="p-6">
                                    <label htmlFor="project-select" className="block text-sm font-medium mb-2">{t('partners.projects.selectProject')}</label>
                                    <select
                                        id="project-select"
                                        value={selectedProjectId}
                                        onChange={(e) => setSelectedProjectId(e.target.value)}
                                        className="w-full p-2 border rounded-md bg-white dark:bg-slate-800 dark:border-slate-600"
                                    >
                                        <option value="" disabled>{t('partners.projects.selectPlaceholder')}</option>
                                        {availableProjects.map((p) => (
                                            <option key={p.id} value={p.id}>{language === 'ar' ? p.name.ar : p.name.en}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="px-6 py-4 bg-gray-50 dark:bg-dark-card/50 rounded-b-xl flex justify-end gap-3">
                                    <button type="button" onClick={() => setLinkOpen(false)} className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-slate-700 text-sm font-semibold">{t('common.cancel')}</button>
                                    <button type="submit" className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold">{t('partners.projects.linkSubmit')}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </ModalPortal>
            )}
        </>
    );
};

export default ProjectsTab;
