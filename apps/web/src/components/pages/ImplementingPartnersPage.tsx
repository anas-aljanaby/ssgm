import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { LayoutGrid, List, Mic, Search, Users } from 'lucide-react';
import type { Partner, PartnerSector, PartnerStatus } from '../../types';
import { MOCK_PARTNERS } from '../../data/partnersData';
import { useLocalization } from '../../hooks/useLocalization';
import { useToast } from '../../hooks/useToast';
import { formatNumber } from '../../lib/utils';
import EmptyState from '../common/EmptyState';
import PartnerAnalytics from './implementing_partners/PartnerAnalytics';
import PartnerCard from './implementing_partners/PartnerCard';
import PartnerCardSkeleton from './implementing_partners/PartnerCardSkeleton';
import PartnerDetailView from './implementing_partners/PartnerDetailView';
import AddPartnerWizard from './implementing_partners/AddPartnerWizard';

interface SpeechRecognition extends EventTarget {
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    start: () => void;
    stop: () => void;
    onstart: (() => void) | null;
    onend: (() => void) | null;
    onerror: ((event: { error: string }) => void) | null;
    onresult: ((event: { results: Iterable<{ 0: { transcript: string } }> }) => void) | null;
}

declare global {
    interface Window {
        SpeechRecognition?: new () => SpeechRecognition;
        webkitSpeechRecognition?: new () => SpeechRecognition;
    }
}

type ViewMode = 'list' | 'profile' | 'add';

interface PartnerFilters {
    sector: string;
    status: string;
    region: string;
    rating: string;
}

const SECTORS: PartnerSector[] = ['التعليم', 'الصحة', 'الإغاثة', 'التنمية', 'البيئة'];
const STATUSES: PartnerStatus[] = ['نشط', 'غير نشط', 'قيد المراجعة'];
const REGIONS = ['أفريقيا', 'آسيا', 'الشرق الأوسط', 'أوروبا', 'أمريكا'];
const PAGE_SIZE = 12;

const FilterSelect: React.FC<{
    label: string;
    options: string[];
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
            <option value="الكل">{label}: {t('partners.filters.all')}</option>
            {options.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
            ))}
        </select>
    );
};

