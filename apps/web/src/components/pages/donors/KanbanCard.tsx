import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import type { Donor } from '../../../types';
import type { DonorStageId } from '../../../types';
import { useLocalization } from '../../../hooks/useLocalization';
import { formatCurrency, formatNumber, formatRelativeTime } from '../../../lib/utils';
import { GripVertical } from 'lucide-react';
import type { DonorKanbanStage, KanbanDensity } from './KanbanBoard';

interface KanbanCardProps {
    donor: Donor;
    density?: KanbanDensity;
    stages?: DonorKanbanStage[];
    onMoveDonor?: (donorId: number, targetStageId: DonorStageId) => void;
}

interface KanbanCardShellProps extends KanbanCardProps {
    dragHandle?: React.ReactNode;
    rootRef?: (node: HTMLDivElement | null) => void;
    isDragging?: boolean;
    isDragOverlay?: boolean;
}

const KanbanCardShell: React.FC<KanbanCardShellProps> = ({
    donor,
    density = 'comfortable',
    stages,
    onMoveDonor,
    dragHandle,
    rootRef,
    isDragging = false,
    isDragOverlay = false,
}) => {
    const { t, language } = useLocalization(['common', 'donors']);

    const healthStyles = {
        'Good': {
            border: 'border-emerald-500',
            dot: 'bg-emerald-500',
            chip: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-200 dark:border-emerald-800',
        },
        'Moderate': {
            border: 'border-amber-500',
            dot: 'bg-amber-500',
            chip: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-200 dark:border-amber-800',
        },
        'At Risk': {
            border: 'border-rose-500',
            dot: 'bg-rose-500',
            chip: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-200 dark:border-rose-800',
        },
    };

    const likelihoodStyles = {
        High: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-200 dark:border-emerald-800',
        Medium: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-200 dark:border-amber-800',
        Low: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    };
    
    const stageEnteredAt = donor.stageEnteredAt || donor.lastContact || donor.firstDonation;
    const stageAgeDays = stageEnteredAt
        ? Math.max(0, Math.floor((Date.now() - new Date(stageEnteredAt).getTime()) / 86400000))
        : null;
    const owner = donor.assignedOwner || t('donors.kanban.unassigned');
    const askAmount = donor.suggestedAskAmount ?? donor.potentialGift;
    const isCompact = density === 'compact';
    const openTasks = donor.tasks.filter(task => !task.completed);
    const today = new Date().toISOString().split('T')[0];
    const overdueTasks = openTasks.filter(task => task.dueDate < today);
    const nextTask = openTasks.slice().sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];
    const stageAgeIsStale = stageAgeDays !== null && stageAgeDays > 30;
    const relationshipHealthLabel = t(`donors.health.${donor.relationshipHealth.replace(/\s+/g, '')}`, donor.relationshipHealth);

    const handleMoveChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const targetStageId = e.target.value as DonorStageId;
        if (targetStageId !== donor.stage) {
            onMoveDonor?.(donor.id, targetStageId);
        }
    };

    return (
        <div
            ref={rootRef}
            className={`group flex flex-col rounded-lg border bg-card dark:bg-dark-card ${healthStyles[donor.relationshipHealth].border} ${
                isCompact ? 'space-y-1.5 p-2 shadow-sm' : 'space-y-2.5 p-3 shadow-sm'
            } ${
                isDragOverlay
                    ? 'shadow-2xl ring-2 ring-primary/40 cursor-grabbing'
                    : 'hover:border-primary/60 hover:shadow-md transition-all'
            } ${isDragging ? 'opacity-40' : ''}`}
            aria-label={t('donors.card.ariaLabel', { name: donor.name })}
        >
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 items-center gap-1.5">
                            <span className={`h-2 w-2 shrink-0 rounded-full ${healthStyles[donor.relationshipHealth].dot}`} aria-hidden="true" />
                            <h3 className={`${isCompact ? 'text-[13px]' : 'text-sm'} truncate font-bold text-foreground dark:text-dark-foreground`}>{donor.name}</h3>
                        </div>
                        {!isCompact && (
                            <p className="mt-0.5 truncate text-xs font-medium text-gray-500 dark:text-gray-400">
                                {owner}
                            </p>
                        )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                        {dragHandle}
                    </div>
                </div>

                {isCompact ? (
                    <>
                        <div className="flex items-end justify-between gap-2">
                            <span className="truncate text-sm font-bold text-foreground dark:text-dark-foreground">{formatCurrency(askAmount, language)}</span>
                            <span className={`shrink-0 text-[11px] font-bold ${stageAgeIsStale ? 'text-amber-700 dark:text-amber-300' : 'text-gray-500 dark:text-gray-400'}`}>
                                {stageAgeDays !== null ? t('donors.kanban.daysInStage', { count: formatNumber(stageAgeDays, language) }) : t('common.notAvailable', 'N/A')}
                            </span>
                        </div>
                        <div className="flex items-center justify-between gap-2 text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                            <span className="truncate">{owner}</span>
                            {openTasks.length > 0 && (
                                <span className={overdueTasks.length > 0 ? 'text-rose-600 dark:text-rose-300' : ''}>
                                    {t('donors.card.openTasks')}: {formatNumber(openTasks.length, language)}
                                </span>
                            )}
                        </div>
                    </>
                ) : (
                    <>
                        <div className="rounded-md bg-gray-50 px-2.5 py-2 dark:bg-slate-800/60">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <span className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400">{t('donors.kanban.suggestedAsk')}</span>
                                    <span className="mt-0.5 block text-base font-bold text-foreground dark:text-dark-foreground">{formatCurrency(askAmount, language)}</span>
                                </div>
                                <div className="text-end">
                                    <span className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400">{t('donors.kanban.stageAge')}</span>
                                    <span className={`mt-0.5 block text-sm font-bold ${stageAgeIsStale ? 'text-amber-700 dark:text-amber-300' : 'text-foreground dark:text-dark-foreground'}`}>
                                        {stageAgeDays !== null ? t('donors.kanban.daysInStage', { count: formatNumber(stageAgeDays, language) }) : t('common.notAvailable', 'N/A')}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="rounded-md border border-gray-100 px-2 py-1.5 dark:border-slate-800">
                                <span className="block text-gray-500 dark:text-gray-400">{t('donors.card.potential')}</span>
                                <span className="mt-0.5 block truncate font-bold text-foreground dark:text-dark-foreground">{formatCurrency(donor.potentialGift, language)}</span>
                            </div>
                            <div className="rounded-md border border-gray-100 px-2 py-1.5 dark:border-slate-800">
                                <span className="block text-gray-500 dark:text-gray-400">{t('donors.card.openTasks')}</span>
                                <span className={`mt-0.5 block font-bold ${overdueTasks.length > 0 ? 'text-rose-600 dark:text-rose-300' : 'text-foreground dark:text-dark-foreground'}`}>
                                    {formatNumber(openTasks.length, language)}
                                    {overdueTasks.length > 0 ? ` ${t('donors.card.overdue')}` : ''}
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5">
                            <span className={`rounded-full border px-2 py-0.5 text-[11px] font-bold ${healthStyles[donor.relationshipHealth].chip}`}>
                                {relationshipHealthLabel}
                            </span>
                            {donor.likelihood && (
                                <span className={`rounded-full border px-2 py-0.5 text-[11px] font-bold ${likelihoodStyles[donor.likelihood]}`}>
                                    {t('donors.kanban.likelihood')}: {t(`donors.likelihood.${donor.likelihood}`)}
                                </span>
                            )}
                        </div>

                        {(nextTask || donor.lastContact) && (
                            <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
                                {nextTask && (
                                    <p className="truncate">
                                        <span className="font-semibold text-gray-600 dark:text-gray-300">{t('donors.card.nextTask')}:</span> {nextTask.text}
                                    </p>
                                )}
                                {donor.lastContact && (
                                    <p className="truncate">
                                        {t('donors.kanban.lastContact')}: {formatRelativeTime(donor.lastContact, language)}
                                    </p>
                                )}
                            </div>
                        )}
                    </>
                )}

                {!isCompact && stages && onMoveDonor && (
                    <label className="block">
                        <span className="sr-only">{t('donors.kanban.moveTo')}</span>
                        <select
                            value={donor.stage}
                            onChange={handleMoveChange}
                            onPointerDown={e => e.stopPropagation()}
                            className="w-full rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs font-semibold text-gray-700 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-200"
                            aria-label={t('donors.kanban.moveTo')}
                        >
                            {stages.map(stage => (
                                <option key={stage.id} value={stage.id}>{t(stage.titleKey)}</option>
                            ))}
                        </select>
                    </label>
                )}
        </div>
    );
};

