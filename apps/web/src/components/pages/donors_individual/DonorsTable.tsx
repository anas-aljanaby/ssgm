import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useLocalization } from '../../../hooks/useLocalization';
import type { DonorStageId, IndividualDonor, SortDirection } from '../../../types';
import { formatDate, formatCurrency, formatNumber, formatRelativeTime } from '../../../lib/utils';
import { ChevronDownIcon } from '../../icons/GenericIcons';
import { StatusBadge } from './DonorBadges';
import { Columns3, Eye, EyeOff, ArrowLeftToLine, ArrowRightToLine } from 'lucide-react';

interface DonorsTableProps {
    donors: IndividualDonor[];
    onDonorSelect: (donor: IndividualDonor) => void;
    sortColumn: keyof IndividualDonor | null;
    sortDirection: SortDirection;
    onSort: (column: keyof IndividualDonor) => void;
    stageByEmail?: Map<string, DonorStageId>;
}

type ColumnId = 'donor' | 'donorType' | 'status' | 'pipelineStage' | 'owner' | 'country' | 'totalDonations' | 'lastGift' | 'lastContact' | 'openTasks' | 'tags';

type ColumnGroup = {
    groupKey: string;
    labelClass: string;
    headerClass: string;
    cellClass: string;
    dividerClass: string;
    columns: ColumnId[];
};

const COLUMN_GROUPS: ColumnGroup[] = [
    {
        groupKey: 'individual_donors.detailView.identity',
        labelClass: 'bg-sky-500/10 text-sky-700 ring-sky-500/15 dark:bg-sky-400/12 dark:text-sky-200 dark:ring-sky-400/20',
        headerClass: 'bg-sky-500/[0.035] dark:bg-sky-400/[0.06]',
        cellClass: 'bg-sky-500/[0.02] dark:bg-sky-400/[0.035] group-hover:bg-sky-500/[0.045] dark:group-hover:bg-sky-400/[0.07]',
        dividerClass: 'border-s border-slate-200/70 dark:border-slate-700/75',
        columns: ['donor', 'donorType', 'status', 'country'],
    },
    {
        groupKey: 'individual_donors.detailView.relationshipOwnership',
        labelClass: 'bg-violet-500/10 text-violet-700 ring-violet-500/15 dark:bg-violet-400/12 dark:text-violet-200 dark:ring-violet-400/20',
        headerClass: 'bg-violet-500/[0.035] dark:bg-violet-400/[0.06]',
        cellClass: 'bg-violet-500/[0.02] dark:bg-violet-400/[0.035] group-hover:bg-violet-500/[0.045] dark:group-hover:bg-violet-400/[0.07]',
        dividerClass: 'border-s border-slate-200/70 dark:border-slate-700/75',
        columns: ['pipelineStage', 'owner', 'lastContact'],
    },
    {
        groupKey: 'individual_donors.detailView.givingHistory',
        labelClass: 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/15 dark:bg-emerald-400/12 dark:text-emerald-200 dark:ring-emerald-400/20',
        headerClass: 'bg-emerald-500/[0.035] dark:bg-emerald-400/[0.06]',
        cellClass: 'bg-emerald-500/[0.02] dark:bg-emerald-400/[0.035] group-hover:bg-emerald-500/[0.045] dark:group-hover:bg-emerald-400/[0.07]',
        dividerClass: 'border-s border-slate-200/70 dark:border-slate-700/75',
        columns: ['totalDonations', 'lastGift'],
    },
    {
        groupKey: 'individual_donors.detailView.tasks',
        labelClass: 'bg-amber-500/10 text-amber-700 ring-amber-500/15 dark:bg-amber-400/12 dark:text-amber-200 dark:ring-amber-400/20',
        headerClass: 'bg-amber-500/[0.035] dark:bg-amber-400/[0.06]',
        cellClass: 'bg-amber-500/[0.02] dark:bg-amber-400/[0.035] group-hover:bg-amber-500/[0.045] dark:group-hover:bg-amber-400/[0.07]',
        dividerClass: 'border-s border-slate-200/70 dark:border-slate-700/75',
        columns: ['openTasks'],
    },
    {
        groupKey: 'individual_donors.columns.tags',
        labelClass: 'bg-slate-500/10 text-slate-600 ring-slate-500/15 dark:bg-slate-400/12 dark:text-slate-300 dark:ring-slate-400/20',
        headerClass: 'bg-slate-500/[0.03] dark:bg-slate-400/[0.05]',
        cellClass: 'bg-slate-500/[0.02] dark:bg-slate-400/[0.03] group-hover:bg-slate-500/[0.045] dark:group-hover:bg-slate-400/[0.06]',
        dividerClass: 'border-s border-slate-200/70 dark:border-slate-700/75',
        columns: ['tags'],
    },
];

