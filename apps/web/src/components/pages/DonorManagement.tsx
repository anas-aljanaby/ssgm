import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLocalization } from '../../hooks/useLocalization';
import { useToast } from '../../hooks/useToast';
import { useDonorIntelligenceData } from '../../hooks/useDonorIntelligenceData';
import {
    DONORS_QUERY_KEY,
    useCreateDonor,
    useDonors,
    useUpdateDonorPipelineStage,
} from '../../hooks/useDonors';
import { individualDonorToKanbanDonor } from '../../lib/individualDonorPipeline';

import type { Donor, DonorPipelineType, DonorStageId, IndividualDonor, Role, SortDirection } from '../../types';
import KanbanBoard, { type DonorKanbanStage, type KanbanDensity } from './donors/KanbanBoard';
import RegistryAddDonorModal from './donors_individual/AddDonorModal';
import DonorsTable from './donors_individual/DonorsTable';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { formatCurrency, formatNumber, getDonorCategoryLabel } from '../../lib/utils';
import Tabs from '../common/Tabs';
import { Users, Filter, List, LayoutDashboard, DollarSign, UserCheck, Clock, Maximize2, Minimize2 } from 'lucide-react';
import { SearchIcon } from '../icons/GenericIcons';
import DonorCard from './donors_individual/DonorCard';
import DonorDetailView, { DonorProfileRoute } from './donors_individual/DonorDetailView';
import { MicrophoneIcon } from '../icons/AiIcons';
import AdvancedFilterPanel, { type DonorFilters } from './donors_individual/AdvancedFilterPanel';

interface SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onstart: () => void;
  onend: () => void;
  onerror: (event: any) => void;
  onresult: (event: any) => void;
}
declare global {
    interface Window {
        SpeechRecognition: { new(): SpeechRecognition; };
        webkitSpeechRecognition: { new(): SpeechRecognition; };
    }
}

const DEFAULT_DONOR_FILTERS: DonorFilters = {
    status: 'all',
    tier: 'all',
    country: 'all',
    tag: 'all',
    owner: 'all',
    stage: 'all',
    donorType: 'all',
    taskState: 'all',
};

const CategoryCard: React.FC<{ category: string; count: number }> = ({ category, count }) => {
    const { t } = useLocalization();
    return (
        <div className="rounded-xl border dark:border-slate-700 bg-card dark:bg-dark-card p-4">
            <p className="text-sm text-gray-500">{getDonorCategoryLabel(category, t)}</p>
            <p className="text-2xl font-bold mt-1">{count}</p>
        </div>
    );
};

const RegistryMetricCard: React.FC<{ title: string; value: string; icon: React.ReactNode; }> = ({ title, value, icon }) => (
    <div className="bg-card dark:bg-dark-card p-4 rounded-xl shadow-soft border dark:border-slate-700/50 flex items-center gap-4">
        <div className="p-3 rounded-lg bg-primary-light dark:bg-primary/20 text-primary dark:text-secondary">
            {icon}
        </div>
        <div>
            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-foreground dark:text-dark-foreground">{value}</p>
        </div>
    </div>
);

