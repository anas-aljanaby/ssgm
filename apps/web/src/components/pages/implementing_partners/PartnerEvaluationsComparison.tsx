import React, { useMemo, useState } from 'react';
import { ArrowUpDown, ChevronRight, Search } from 'lucide-react';
import type { Partner } from '../../../types';
import { useLocalization } from '../../../hooks/useLocalization';
import { useAllPartnerEvaluations } from '../../../hooks/usePartnerEvaluations';
import {
    type EvaluationScores,
    CRITERIA_KEYS,
    averageScores,
    deriveRating,
} from '../../../data/partnerEvaluationsData';
import EmptyState from '../../common/EmptyState';
import Spinner from '../../common/Spinner';
import { scoreTone } from './shared';

interface PartnerEvaluationsComparisonProps {
    partners: Partner[];
    onSelectPartner: (partner: Partner) => void;
    isLoading?: boolean;
}

type SortKey = 'name' | 'overall' | keyof EvaluationScores;

interface ComparisonRow {
    partner: Partner;
    averages: EvaluationScores;
    overall: number;
    count: number;
}

const ScoreCell: React.FC<{ value: number; strong?: boolean }> = ({ value, strong = false }) => {
    const tone = scoreTone(value);
    return (
        <span className={`inline-block min-w-[2.75rem] rounded-md px-2 py-1 text-sm font-bold ${tone.soft} ${tone.text} ${strong ? 'ring-1 ring-inset ring-current/20' : ''}`}>
            {value}
        </span>
    );
};

const EMPTY_AVERAGES: EvaluationScores = {
    timeline: 0,
    quality: 0,
    communication: 0,
    transparency: 0,
    flexibility: 0,
    budget: 0,
    resources: 0,
};

const PartnerEvaluationsComparison: React.FC<PartnerEvaluationsComparisonProps> = ({ partners, onSelectPartner, isLoading = false }) => {
    const { t } = useLocalization(['partners', 'common']);
    const [search, setSearch] = useState('');
    const [sortKey, setSortKey] = useState<SortKey>('overall');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
    const { data: allEvaluations = [], isLoading: evaluationsLoading, isError, refetch } = useAllPartnerEvaluations();

    const evaluationsByPartner = useMemo(() => {
        const map = new Map<string, typeof allEvaluations>();
        allEvaluations.forEach((evaluation) => {
            const partnerId = evaluation.partner_id;
            if (!partnerId) return;
            const existing = map.get(partnerId) ?? [];
            existing.push(evaluation);
            map.set(partnerId, existing);
        });
        return map;
    }, [allEvaluations]);

    const rows = useMemo<ComparisonRow[]>(() => {
        const query = search.trim().toLowerCase();
        return partners
            .filter((partner) => (partner.name || '').toLowerCase().includes(query))
            .map((partner) => {
                const evaluations = evaluationsByPartner.get(partner.id) ?? [];
                const averages = evaluations.length ? averageScores(evaluations) : EMPTY_AVERAGES;
                return {
                    partner,
                    averages,
                    overall: evaluations.length ? deriveRating(averages) : Math.round(partner.rating * 20),
                    count: evaluations.length,
                };
            });
    }, [partners, search, evaluationsByPartner]);

    const sortedRows = useMemo(() => {
        const factor = sortDir === 'asc' ? 1 : -1;
        return [...rows].sort((a, b) => {
            if (sortKey === 'name') return (a.partner.name || '').localeCompare(b.partner.name || '') * factor;
            const av = sortKey === 'overall' ? a.overall : a.averages[sortKey];
            const bv = sortKey === 'overall' ? b.overall : b.averages[sortKey];
            return (av - bv) * factor;
        });
    }, [rows, sortKey, sortDir]);

    const toggleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDir((dir) => (dir === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortKey(key);
            setSortDir(key === 'name' ? 'asc' : 'desc');
        }
    };

    const SortableHeader: React.FC<{ sortKeyValue: SortKey; label: string; align?: 'start' | 'center' }> = ({ sortKeyValue, label, align = 'center' }) => (
        <th className={`p-3 font-semibold ${align === 'start' ? 'text-start' : 'text-center'}`}>
            <button
                type="button"
                onClick={() => toggleSort(sortKeyValue)}
                className={`inline-flex items-center gap-1 hover:text-blue-600 ${sortKey === sortKeyValue ? 'text-blue-600' : ''} ${align === 'center' ? 'justify-center' : ''}`}
            >
                {label}
                <ArrowUpDown size={12} className={sortKey === sortKeyValue ? 'opacity-100' : 'opacity-40'} />
            </button>
        </th>
    );

    const loading = isLoading || evaluationsLoading;

    return (
        <div className="bg-white dark:bg-dark-card rounded-xl shadow p-6 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                    <h2 className="text-lg font-bold">{t('partners.evaluations.comparisonTitle')}</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('partners.evaluations.comparisonSubtitle')}</p>
                </div>
                <div className="relative w-full md:w-72">
                    <Search className="w-4 h-4 absolute top-1/2 rtl:left-3 ltr:right-3 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input
                        type="text"
                        placeholder={t('partners.evaluations.searchPlaceholder')}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full p-2 rtl:pl-9 ltr:pr-9 border rounded-lg text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-600"
                    />
                </div>
            </div>

            {isError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 p-6 text-center space-y-3">
                    <p className="text-sm text-red-700 dark:text-red-300">{t('partners.performance.loadError')}</p>
                    <button
                        type="button"
                        onClick={() => void refetch()}
                        className="text-sm font-semibold text-red-700 dark:text-red-300 underline"
                    >
                        {t('common.retry')}
                    </button>
                </div>
            ) : loading ? (
                <div className="flex justify-center py-16">
                    <Spinner />
                </div>
            ) : sortedRows.length === 0 ? (
                <EmptyState type="NoResults" onAction={() => setSearch('')} />
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                        <thead>
                            <tr className="border-b dark:border-slate-700 text-xs text-gray-500 dark:text-gray-400">
                                <SortableHeader sortKeyValue="name" label={t('partners.evaluations.partnerColumn')} align="start" />
                                {CRITERIA_KEYS.map((key) => (
                                    <SortableHeader key={key} sortKeyValue={key} label={t(`partners.performance.criteria.${key}`)} />
                                ))}
                                <SortableHeader sortKeyValue="overall" label={t('partners.evaluations.overallColumn')} />
                                <th className="p-3" aria-hidden="true" />
                            </tr>
                        </thead>
                        <tbody>
                            {sortedRows.map(({ partner, averages, overall, count }) => (
                                <tr
                                    key={partner.id}
                                    onClick={() => onSelectPartner(partner)}
                                    className="border-b dark:border-slate-700/60 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800/50"
                                >
                                    <td className="p-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center font-bold text-blue-600 dark:text-blue-300 text-xs flex-shrink-0">
                                                {partner.logo}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-semibold truncate max-w-[16rem]">{partner.name}</p>
                                                <p className="text-xs text-gray-400">{t('partners.performance.basedOn', { count })}</p>
                                            </div>
                                        </div>
                                    </td>
                                    {CRITERIA_KEYS.map((key) => (
                                        <td key={key} className="p-3 text-center">
                                            <ScoreCell value={averages[key]} />
                                        </td>
                                    ))}
                                    <td className="p-3 text-center">
                                        <ScoreCell value={overall} strong />
                                    </td>
                                    <td className="p-3 text-gray-400">
                                        <ChevronRight size={16} className="rtl:rotate-180 mx-auto" />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default PartnerEvaluationsComparison;