const COLUMN_META: Record<ColumnId, { labelKey: string; sortKey?: keyof IndividualDonor; width: string }> = {
    donor: { labelKey: 'individual_donors.columns.donor', sortKey: 'fullName', width: 'w-56' },
    donorType: { labelKey: 'individual_donors.columns.donorType', sortKey: 'donorType', width: 'w-32' },
    status: { labelKey: 'individual_donors.columns.status', sortKey: 'status', width: 'w-32' },
    country: { labelKey: 'individual_donors.columns.country', sortKey: 'country', width: 'w-28' },
    pipelineStage: { labelKey: 'individual_donors.columns.pipelineStage', width: 'w-32' },
    owner: { labelKey: 'individual_donors.columns.owner', sortKey: 'assignedManager', width: 'w-32' },
    lastContact: { labelKey: 'individual_donors.columns.lastContact', sortKey: 'lastContactDate', width: 'w-32' },
    totalDonations: { labelKey: 'individual_donors.columns.totalDonations', sortKey: 'totalDonations', width: 'w-32' },
    lastGift: { labelKey: 'individual_donors.columns.lastGift', sortKey: 'lastDonationDate', width: 'w-32' },
    openTasks: { labelKey: 'individual_donors.columns.openTasks', width: 'w-28' },
    tags: { labelKey: 'individual_donors.columns.tags', sortKey: 'tags', width: 'w-44' },
};

const ALL_COLUMN_IDS = COLUMN_GROUPS.flatMap(g => g.columns);
const ALWAYS_VISIBLE: ColumnId[] = ['donor'];
const DEFAULT_HIDDEN: ColumnId[] = ['country', 'tags'];

