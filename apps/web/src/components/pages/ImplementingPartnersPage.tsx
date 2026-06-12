import React, { useMemo, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { AlertCircle, LayoutGrid, List, Search, Users } from 'lucide-react';
import type { Partner, PartnerSector, PartnerStatus } from '../../types';
import { useLocalization } from '../../hooks/useLocalization';
import {
    type PartnerCreateInput,
    useCreatePartner,
    useDeletePartner,
    usePartners,
    useUpdatePartner,
} from '../../hooks/usePartners';
import { useToast } from '../../hooks/useToast';
import { formatNumber } from '../../lib/utils';
import EmptyState from '../common/EmptyState';
import PartnerAnalytics from './implementing_partners/PartnerAnalytics';
import PartnerCard from './implementing_partners/PartnerCard';
import PartnerCardSkeleton from './implementing_partners/PartnerCardSkeleton';
import PartnerDetailView from './implementing_partners/PartnerDetailView';
import AddPartnerWizard from './implementing_partners/AddPartnerWizard';

type ViewMode = 'list' | 'profile' | 'add';

interface PartnerFilters {
    sector: string;
    status: string;
    country: string;
    performance: string;
}

const SECTORS: PartnerSector[] = ['التعليم', 'الصحة', 'الإغاثة', 'التنمية', 'البيئة'];
const STATUSES: PartnerStatus[] = ['نشط', 'غير نشط', 'قيد المراجعة'];
const FILTER_ALL = 'الكل';
const PAGE_SIZE = 12;

function exportPartnersCsv(partners: Partner[]) {
    const headers = ['Name', 'Country', 'Sector', 'Status', 'Rating', 'Budget', 'Email'];
    const rows = partners.map((partner) => [
        partner.name,
        partner.country,
        partner.sector,
        partner.status,
        partner.rating.toFixed(1),
        partner.budget.toString(),
        partner.email ?? '',
    ]);
    const csv = [headers, ...rows]
        .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `implementing-partners-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
}

const PERFORMANCE_FILTER_VALUES = {
    high: '4.5+',
    good: '4.0+',
    fair: '3.0+',
} as const;

const FilterSelect: React.FC<{
    label: string;
    options: { value: string; label: string }[];
    value: string;
    onChange: (value: string) => void;
}> = ({ label, options, value, onChange }) => {
    const { t } = useLocalization(['partners']);

    return (
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="p-2 border rounded-lg text-sm bg-gray-50 dark:bg-slate-800 dark:border-slate-600"
        >
            <option value={FILTER_ALL}>{label}: {t('partners.filters.all')}</option>
            {options.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
        </select>
    );
};

const ImplementingPartnersPage: React.FC = () => {
    const { t, language } = useLocalization(['partners', 'common']);
    const toast = useToast();
    const { data: partners = [], isLoading, isError, refetch } = usePartners(language);
    const createPartnerMutation = useCreatePartner(language);
    const updatePartnerMutation = useUpdatePartner(language);
    const deletePartnerMutation = useDeletePartner();

    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const [layout, setLayout] = useState<'grid' | 'list'>('grid');
    const [search, setSearch] = useState('');
    const [filters, setFilters] = useState<PartnerFilters>({
        sector: FILTER_ALL,
        status: FILTER_ALL,
        country: FILTER_ALL,
        performance: FILTER_ALL,
    });
    const [page, setPage] = useState(1);
    const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);

    const selectedPartner = useMemo(
        () => partners.find((partner) => partner.id === selectedPartnerId) ?? null,
        [partners, selectedPartnerId],
    );

    const countryOptions = useMemo(() => {
        const countries = [...new Set(partners.map((p) => p.country))].sort();
        return countries.map((c) => ({ value: c, label: c }));
    }, [partners]);

    const performanceOptions = useMemo(() => [
        { value: PERFORMANCE_FILTER_VALUES.high, label: t('partners.filters.performanceHigh') },
        { value: PERFORMANCE_FILTER_VALUES.good, label: t('partners.filters.performanceGood') },
        { value: PERFORMANCE_FILTER_VALUES.fair, label: t('partners.filters.performanceFair') },
    ], [t]);

    const filtered = useMemo(() => {
        const query = search.toLowerCase();
        return partners.filter((partner) => {
            const matchesSearch =
                partner.name.toLowerCase().includes(query) ||
                partner.country.toLowerCase().includes(query) ||
                partner.sector.toLowerCase().includes(query);
            const matchesSector = filters.sector === FILTER_ALL || partner.sector === filters.sector;
            const matchesStatus = filters.status === FILTER_ALL || partner.status === filters.status;
            const matchesCountry = filters.country === FILTER_ALL || partner.country === filters.country;
            let matchesPerformance = true;
            if (filters.performance === PERFORMANCE_FILTER_VALUES.high) matchesPerformance = partner.rating >= 4.5;
            else if (filters.performance === PERFORMANCE_FILTER_VALUES.good) matchesPerformance = partner.rating >= 4.0;
            else if (filters.performance === PERFORMANCE_FILTER_VALUES.fair) matchesPerformance = partner.rating >= 3.0;
            return matchesSearch && matchesSector && matchesStatus && matchesCountry && matchesPerformance;
        });
    }, [partners, search, filters]);

    const pageItems = useMemo(() => {
        const start = (page - 1) * PAGE_SIZE;
        return filtered.slice(start, start + PAGE_SIZE);
    }, [filtered, page]);

    const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;

    const updateFilter = (key: keyof PartnerFilters, value: string) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
        setPage(1);
    };

    const resetFilters = () => {
        setSearch('');
        setFilters({ sector: FILTER_ALL, status: FILTER_ALL, country: FILTER_ALL, performance: FILTER_ALL });
        setPage(1);
    };

    const openProfile = (partner: Partner) => {
        setSelectedPartnerId(partner.id);
        setViewMode('profile');
    };

    const backToList = () => {
        setSelectedPartnerId(null);
        setViewMode('list');
    };

    const handlePartnerUpdate = (updated: Partner) => {
        updatePartnerMutation.mutate(updated, {
            onError: () => toast.showError(t('partners.errors.saveFailed')),
        });
    };

    const handlePartnerCreate = (input: PartnerCreateInput, callbacks?: { onSuccess?: () => void }) => {
        createPartnerMutation.mutate(input, {
            onSuccess: () => {
                callbacks?.onSuccess?.();
            },
            onError: () => toast.showError(t('partners.errors.createFailed')),
        });
    };

    const handlePartnerDelete = (partnerId: string) => {
        deletePartnerMutation.mutate(partnerId, {
            onSuccess: () => {
                backToList();
                toast.showSuccess(t('partners.detail.deleteSuccess'));
            },
            onError: () => toast.showError(t('partners.errors.deleteFailed')),
        });
    };

    const handleExportList = () => {
        if (filtered.length === 0) {
            toast.showInfo(t('partners.exportEmpty'));
            return;
        }
        exportPartnersCsv(filtered);
        toast.showSuccess(t('partners.exportSuccess'));
    };

    if (viewMode === 'profile' && selectedPartner) {
        return (
            <PartnerDetailView
                partner={selectedPartner}
                onBack={backToList}
                onPartnerUpdate={handlePartnerUpdate}
                onPartnerDelete={handlePartnerDelete}
                isSaving={updatePartnerMutation.isPending}
                isDeleting={deletePartnerMutation.isPending}
            />
        );
    }

    if (viewMode === 'add') {
        return (
            <AddPartnerWizard
                onBack={backToList}
                onSubmit={handlePartnerCreate}
                isSubmitting={createPartnerMutation.isPending}
            />
        );
    }

    return (
        <div className="bg-gray-50 dark:bg-dark-background p-6 space-y-6">
            <div>
                <nav className="text-sm mb-2 text-gray-500 dark:text-gray-400">
                    <span className="hover:underline">{t('partners.breadcrumbHome')}</span>
                    {' > '}
                    <span className="hover:underline">{t('partners.breadcrumbPartners')}</span>
                    {' > '}
                    <span className="font-semibold text-gray-700 dark:text-gray-300">{t('partners.breadcrumbList')}</span>
                </nav>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-dark-foreground">{t('partners.title')}</h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('partners.subtitle')}</p>
            </div>

            {isError && (
                <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-200">
                    <AlertCircle size={20} className="flex-shrink-0" />
                    <p className="flex-1 text-sm">{t('partners.errors.loadFailed')}</p>
                    <button
                        type="button"
                        onClick={() => void refetch()}
                        className="text-sm font-semibold underline"
                    >
                        {t('common.retry')}
                    </button>
                </div>
            )}

            {!isLoading && <PartnerAnalytics partners={partners} />}

            <div className="bg-white dark:bg-dark-card rounded-xl shadow p-4 space-y-4">
                <div className="relative">
                    <Search className="w-5 h-5 absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input
                        type="text"
                        placeholder={t('partners.searchPlaceholder')}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full p-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 transition dark:bg-slate-800 dark:border-slate-600"
                    />
                </div>

                <div className="flex flex-col md:flex-row gap-4 justify-between">
                    <div className="flex flex-wrap gap-2 items-center">
                        <FilterSelect
                            label={t('partners.filters.sector')}
                            options={SECTORS.map((s) => ({ value: s, label: s }))}
                            value={filters.sector}
                            onChange={(v) => updateFilter('sector', v)}
                        />
                        <FilterSelect
                            label={t('partners.filters.status')}
                            options={STATUSES.map((s) => ({ value: s, label: s }))}
                            value={filters.status}
                            onChange={(v) => updateFilter('status', v)}
                        />
                        <FilterSelect
                            label={t('partners.filters.country')}
                            options={countryOptions}
                            value={filters.country}
                            onChange={(v) => updateFilter('country', v)}
                        />
                        <FilterSelect
                            label={t('partners.filters.performance')}
                            options={performanceOptions}
                            value={filters.performance}
                            onChange={(v) => updateFilter('performance', v)}
                        />
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <button type="button" onClick={handleExportList} className="px-4 py-2 text-sm font-semibold border rounded-lg hover:bg-gray-100 dark:border-slate-600 dark:hover:bg-slate-700">
                            {t('partners.exportList')}
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode('add')}
                            className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                        >
                            {t('partners.registerPartner')}
                        </button>
                        <div className="p-1 bg-gray-100 dark:bg-slate-700 rounded-lg flex items-center">
                            <button type="button" onClick={() => setLayout('grid')} className={`p-1.5 rounded-md ${layout === 'grid' ? 'bg-white dark:bg-slate-800 shadow' : ''}`}>
                                <LayoutGrid size={18} />
                            </button>
                            <button type="button" onClick={() => setLayout('list')} className={`p-1.5 rounded-md ${layout === 'list' ? 'bg-white dark:bg-slate-800 shadow' : ''}`}>
                                <List size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                        <PartnerCardSkeleton key={i} />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <EmptyState type="NoResults" onAction={resetFilters} />
            ) : (
                <AnimatePresence>
                    <div className={layout === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
                        {pageItems.map((partner) => (
                            <PartnerCard key={partner.id} partner={partner} onClick={() => openProfile(partner)} />
                        ))}
                    </div>
                </AnimatePresence>
            )}

            {!isLoading && filtered.length > 0 && (
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
                    <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                        <Users size={16} />
                        {t('partners.pagination.showing', {
                            from: formatNumber((page - 1) * PAGE_SIZE + 1, language),
                            to: formatNumber(Math.min(page * PAGE_SIZE, filtered.length), language),
                            total: formatNumber(filtered.length, language),
                        })}
                    </p>
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-3 py-1 border rounded-md disabled:opacity-50 dark:border-slate-600 dark:hover:bg-slate-700"
                        >
                            {t('partners.pagination.prev')}
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                            <button
                                key={p}
                                type="button"
                                onClick={() => setPage(p)}
                                className={`w-8 h-8 rounded-md ${page === p ? 'bg-blue-600 text-white' : 'hover:bg-gray-200 dark:hover:bg-slate-700'}`}
                            >
                                {p}
                            </button>
                        ))}
                        <button
                            type="button"
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="px-3 py-1 border rounded-md disabled:opacity-50 dark:border-slate-600 dark:hover:bg-slate-700"
                        >
                            {t('partners.pagination.next')}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ImplementingPartnersPage;