const ImplementingPartnersPage: React.FC = () => {
    const { t, language } = useLocalization(['partners', 'common']);
    const toast = useToast();

    const [loading, setLoading] = useState(true);
    const [partners, setPartners] = useState<Partner[]>([]);
    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const [layout, setLayout] = useState<'grid' | 'list'>('grid');
    const [search, setSearch] = useState('');
    const [filters, setFilters] = useState<PartnerFilters>({ sector: 'الكل', status: 'الكل', region: 'الكل', rating: 'الكل' });
    const [page, setPage] = useState(1);
    const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
    const [listening, setListening] = useState(false);
    const [speechError, setSpeechError] = useState<string | null>(null);
    const recognitionRef = useRef<SpeechRecognition | null>(null);

    useEffect(() => {
        setLoading(true);
        const timer = setTimeout(() => {
            setPartners(MOCK_PARTNERS);
            setLoading(false);
        }, 1000);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognitionCtor) {
            setSpeechError('Speech recognition is not supported in this browser.');
            return;
        }
        const recognition = new SpeechRecognitionCtor();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.onstart = () => setListening(true);
        recognition.onend = () => setListening(false);
        recognition.onerror = (event) => {
            if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                const message = 'Microphone permission was denied. Please enable it in your browser settings.';
                setSpeechError(message);
                toast.showError(message);
            }
            setListening(false);
        };
        recognition.onresult = (event) => {
            const transcript = Array.from(event.results).map((r) => r[0].transcript).join('');
            setSearch(transcript);
        };
        recognitionRef.current = recognition;
    }, [toast]);

    const toggleVoiceSearch = useCallback(() => {
        if (!recognitionRef.current) return;
        if (listening) {
            recognitionRef.current.stop();
            return;
        }
        setSpeechError(null);
        recognitionRef.current.lang = language === 'ar' ? 'ar-SA' : 'en-US';
        try {
            recognitionRef.current.start();
        } catch {
            const message = 'Could not start listening. Please try again.';
            setSpeechError(message);
            toast.showError(message);
        }
    }, [listening, language, toast]);

    const filtered = useMemo(() => {
        const query = search.toLowerCase();
        return partners.filter((partner) => {
            const matchesSearch =
                partner.name.toLowerCase().includes(query) ||
                partner.country.toLowerCase().includes(query) ||
                partner.sector.toLowerCase().includes(query);
            const matchesSector = filters.sector === 'الكل' || partner.sector === filters.sector;
            const matchesStatus = filters.status === 'الكل' || partner.status === filters.status;
            let matchesRating = true;
            if (filters.rating === '5 نجوم') matchesRating = partner.rating >= 5;
            else if (filters.rating === '4+ نجوم') matchesRating = partner.rating >= 4;
            else if (filters.rating === '3+ نجوم') matchesRating = partner.rating >= 3;
            return matchesSearch && matchesSector && matchesStatus && matchesRating;
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
        setFilters({ sector: 'الكل', status: 'الكل', region: 'الكل', rating: 'الكل' });
        setPage(1);
    };

    const openProfile = (partner: Partner) => {
        setSelectedPartner(partner);
        setViewMode('profile');
    };

    const backToList = () => {
        setSelectedPartner(null);
        setViewMode('list');
    };

    if (viewMode === 'profile' && selectedPartner) {
        return <PartnerDetailView partner={selectedPartner} onBack={backToList} />;
    }

    if (viewMode === 'add') {
        return <AddPartnerWizard onBack={backToList} />;
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
            </div>

            {!loading && <PartnerAnalytics partners={partners} />}

            <div className="bg-white dark:bg-dark-card rounded-xl shadow p-4 space-y-4">
                <div className="relative">
                    <Search className="w-5 h-5 absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input
                        type="text"
                        placeholder={listening ? t('partners.listening') : t('partners.searchPlaceholder')}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full p-2 pr-10 pl-10 border rounded-lg focus:ring-2 focus:ring-blue-500 transition dark:bg-slate-800 dark:border-slate-600"
                    />
                    <div className="absolute inset-y-0 left-3 flex items-center">
                        <button
                            type="button"
                            onClick={toggleVoiceSearch}
                            disabled={!!speechError}
                            title={speechError || 'Search by voice'}
                            className={`p-2 rounded-full transition-colors disabled:text-gray-400 disabled:cursor-not-allowed ${listening ? 'text-red-500 bg-red-100 dark:bg-red-900/50 animate-pulse' : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-slate-700'}`}
                        >
                            <Mic className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4 justify-between">
                    <div className="flex flex-wrap gap-2 items-center">
                        <FilterSelect label={t('partners.filters.sector')} options={SECTORS} value={filters.sector} onChange={(v) => updateFilter('sector', v)} />
                        <FilterSelect label={t('partners.filters.status')} options={STATUSES} value={filters.status} onChange={(v) => updateFilter('status', v)} />
                        <FilterSelect label={t('partners.filters.region')} options={REGIONS} value={filters.region} onChange={(v) => updateFilter('region', v)} />
                        <FilterSelect label={t('partners.filters.rating')} options={['5 نجوم', '4+ نجوم', '3+ نجوم']} value={filters.rating} onChange={(v) => updateFilter('rating', v)} />
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <button type="button" className="px-4 py-2 text-sm font-semibold border rounded-lg hover:bg-gray-100 dark:border-slate-600 dark:hover:bg-slate-700">
                            {t('partners.exportList')}
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode('add')}
                            className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                        >
                            {t('partners.addPartner')}
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

            {loading ? (
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

            {!loading && filtered.length > 0 && (
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