const DonorsTable: React.FC<DonorsTableProps> = ({ donors, onDonorSelect, sortColumn, sortDirection, onSort, stageByEmail }) => {
    const { t, language } = useLocalization(['common', 'individual_donors', 'donors']);
    const [selectedDonors, setSelectedDonors] = useState<Set<string>>(new Set());
    const [currentPage, setCurrentPage] = useState(1);
    const [hiddenColumns, setHiddenColumns] = useState<Set<ColumnId>>(new Set(DEFAULT_HIDDEN));
    const [isColumnPickerOpen, setIsColumnPickerOpen] = useState(false);
    const [canScrollEnd, setCanScrollEnd] = useState(false);
    const [canScrollStart, setCanScrollStart] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const pickerRef = useRef<HTMLDivElement>(null);
    const rowsPerPage = 10;

    const paginatedDonors = donors.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
    const totalPages = Math.ceil(donors.length / rowsPerPage);

    const visibleColumns = ALL_COLUMN_IDS.filter(id => !hiddenColumns.has(id));
    const visibleCount = visibleColumns.length;
    const totalCount = ALL_COLUMN_IDS.length;

    const checkScroll = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        const maxScroll = el.scrollWidth - el.clientWidth;
        if (maxScroll <= 0) {
            setCanScrollStart(false);
            setCanScrollEnd(false);
            return;
        }
        const pos = Math.abs(el.scrollLeft);
        setCanScrollStart(pos > 4);
        setCanScrollEnd(pos < maxScroll - 4);
    }, []);

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        checkScroll();
        el.addEventListener('scroll', checkScroll, { passive: true });
        const observer = new ResizeObserver(checkScroll);
        observer.observe(el);
        return () => {
            el.removeEventListener('scroll', checkScroll);
            observer.disconnect();
        };
    }, [checkScroll, hiddenColumns]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
                setIsColumnPickerOpen(false);
            }
        };
        if (isColumnPickerOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isColumnPickerOpen]);

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedDonors(new Set(donors.map(d => d.id)));
        } else {
            setSelectedDonors(new Set());
        }
    };

    const handleSelectRow = (id: string) => {
        const newSelection = new Set(selectedDonors);
        if (newSelection.has(id)) {
            newSelection.delete(id);
        } else {
            newSelection.add(id);
        }
        setSelectedDonors(newSelection);
    };

    const toggleColumn = (colId: ColumnId) => {
        if (ALWAYS_VISIBLE.includes(colId)) return;
        const next = new Set(hiddenColumns);
        if (next.has(colId)) {
            next.delete(colId);
        } else {
            next.add(colId);
        }
        setHiddenColumns(next);
    };

    const showAllColumns = () => setHiddenColumns(new Set());
    const resetColumns = () => setHiddenColumns(new Set(DEFAULT_HIDDEN));

    const isColumnVisible = (colId: ColumnId) => !hiddenColumns.has(colId);

    const getGroupForColumn = (colId: ColumnId) => COLUMN_GROUPS.find(group => group.columns.includes(colId));

    const isFirstVisibleColumnInGroup = (colId: ColumnId) => {
        const group = getGroupForColumn(colId);
        return group?.columns.filter(column => isColumnVisible(column))[0] === colId;
    };

    const getColumnSurfaceClass = (colId: ColumnId, surface: 'header' | 'cell') => {
        const group = getGroupForColumn(colId);
        if (!group) return '';
        return [
            surface === 'header' ? group.headerClass : group.cellClass,
            isFirstVisibleColumnInGroup(colId) ? group.dividerClass : '',
        ].filter(Boolean).join(' ');
    };

    const getColumnBaseClass = (colId: ColumnId, surface: 'header' | 'cell') => {
        const meta = COLUMN_META[colId];
        return `${meta.width} ${getColumnSurfaceClass(colId, surface)}`;
    };

    const scrollToEnd = () => {
        const el = scrollRef.current;
        if (!el) return;
        const maxScroll = el.scrollWidth - el.clientWidth;
        const isRtl = getComputedStyle(el).direction === 'rtl';
        el.scrollTo({ left: isRtl ? -maxScroll : maxScroll, behavior: 'smooth' });
    };

    const scrollToStart = () => {
        const el = scrollRef.current;
        if (!el) return;
        el.scrollTo({ left: 0, behavior: 'smooth' });
    };

    const SortableHeader: React.FC<{ colId: ColumnId; column: keyof IndividualDonor; labelKey: string }> = ({ colId, column, labelKey }) => (
        <th scope="col" className={`px-4 py-2.5 ${getColumnBaseClass(colId, 'header')}`}>
            <div className="flex items-center gap-1 cursor-pointer whitespace-nowrap" onClick={() => onSort(column)}>
                {t(labelKey)}
                {sortColumn === column && (
                    <ChevronDownIcon className={`w-3.5 h-3.5 transition-transform ${sortDirection === 'asc' ? 'transform rotate-180' : ''}`} />
                )}
            </div>
        </th>
    );

    const PlainHeader: React.FC<{ colId: ColumnId; labelKey: string }> = ({ colId, labelKey }) => (
        <th scope="col" className={`px-4 py-2.5 whitespace-nowrap ${getColumnBaseClass(colId, 'header')}`}>{t(labelKey)}</th>
    );

    const StageBadge: React.FC<{ stage?: DonorStageId }> = ({ stage }) => (
        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
            {stage ? t(`donors.stages.${stage}`) : t('individual_donors.relationship.noStage')}
        </span>
    );

    const renderColumnHeader = (colId: ColumnId) => {
        const meta = COLUMN_META[colId];
        if (meta.sortKey) {
            return <SortableHeader key={colId} colId={colId} column={meta.sortKey} labelKey={meta.labelKey} />;
        }
        return <PlainHeader key={colId} colId={colId} labelKey={meta.labelKey} />;
    };

    const cellClass = (colId: ColumnId, className = '') => `px-4 py-3 align-middle ${getColumnBaseClass(colId, 'cell')} ${className}`;

    const renderCell = (colId: ColumnId, donor: IndividualDonor, stage: DonorStageId | undefined, openTasks: any[], overdueTasks: any[]) => {
        switch (colId) {
            case 'donor':
                return (
                    <td key={colId} className={cellClass(colId)}>
                        <div className="flex min-w-0 items-center gap-3">
                            <img className="w-9 h-9 rounded-full flex-shrink-0" src={donor.avatar} alt={donor.fullName.en} loading="lazy" />
                            <div className="min-w-0">
                                <button onClick={() => onDonorSelect(donor)} className="block max-w-full truncate font-bold text-foreground dark:text-dark-foreground hover:underline text-start">{donor.fullName[language]}</button>
                                <div className="max-w-full truncate text-xs text-gray-500">{donor.email}</div>
                            </div>
                        </div>
                    </td>
                );
            case 'donorType':
                return (
                    <td key={colId} className={cellClass(colId)}>
                        <span className="font-semibold text-gray-700 dark:text-gray-200">
                            {donor.donorType ? t(`donors.types.${donor.donorType.replace(/ /g, '')}`, donor.donorType) : 'N/A'}
                        </span>
                    </td>
                );
            case 'status':
                return <td key={colId} className={cellClass(colId)}><StatusBadge status={donor.status} /></td>;
            case 'pipelineStage':
                return <td key={colId} className={cellClass(colId)}><StageBadge stage={stage} /></td>;
            case 'owner':
                return <td key={colId} className={cellClass(colId, 'font-semibold text-gray-700 dark:text-gray-200')}>{donor.assignedManager}</td>;
            case 'country':
                return <td key={colId} className={cellClass(colId)}>{donor.country}</td>;
            case 'totalDonations':
                return <td key={colId} className={cellClass(colId, 'font-semibold')}>{formatCurrency(donor.totalDonations, language)}</td>;
            case 'lastGift':
                return <td key={colId} className={cellClass(colId)}>{donor.lastDonationDate ? formatDate(donor.lastDonationDate, language) : 'N/A'}</td>;
            case 'lastContact':
                return <td key={colId} className={cellClass(colId)}>{donor.lastContactDate ? formatRelativeTime(donor.lastContactDate, language) : 'N/A'}</td>;
            case 'openTasks':
                return (
                    <td key={colId} className={cellClass(colId)}>
                        <div className="space-y-1.5">
                            <div className="flex items-baseline gap-2 whitespace-nowrap">
                                <span className="min-w-4 text-lg font-black leading-none tabular-nums text-slate-800 dark:text-slate-100">
                                    {formatNumber(openTasks.length, language)}
                                </span>
                                <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">
                                    {t('individual_donors.columns.openTasks')}
                                </span>
                            </div>
                            {overdueTasks.length > 0 && (
                                <p className="flex items-center gap-1.5 text-xs font-semibold text-red-600 dark:text-red-300">
                                    <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                                    {formatNumber(overdueTasks.length, language)} {t('donors.card.overdue')}
                                </p>
                            )}
                        </div>
                    </td>
                );
            case 'tags':
                return (
                    <td key={colId} className={cellClass(colId)}>
                        <div className="flex flex-wrap gap-1 min-w-28">
                            {donor.tags.slice(0, 2).map(tag => <span key={tag} className="px-2 py-0.5 text-xs bg-gray-200 dark:bg-slate-700 rounded-full">{tag}</span>)}
                            {donor.tags.length > 2 && <span className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-slate-800 rounded-full">+{donor.tags.length - 2}</span>}
                            {donor.tags.length === 0 && <span className="text-xs text-gray-400">{t('individual_donors.relationship.noTags')}</span>}
                        </div>
                    </td>
                );
            default:
                return null;
        }
    };

    const visibleGroups = COLUMN_GROUPS.map(group => ({
        ...group,
        visibleColumns: group.columns.filter(col => isColumnVisible(col)),
    })).filter(group => group.visibleColumns.length > 0);

    return (
        <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-card shadow-[0_18px_45px_-30px_rgba(15,23,42,0.28)] dark:border-slate-700/60 dark:bg-dark-card dark:shadow-black/20">
            {/* Toolbar: column picker */}
            <div className="flex items-center justify-between border-b border-slate-200/65 px-4 py-3 dark:border-slate-700/50">
                <div />
                <div className="relative" ref={pickerRef}>
                    <button
                        onClick={() => setIsColumnPickerOpen(prev => !prev)}
                        className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                            isColumnPickerOpen
                                ? 'border-primary/20 bg-primary-light/70 text-primary dark:bg-primary/20 dark:text-secondary'
                                : 'border-slate-300/80 text-gray-600 hover:bg-slate-100 dark:border-slate-700 dark:text-gray-300 dark:hover:bg-slate-700'
                        }`}
                    >
                        <Columns3 size={14} />
                        {t('individual_donors.table.columns')} ({visibleCount}/{totalCount})
                    </button>
                    {isColumnPickerOpen && (
                        <div className="absolute end-0 top-full z-50 mt-2 w-72 space-y-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-700 dark:bg-slate-800">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-bold text-foreground dark:text-dark-foreground">{t('individual_donors.table.visibleColumns')}</span>
                                <div className="flex gap-2">
                                    <button onClick={showAllColumns} className="text-xs text-primary dark:text-secondary hover:underline">{t('individual_donors.table.showAll')}</button>
                                    <button onClick={resetColumns} className="text-xs text-gray-500 hover:underline">{t('individual_donors.table.reset')}</button>
                                </div>
                            </div>
                            {COLUMN_GROUPS.map(group => (
                                <div key={group.groupKey}>
                                    <p className={`mb-1.5 rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ring-1 ${group.labelClass}`}>
                                        {t(group.groupKey)}
                                    </p>
                                    <div className="space-y-0.5">
                                        {group.columns.map(colId => {
                                            const isLocked = ALWAYS_VISIBLE.includes(colId);
                                            const visible = isColumnVisible(colId);
                                            return (
                                                <button
                                                    key={colId}
                                                    onClick={() => toggleColumn(colId)}
                                                    disabled={isLocked}
                                                    className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-xs transition-colors ${
                                                        isLocked
                                                            ? 'text-gray-400 cursor-not-allowed'
                                                            : visible
                                                                ? 'text-foreground dark:text-dark-foreground hover:bg-gray-100 dark:hover:bg-slate-700'
                                                                : 'text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700'
                                                    }`}
                                                >
                                                    {visible ? <Eye size={13} /> : <EyeOff size={13} />}
                                                    {t(COLUMN_META[colId].labelKey)}
                                                    {isLocked && <span className="ms-auto text-[10px] text-gray-400">{t('individual_donors.table.locked')}</span>}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Table with scroll indicators */}
            <div className="relative">
                {canScrollStart && (
                    <div className="pointer-events-none absolute inset-y-0 start-0 z-10 w-10 bg-gradient-to-r from-card to-transparent dark:from-dark-card rtl:bg-gradient-to-l" />
                )}
                {canScrollEnd && (
                    <div className="pointer-events-none absolute inset-y-0 end-0 z-10 w-14 bg-gradient-to-l from-card to-transparent dark:from-dark-card rtl:bg-gradient-to-r" />
                )}
                {canScrollStart && (
                    <button
                        type="button"
                        onClick={scrollToStart}
                        aria-label={t('individual_donors.table.scrollToStart')}
                        title={t('individual_donors.table.scrollToStart')}
                        className="absolute start-3 top-1/2 z-20 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-slate-200/85 bg-white/80 text-gray-600 opacity-75 shadow-lg shadow-slate-900/10 backdrop-blur-md transition hover:scale-105 hover:bg-white hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary/30 dark:border-slate-700/80 dark:bg-slate-900/80 dark:text-gray-200 dark:shadow-black/20 rtl:rotate-180"
                    >
                        <ArrowLeftToLine size={16} />
                    </button>
                )}
                {canScrollEnd && (
                    <button
                        type="button"
                        onClick={scrollToEnd}
                        aria-label={t('individual_donors.table.scrollToEnd')}
                        title={t('individual_donors.table.scrollToEnd')}
                        className="absolute end-3 top-1/2 z-20 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-slate-200/85 bg-white/80 text-gray-600 opacity-75 shadow-lg shadow-slate-900/10 backdrop-blur-md transition hover:scale-105 hover:bg-white hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary/30 dark:border-slate-700/80 dark:bg-slate-900/80 dark:text-gray-200 dark:shadow-black/20 rtl:rotate-180"
                    >
                        <ArrowRightToLine size={16} />
                    </button>
                )}
                <div ref={scrollRef} className="overflow-x-auto">
                    <table className="w-max min-w-full table-auto text-start text-sm text-gray-600 dark:text-gray-400">
                        <thead>
                            {/* Group header row */}
                            <tr className="border-b border-slate-200/55 dark:border-slate-700/55">
                                <th className="w-10" />
                                {visibleGroups.map(group => (
                                    <th
                                        key={group.groupKey}
                                        scope="colgroup"
                                        colSpan={group.visibleColumns.length}
                                        className={`px-4 pb-2 pt-3 text-start ${group.headerClass} ${group.dividerClass}`}
                                    >
                                        <span className={`inline-flex max-w-full items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ring-1 ${group.labelClass}`}>
                                            {t(group.groupKey)}
                                        </span>
                                    </th>
                                ))}
                            </tr>
                            {/* Column header row */}
                            <tr className="border-b border-slate-200/70 bg-slate-50/55 text-[11px] uppercase tracking-[0.16em] text-gray-600 dark:border-slate-700 dark:bg-dark-card/55 dark:text-gray-400">
                                <th scope="col" className="w-10 p-3"><input type="checkbox" onChange={handleSelectAll} /></th>
                                {visibleColumns.map(colId => renderColumnHeader(colId))}
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedDonors.map(donor => {
                                const stage = stageByEmail?.get(donor.email.toLowerCase()) || donor.relationshipStage;
                                const openTasks = donor.relationshipTasks?.filter(task => !task.completed) || [];
                                const today = new Date().toISOString().split('T')[0];
                                const overdueTasks = openTasks.filter(task => task.dueDate < today);
                                return (
                                    <tr key={donor.id} className="group border-b border-slate-100/90 bg-card dark:border-slate-800/80 dark:bg-dark-card hover:bg-slate-50/55 dark:hover:bg-slate-800/20">
                                        <td className="p-3 w-10"><input type="checkbox" checked={selectedDonors.has(donor.id)} onChange={() => handleSelectRow(donor.id)} /></td>
                                        {visibleColumns.map(colId => renderCell(colId, donor, stage, openTasks, overdueTasks))}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {donors.length === 0 && <div className="text-center py-16 text-gray-500">{t('individual_donors.noResults')}</div>}
                </div>
            </div>
            <nav className="flex items-center justify-between border-t border-slate-200/65 p-4 dark:border-slate-700/50" aria-label="Table navigation">
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                    {t('common.pagination_summary', {
                        start: Math.min((currentPage - 1) * rowsPerPage + 1, donors.length),
                        end: Math.min(currentPage * rowsPerPage, donors.length),
                        total: donors.length
                    })}
                </span>
                <ul className="inline-flex items-center -space-x-px rtl:space-x-reverse">
                    <li><button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1} className="px-3 py-2 ms-0 leading-tight border rounded-s-lg disabled:opacity-50">{t('common.previous')}</button></li>
                    <li><button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages} className="px-3 py-2 leading-tight border rounded-e-lg disabled:opacity-50">{t('common.next')}</button></li>
                </ul>
            </nav>
        </div>
    );
};

export default DonorsTable;