const RegistryTab: React.FC<{
    deepLinkTarget?: { id?: string; tab?: string } | null;
}> = ({ deepLinkTarget }) => {
    const { t, language, dir } = useLocalization(['common', 'donors', 'individual_donors', 'misc']);
    const toast = useToast();
    const queryClient = useQueryClient();
    const { data: donors = [], isLoading, isError, refetch } = useDonors();
    const createDonorMutation = useCreateDonor();
    const updatePipelineMutation = useUpdateDonorPipelineStage();

    const [searchTerm, setSearchTerm] = useState('');
    const [sortColumn, setSortColumn] = useState<keyof IndividualDonor | null>('lastDonationDate');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const [view, setView] = useState<'list' | 'card' | 'kanban'>('list');
    const [selectedDonor, setSelectedDonor] = useState<IndividualDonor | null>(null);
    const [selectedDonorId, setSelectedDonorId] = useState<string | null>(null);
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [filters, setFilters] = useState<DonorFilters>(DEFAULT_DONOR_FILTERS);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [kanbanDensity, setKanbanDensity] = useState<KanbanDensity>('compact');
    const [pipelineOwnerFilter, setPipelineOwnerFilter] = useState('all');

    const [isListening, setIsListening] = useState(false);
    const [micError, setMicError] = useState<string | null>(null);
    const recognitionRef = useRef<SpeechRecognition | null>(null);

    const handleDonorSelect = useCallback((donor: IndividualDonor) => {
        setSelectedDonor(donor);
        setSelectedDonorId(donor.id);
        window.location.hash = `donors/${donor.id}`;
    }, []);

    const handleDonorBack = useCallback(() => {
        setSelectedDonor(null);
        setSelectedDonorId(null);
        window.location.hash = 'donors';
    }, []);

    const handleDonorUpdated = useCallback((updatedDonor: IndividualDonor) => {
        queryClient.setQueryData(DONORS_QUERY_KEY, (current: IndividualDonor[] | undefined) =>
            (current || []).map((donor) => donor.id === updatedDonor.id ? { ...donor, ...updatedDonor } : donor),
        );
        setSelectedDonor(updatedDonor);
        setSelectedDonorId(updatedDonor.id);
    }, [queryClient]);

    useEffect(() => {
        if (deepLinkTarget?.id && donors.length > 0) {
            const donor = donors.find((d) => d.id === deepLinkTarget.id);
            setSelectedDonor(donor || null);
            setSelectedDonorId(deepLinkTarget.id);
        } else if (!deepLinkTarget?.id) {
            setSelectedDonor(null);
            setSelectedDonorId(null);
        }
    }, [deepLinkTarget, donors]);

    useEffect(() => {
        const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognitionAPI) {
            setMicError(t('donorManagement.voice.notSupported'));
            return;
        }

        const recognition = new SpeechRecognitionAPI();
        recognition.continuous = false;
        recognition.interimResults = true;

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = (event) => {
            if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                const errorMsg = t('donorManagement.voice.permissionDenied');
                setMicError(errorMsg);
                toast.showError(errorMsg);
            }
            setIsListening(false);
        };
        recognition.onresult = (event) => {
            const transcript = Array.from(event.results)
                .map((result) => result[0])
                .map((result) => result.transcript)
                .join('');
            setSearchTerm(transcript);
        };

        recognitionRef.current = recognition;
    }, [toast, t]);

    const handleListen = useCallback(() => {
        if (!recognitionRef.current) return;
        if (isListening) {
            recognitionRef.current.stop();
            return;
        }
        setMicError(null);
        const langCode = { en: 'en-US', ar: 'ar-SA' }[language];
        recognitionRef.current.lang = langCode;
        try {
            recognitionRef.current.start();
        } catch (e) {
            console.error('Speech recognition start error:', e);
            const errorMsg = t('donorManagement.voice.startError');
            setMicError(errorMsg);
            toast.showError(errorMsg);
        }
    }, [isListening, language, t, toast]);

    const filteredAndSortedDonors = useMemo(() => {
        const searchLower = searchTerm.trim().toLowerCase();
        let filtered = donors.filter((donor) => {
            const openTasks = donor.relationshipTasks?.filter((task) => !task.completed) || [];
            const today = new Date().toISOString().split('T')[0];
            const hasOverdueTask = openTasks.some((task) => task.dueDate < today);
            const hasNoOpenTasks = openTasks.length === 0;
            const searchableText = [
                donor.fullName[language],
                donor.fullName.en,
                donor.fullName.ar,
                donor.email,
                donor.phone,
                donor.country,
                donor.city,
                donor.status,
                donor.tier,
                donor.assignedManager,
                donor.donorType,
                donor.relationshipStage,
                donor.relationshipHealth,
                donor.relationshipLikelihood,
                ...(donor.tags || []),
            ].filter(Boolean).join(' ').toLowerCase();

            const matchesSearch = !searchLower || searchableText.includes(searchLower);
            const matchesStatus = filters.status === 'all' || donor.status === filters.status;
            const matchesTier = filters.tier === 'all' || donor.tier === filters.tier;
            const matchesCountry = filters.country === 'all' || donor.country === filters.country;
            const matchesTag = filters.tag === 'all' || donor.tags.includes(filters.tag);
            const matchesOwner = filters.owner === 'all' || donor.assignedManager === filters.owner;
            const matchesStage = filters.stage === 'all' || donor.relationshipStage === filters.stage;
            const matchesDonorType = filters.donorType === 'all' || donor.donorType === filters.donorType;
            const matchesTaskState =
                filters.taskState === 'all' ||
                (filters.taskState === 'overdue' && hasOverdueTask) ||
                (filters.taskState === 'noOpenTasks' && hasNoOpenTasks);

            return matchesSearch && matchesStatus && matchesTier && matchesCountry && matchesTag && matchesOwner && matchesStage && matchesDonorType && matchesTaskState;
        });

        if (sortColumn) {
            filtered.sort((a, b) => {
                const aVal = a[sortColumn];
                const bVal = b[sortColumn];

                if (typeof aVal === 'number' && typeof bVal === 'number') {
                    return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
                }

                if (typeof aVal === 'string' && typeof bVal === 'string') {
                    if (sortColumn === 'lastDonationDate' || sortColumn === 'donorSince') {
                        if (!aVal) return 1;
                        if (!bVal) return -1;
                        return sortDirection === 'asc'
                            ? new Date(aVal).getTime() - new Date(bVal).getTime()
                            : new Date(bVal).getTime() - new Date(aVal).getTime();
                    }
                    return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
                }

                if (sortColumn === 'fullName') {
                    const aName = a.fullName[language] || a.fullName.en;
                    const bName = b.fullName[language] || b.fullName.en;
                    return sortDirection === 'asc' ? aName.localeCompare(bName) : bName.localeCompare(aName);
                }

                return 0;
            });
        }

        return filtered;
    }, [donors, filters, searchTerm, sortColumn, sortDirection, language]);

    const filteredPipelineDonors = useMemo(() => {
        const searchLower = searchTerm.toLowerCase();
        return filteredAndSortedDonors
            .map(individualDonorToKanbanDonor)
            .filter((donor) => {
                const matchesOwner = pipelineOwnerFilter === 'all' || (donor.assignedOwner || 'Unassigned') === pipelineOwnerFilter;
                const matchesSearch =
                    donor.name.toLowerCase().includes(searchLower) ||
                    donor.email.toLowerCase().includes(searchLower) ||
                    donor.country.toLowerCase().includes(searchLower);
                return matchesSearch && matchesOwner;
            });
    }, [filteredAndSortedDonors, pipelineOwnerFilter, searchTerm]);

    const stageByEmail = useMemo(
        () => new Map(filteredAndSortedDonors.map((donor) => [donor.email.toLowerCase(), donor.relationshipStage || 'prospect'])),
        [filteredAndSortedDonors],
    );

    const registryStats = useMemo(() => {
        const totalDonations = donors.reduce((sum, donor) => sum + donor.totalDonations, 0);
        const activeDonors = donors.filter((donor) => donor.status === 'Active').length;
        const avgGift = donors.length > 0
            ? donors.reduce((sum, donor) => sum + (donor.avgGift || 0), 0) / donors.length
            : 0;
        return { totalDonations, activeDonors, avgGift };
    }, [donors]);

    const filterOptions = useMemo(() => {
        const countries = Array.from(new Set(donors.map((donor) => donor.country).filter(Boolean))).sort();
        const tags = Array.from(new Set(donors.flatMap((donor) => donor.tags))).sort();
        const owners = Array.from(new Set(donors.map((donor) => donor.assignedManager).filter(Boolean))).sort();
        const donorTypes = Array.from(new Set(donors.map((donor) => donor.donorType).filter(Boolean))) as DonorPipelineType[];
        return { countries, tags, owners, donorTypes };
    }, [donors]);

    const hasActiveFilters = useMemo(() => (
        filters.status !== 'all' ||
        filters.tier !== 'all' ||
        filters.country !== 'all' ||
        filters.tag !== 'all' ||
        filters.owner !== 'all' ||
        filters.stage !== 'all' ||
        filters.donorType !== 'all' ||
        filters.taskState !== 'all'
    ), [filters]);

    const clearFilters = useCallback(() => {
        setFilters(DEFAULT_DONOR_FILTERS);
    }, []);

    const stages: DonorKanbanStage[] = [
        { id: 'prospect', titleKey: 'donors.stages.prospect', color: 'bg-slate-100 dark:bg-slate-800/50', border: 'border-slate-400', railColor: '#f59e0b' },
        { id: 'researching', titleKey: 'donors.stages.researching', color: 'bg-cyan-50 dark:bg-cyan-950/30', border: 'border-cyan-500', railColor: '#14b8a6' },
        { id: 'contacted', titleKey: 'donors.stages.contacted', color: 'bg-blue-50 dark:bg-blue-950/30', border: 'border-blue-500', railColor: '#3b82f6' },
        { id: 'cultivating', titleKey: 'donors.stages.cultivating', color: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-500', railColor: '#f59e0b' },
        { id: 'solicited', titleKey: 'donors.stages.solicited', color: 'bg-violet-50 dark:bg-violet-950/30', border: 'border-violet-500', railColor: '#8b5cf6' },
        { id: 'pledged', titleKey: 'donors.stages.pledged', color: 'bg-teal-50 dark:bg-teal-950/30', border: 'border-teal-500', railColor: '#06b6d4' },
        { id: 'donated', titleKey: 'donors.stages.donated', color: 'bg-green-50 dark:bg-green-950/30', border: 'border-green-500', railColor: '#22c55e' },
        { id: 'dormant', titleKey: 'donors.stages.dormant', color: 'bg-rose-50 dark:bg-rose-950/30', border: 'border-rose-500', railColor: '#ef4444' },
    ];

    const pipelineOwners = useMemo(
        () => Array.from(new Set(donors.map((donor) => donor.assignedManager || 'Unassigned'))).sort(),
        [donors],
    );

    const pipelineStats = useMemo(() => ({
        pipelineValue: filteredPipelineDonors.reduce((sum, donor) => sum + donor.potentialGift, 0),
    }), [filteredPipelineDonors]);

    const handleDragEnd = useCallback(async (donorId: string, targetStageId: DonorStageId) => {
        const donor = donors.find((d) => d.id === donorId);
        if (!donor) return;

        try {
            await updatePipelineMutation.mutateAsync({
                donorId,
                pipelineStage: targetStageId,
                currentStage: donor.relationshipStage,
            });
            if (selectedDonor?.id === donorId) {
                setSelectedDonor((current) => current ? { ...current, relationshipStage: targetStageId, stageEnteredAt: new Date().toISOString() } : current);
            }
        } catch (error) {
            toast.showError(error instanceof Error ? error.message : t('individual_donors.detailView.pipelineAskSaveFailed'));
        }
    }, [donors, selectedDonor?.id, t, toast, updatePipelineMutation]);

    const handleAddDonor = async (newDonorData: Omit<IndividualDonor, 'id' | 'totalDonations' | 'lastDonationDate' | 'status' | 'tier' | 'tags' | 'assignedManager' | 'avatar' | 'donorSince'>) => {
        try {
            const created = await createDonorMutation.mutateAsync({
                fullName: newDonorData.fullName,
                email: newDonorData.email,
                phone: newDonorData.phone,
                country: newDonorData.country,
            });
            toast.showSuccess(t('individual_donors.modal.saveDonor'));
            handleDonorSelect(created);
        } catch (error) {
            toast.showError(error instanceof Error ? error.message : t('individual_donors.detailView.headerSaveFailed'));
        }
    };

    const handleSort = useCallback((column: keyof IndividualDonor) => {
        if (sortColumn === column) {
            setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortColumn(column);
            setSortDirection('asc');
        }
    }, [sortColumn]);

    const getButtonClass = (buttonView: 'list' | 'card') => (
        view === buttonView
            ? 'p-2 bg-primary text-white rounded-md'
            : 'p-2 text-gray-500 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-md'
    );

    if (selectedDonor) {
        return <DonorDetailView donor={selectedDonor} onBack={handleDonorBack} onDonorUpdated={handleDonorUpdated} />;
    }

    if (selectedDonorId) {
        return <DonorProfileRoute donorId={selectedDonorId} onBack={handleDonorBack} onDonorUpdated={handleDonorUpdated} />;
    }

    return (
        <>
            <RegistryAddDonorModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onAdd={handleAddDonor}
            />
            <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    <RegistryMetricCard title={t('donors.registry.metrics.totalDonors')} value={formatNumber(donors.length, language)} icon={<Users size={20} />} />
                    <RegistryMetricCard title={t('donors.registry.metrics.activeDonors')} value={formatNumber(registryStats.activeDonors, language)} icon={<UserCheck size={20} />} />
                    <RegistryMetricCard title={t('donors.registry.metrics.totalDonated')} value={formatCurrency(registryStats.totalDonations, language)} icon={<DollarSign size={20} />} />
                    <RegistryMetricCard title={t('donors.registry.metrics.averageGift')} value={formatCurrency(registryStats.avgGift, language)} icon={<Clock size={20} />} />
                </div>

                {isError && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800/60 dark:bg-red-900/20 dark:text-red-200">
                        {t('individual_donors.registry.loadFailed', 'Unable to load donors.')}
                        <button type="button" onClick={() => void refetch()} className="ml-2 font-semibold underline">
                            {t('common.retry', 'Retry')}
                        </button>
                    </div>
                )}

                <div className="p-4 bg-card dark:bg-dark-card rounded-xl shadow-soft border dark:border-slate-700/50">
                    <div className="flex flex-col gap-3">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-start gap-3">
                            <button
                                onClick={() => setIsSearchOpen((prev) => !prev)}
                                className={`flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium border rounded-lg transition-colors ${
                                    isSearchOpen || searchTerm
                                        ? 'border-primary bg-primary-light text-primary dark:bg-primary/20 dark:text-secondary'
                                        : 'border-gray-300 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-700'
                                }`}
                                aria-expanded={isSearchOpen}
                            >
                                <SearchIcon className="w-5 h-5" />
                                {t('common.search', language === 'ar' ? 'بحث' : 'Search')}
                                {searchTerm && <span className="h-2 w-2 rounded-full bg-primary dark:bg-secondary" aria-hidden="true" />}
                            </button>
                            <button
                                onClick={() => setFiltersOpen((prev) => !prev)}
                                className={`flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium border rounded-lg transition-colors ${
                                    filtersOpen || hasActiveFilters
                                        ? 'border-primary bg-primary-light text-primary dark:bg-primary/20 dark:text-secondary'
                                        : 'border-gray-300 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-700'
                                }`}
                                aria-expanded={filtersOpen}
                            >
                                <Filter size={16} />
                                {t('individual_donors.filters')}
                                {hasActiveFilters && <span className="h-2 w-2 rounded-full bg-primary dark:bg-secondary" aria-hidden="true" />}
                            </button>
                            <div className="p-1 bg-gray-100 dark:bg-slate-900 rounded-lg flex items-center justify-center">
                                <button onClick={() => setView('list')} className={getButtonClass('list')} aria-label={t('individual_donors.listView')} title={t('individual_donors.listView')}><List size={20}/></button>
                                <button onClick={() => setView('card')} className={getButtonClass('card')} aria-label={t('individual_donors.iconView')} title={t('individual_donors.iconView')}><Users size={20} /></button>
                            </div>
                            <button
                                type="button"
                                onClick={() => setView(view === 'kanban' ? 'list' : 'kanban')}
                                aria-pressed={view === 'kanban'}
                                className={`inline-flex items-center justify-center gap-2 rounded-lg border px-3.5 py-2.5 text-sm font-semibold transition-colors ${
                                    view === 'kanban'
                                        ? 'border-primary bg-primary text-white shadow-sm'
                                        : 'border-gray-300 bg-white text-gray-700 hover:border-primary/50 hover:bg-primary-light/80 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-200 dark:hover:bg-slate-700'
                                }`}
                            >
                                <LayoutDashboard size={17} />
                                <span>{t('donors.kanban.pipelineBoard')}</span>
                                <span className={`rounded-full px-1.5 py-0.5 text-[11px] font-bold ${
                                    view === 'kanban'
                                        ? 'bg-white/20 text-white'
                                        : 'bg-gray-100 text-gray-600 dark:bg-slate-900 dark:text-gray-300'
                                }`}>
                                    {formatNumber(filteredPipelineDonors.length, language)}
                                </span>
                            </button>
                            <button
                                onClick={() => setIsAddModalOpen(true)}
                                disabled={createDonorMutation.isPending}
                                className="px-4 py-2 text-sm font-medium text-white bg-secondary hover:bg-secondary-dark rounded-lg transition-colors disabled:opacity-60"
                            >
                                {t('individual_donors.addDonor')}
                            </button>
                        </div>
                        {view === 'kanban' && (
                            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_auto] gap-3 rounded-lg border border-gray-200 bg-gray-50/80 p-3 dark:border-slate-700 dark:bg-slate-900/40">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <label className="text-sm">
                                        <span className="mb-1 block font-semibold text-gray-600 dark:text-gray-300">{t('donors.kanban.owner')}</span>
                                        <select
                                            value={pipelineOwnerFilter}
                                            onChange={(e) => setPipelineOwnerFilter(e.target.value)}
                                            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                                        >
                                            <option value="all">{t('donors.kanban.allOwners')}</option>
                                            {pipelineOwners.map((owner) => (
                                                <option key={owner} value={owner}>{owner}</option>
                                            ))}
                                        </select>
                                    </label>
                                    <div className="rounded-md border border-gray-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-800">
                                        <span className="block text-xs font-semibold text-gray-500 dark:text-gray-400">{t('donors.kanban.filteredValue')}</span>
                                        <span className="text-sm font-bold text-foreground dark:text-dark-foreground">{formatCurrency(pipelineStats.pipelineValue, language)}</span>
                                    </div>
                                </div>
                                <div className="flex items-end justify-start text-sm lg:justify-end">
                                    <div className="flex items-center rounded-md border border-gray-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-800" aria-label={t('donors.kanban.density.label')}>
                                        <button
                                            type="button"
                                            onClick={() => setKanbanDensity('compact')}
                                            aria-pressed={kanbanDensity === 'compact'}
                                            title={t('donors.kanban.density.compact')}
                                            className={`flex items-center gap-1 rounded px-2 py-1.5 font-semibold transition-colors ${kanbanDensity === 'compact' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700'}`}
                                        >
                                            <Minimize2 size={14} />
                                            {t('donors.kanban.density.compact')}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setKanbanDensity('comfortable')}
                                            aria-pressed={kanbanDensity === 'comfortable'}
                                            title={t('donors.kanban.density.comfortable')}
                                            className={`flex items-center gap-1 rounded px-2 py-1.5 font-semibold transition-colors ${kanbanDensity === 'comfortable' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700'}`}
                                        >
                                            <Maximize2 size={14} />
                                            {t('donors.kanban.density.comfortable')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                        {isSearchOpen && (
                            <div className="relative">
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder={isListening ? t('common.listening') : t('donors.registry.searchPlaceholder')}
                                    className={`w-full p-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary ${dir === 'ltr' ? 'pl-12 pr-12' : 'pr-12 pl-12'}`}
                                    autoFocus
                                />
                                <div className={`absolute inset-y-0 flex items-center pointer-events-none ${dir === 'ltr' ? 'left-3' : 'right-3'}`}>
                                    <SearchIcon className="w-5 h-5 text-gray-400" />
                                </div>
                                <div className={`absolute inset-y-0 flex items-center ${dir === 'ltr' ? 'right-3' : 'left-3'}`}>
                                    <button
                                        onClick={handleListen}
                                        disabled={!!micError}
                                        title={micError || t('common.voiceSearch')}
                                        className={`p-2 rounded-full transition-colors disabled:text-gray-400 disabled:cursor-not-allowed ${
                                            isListening
                                                ? 'text-red-500 bg-red-100 dark:bg-red-900/50 animate-pulse'
                                                : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-slate-700'
                                        }`}
                                    >
                                        <MicrophoneIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <AdvancedFilterPanel
                    isOpen={filtersOpen}
                    filters={filters}
                    countries={filterOptions.countries}
                    tags={filterOptions.tags}
                    owners={filterOptions.owners}
                    donorTypes={filterOptions.donorTypes}
                    stages={stages.map((stage) => stage.id)}
                    onApply={setFilters}
                    onClear={clearFilters}
                />

                {isLoading ? (
                    <div className="rounded-xl border border-gray-200 bg-card p-8 text-center text-sm text-gray-500 dark:border-slate-700 dark:bg-dark-card">
                        {t('common.loading')}
                    </div>
                ) : (
                    <>
                        {view === 'list' && (
                            <DonorsTable
                                donors={filteredAndSortedDonors}
                                onDonorSelect={handleDonorSelect}
                                sortColumn={sortColumn}
                                sortDirection={sortDirection}
                                onSort={handleSort}
                                stageByEmail={stageByEmail}
                            />
                        )}
                        {view === 'card' && (
                            <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,23rem),1fr))] items-start gap-5">
                                {filteredAndSortedDonors.map((donor) => (
                                    <DonorCard key={donor.id} donor={donor} onClick={() => handleDonorSelect(donor)} />
                                ))}
                            </div>
                        )}
                        {view === 'kanban' && (
                            <KanbanBoard
                                donors={filteredPipelineDonors}
                                stages={stages}
                                density={kanbanDensity}
                                onDragEnd={handleDragEnd}
                            />
                        )}
                        {!isLoading && filteredAndSortedDonors.length === 0 && !isError && (
                            <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500 dark:border-slate-600">
                                {t('individual_donors.registry.empty', 'No donors match your filters yet.')}
                            </div>
                        )}
                    </>
                )}
            </div>
        </>
    );
};