export const KanbanCardOverlay: React.FC<KanbanCardProps> = (props) => (
    <KanbanCardShell
        {...props}
        isDragOverlay
        dragHandle={<div className="rounded-md p-1 text-primary dark:text-secondary"><GripVertical size={16} /></div>}
    />
);

const KanbanCard: React.FC<KanbanCardProps> = (props) => {
    const { donor } = props;
    const { t } = useLocalization(['common', 'donors']);
    const { attributes, listeners, setNodeRef, setActivatorNodeRef, isDragging } = useDraggable({
        id: `donor:${donor.id}`,
        data: { type: 'donor', donorId: donor.id },
    });

    const dragHandle = (
        <button
            type="button"
            ref={setActivatorNodeRef}
            {...attributes}
            {...listeners}
            className="rounded-md p-1 text-gray-400 cursor-grab hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/30 active:cursor-grabbing dark:hover:bg-slate-700 dark:hover:text-gray-200"
            aria-label={t('donors.kanban.dragHandle', { name: donor.name })}
            title={t('donors.kanban.dragHandle', { name: donor.name })}
        >
            <GripVertical size={16} />
        </button>
    );

    return (
        <KanbanCardShell
            {...props}
            rootRef={setNodeRef}
            dragHandle={dragHandle}
            isDragging={isDragging}
        />
    );
};

export default KanbanCard;