const AnalyticsTab: React.FC<{ role: Role }> = () => {
    const { t } = useLocalization();
    const { donors, isLoading } = useDonorIntelligenceData();

    const CATEGORY_COLORS: Record<string, string> = {
        'Hero Donor': '#FFD700',
        'Recurring Donor': '#10B981',
        'Seasonal Donor': '#3B82F6',
        'Event Donor': '#F59E0B',
        'Dormant Donor': '#6B7280',
        'General Donor': '#9CA3AF',
        'New Donor': '#A1A1AA',
    };
    const categoryCounts = useMemo(
        () => donors.reduce((acc, donor) => {
            if (donor.donorCategory) {
                acc[donor.donorCategory] = (acc[donor.donorCategory] || 0) + 1;
            }
            return acc;
        }, {} as Record<string, number>),
        [donors],
    );
    const pieChartData = useMemo(
        () => Object.entries(categoryCounts).map(([name, value]) => ({ name: getDonorCategoryLabel(name, t), value })),
        [categoryCounts, t],
    );

    if (isLoading) {
        return (
            <div className="rounded-xl border border-gray-200 bg-card p-8 text-center text-sm text-gray-500 dark:border-slate-700 dark:bg-dark-card">
                {t('common.loading')}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
                <div className="xl:col-span-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {Object.keys(CATEGORY_COLORS).map((category) => (
                            <CategoryCard key={category} category={category} count={categoryCounts[category] || 0} />
                        ))}
                    </div>
                </div>
                <div className="xl:col-span-2 bg-card dark:bg-dark-card rounded-2xl shadow-soft p-4 border dark:border-slate-700/50">
                    <h3 className="text-lg font-bold mb-2 text-center">{t('donorIntelligence.distributionChart')}</h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie data={pieChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                                    {pieChartData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={CATEGORY_COLORS[Object.keys(CATEGORY_COLORS).find((key) => getDonorCategoryLabel(key, t) === entry.name) || '']}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

const DonorHub: React.FC<{ role: Role; deepLinkTarget?: { id?: string; tab?: string } | null }> = ({ role, deepLinkTarget }) => {
    const { t } = useLocalization(['common', 'donors', 'individual_donors', 'misc']);
    const [activeTab, setActiveTab] = useState('registry');

    const tabs = [
        { id: 'registry', label: t('donors.tabs.registry') },
        { id: 'analytics', label: t('donors.tabs.analytics') },
    ];

    return (
        <div className="flex flex-col h-full animate-fade-in">
            <h1 className="text-3xl font-bold text-foreground dark:text-dark-foreground mb-4">
                {t('donors.hubTitle')}
            </h1>

            <Tabs tabs={tabs} activeTab={activeTab} onTabClick={setActiveTab} />

            <div className="mt-6 flex-grow">
                {activeTab === 'registry' && <RegistryTab deepLinkTarget={deepLinkTarget} />}
                {activeTab === 'analytics' && <AnalyticsTab role={role} />}
            </div>
        </div>
    );
};

export default DonorHub;
