import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import type { Donor } from '../../../types';
import type { DonorStageId } from '../../../types';
import { useLocalization } from '../../../hooks/useLocalization';
import { formatCurrency, formatNumber } from '../../../lib/utils';
import { GripVertical, Clock, ChevronRight, Flag } from 'lucide-react';
import type { DonorKanbanStage, KanbanDensity } from './KanbanBoard';

const AVATAR_PALETTES = [
    { bg: '#e0e7ff', fg: '#3730a3' },
    { bg: '#fef3c7', fg: '#92400e' },
    { bg: '#dcfce7', fg: '#166534' },
    { bg: '#fee2e2', fg: '#991b1b' },
    { bg: '#cffafe', fg: '#155e75' },
];

function getAvatarPalette(name: string) {
    const idx = name.charCodeAt(0) % AVATAR_PALETTES.length;
    return AVATAR_PALETTES[idx];
}

const HEALTH_DOT: Record<string, string> = {
    'Good': 'bg-emerald-500',
    'Moderate': 'bg-amber-500',
    'At Risk': 'bg-rose-500',
};

const HEALTH_BAR_COLOR: Record<string, string> = {
    'Good': 'bg-emerald-500',
    'Moderate': 'bg-amber-500',
    'At Risk': 'bg-rose-500',
};

const HEALTH_BAR_COUNT: Record<string, number> = {
    'Good': 3,
    'Moderate': 2,
    'At Risk': 1,
};

const HEALTH_CHIP_STYLES: Record<string, string> = {
    'Good': 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-200',
    'Moderate': 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-200',
    'At Risk': 'bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-200',
};

const HealthBars: React.FC<{ health: string }> = ({ health }) => {
    const count = HEALTH_BAR_COUNT[health] ?? 1;
    const colorClass = HEALTH_BAR_COLOR[health] ?? 'bg-rose-500';
    return (
        <span className="inline-flex gap-[2px] items-end" aria-hidden="true">
            {[0, 1, 2].map(i => (
                <span
                    key={i}
                    className={`w-[3px] rounded-sm ${
                        i < count ? colorClass : 'bg-gray-200 dark:bg-slate-700'
                    }`}
                    style={{ height: i === 0 ? 6 : i === 1 ? 9 : 12 }}
                />
            ))}
        </span>
    );
};

const DonorAvatar: React.FC<{ name: string; health: string; size: 'sm' | 'md' }> = ({ name, health, size }) => {
    const initial = name.charAt(0).toUpperCase();
    const palette = getAvatarPalette(name);
    return (
        <div className="relative shrink-0">
            <div
                className={`${size === 'sm' ? 'h-[22px] w-[22px] text-[10px]' : 'h-8 w-8 text-[13px]'} rounded-full flex items-center justify-center font-semibold`}
                style={{ background: palette.bg, color: palette.fg }}
            >
                {initial}
            </div>
            <span
                className={`absolute ${size === 'sm' ? '-bottom-0.5 -start-0.5 h-[7px] w-[7px] border-[1.5px]' : '-bottom-0.5 -start-0.5 h-[9px] w-[9px] border-2'} rounded-full border-white dark:border-slate-900 ${HEALTH_DOT[health] ?? 'bg-gray-400'}`}
            />
        </div>
    );
};

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
    dragHandle,
    rootRef,
    isDragging = false,
    isDragOverlay = false,
}) => {
    const { t, language } = useLocalization(['common', 'donors']);
    const isCompact = density === 'compact';

    const stageEnteredAt = donor.stageEnteredAt || donor.lastContact || donor.firstDonation;
    const stageAgeDays = stageEnteredAt
        ? Math.max(0, Math.floor((Date.now() - new Date(stageEnteredAt).getTime()) / 86400000))
        : null;
    const owner = donor.assignedOwner || t('donors.kanban.unassigned');
    const askAmount = donor.suggestedAskAmount ?? donor.potentialGift;
    const openTasks = donor.tasks.filter(task => !task.completed);
    const today = new Date().toISOString().split('T')[0];
    const overdueTasks = openTasks.filter(task => task.dueDate < today);
    const nextTask = openTasks.slice().sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];
    const stageAgeIsStale = stageAgeDays !== null && stageAgeDays > 365;

    const likelihoodLabel = donor.likelihood ? t(`donors.likelihood.${donor.likelihood}`) : '';
    const healthLabel = t(`donors.health.${donor.relationshipHealth.replace(/\s+/g, '')}`, donor.relationshipHealth);

    const currentStage = stages?.find(s => s.id === donor.stage);
    const railColor = currentStage?.railColor || '#94a3b8';

    if (isCompact) {
        return (
            <div
                ref={rootRef}
                className={`group relative rounded-[10px] bg-white dark:bg-dark-card py-2.5 pe-3 ps-3 ${
                    isDragOverlay
                        ? 'shadow-2xl ring-2 ring-primary/40 cursor-grabbing'
                        : 'shadow-[0_1px_0_rgba(15,23,42,0.04),0_1px_2px_rgba(15,23,42,0.03)] hover:shadow-[0_4px_12px_rgba(15,23,42,0.06),0_2px_4px_rgba(15,23,42,0.04)] transition-shadow'
                } ${isDragging ? 'opacity-40' : ''}`}
                aria-label={t('donors.card.ariaLabel', { name: donor.name })}
            >
                {/* Right rail */}
                <span
                    className="absolute top-2.5 bottom-2.5 end-0 w-[3px] rounded-s-sm opacity-85"
                    style={{ background: railColor }}
                />
                {/* Row 1: avatar + name + value */}
                <div className="flex items-center gap-2">
                    <DonorAvatar name={donor.name} health={donor.relationshipHealth} size="sm" />
                    <span className="flex-1 text-[13px] font-semibold truncate text-foreground dark:text-dark-foreground">{donor.name}</span>
                    <span className="text-[13px] font-semibold text-foreground dark:text-dark-foreground tabular-nums shrink-0">
                        {formatCurrency(askAmount, language)}
                    </span>
                    {dragHandle}
                </div>
                {/* Row 2: meta */}
                <div className="mt-2 pt-2 border-t border-dashed border-gray-100 dark:border-slate-800 flex items-center gap-2.5 text-[11px] text-gray-500 dark:text-gray-400">
                    {stageAgeDays !== null && (
                        <span className={`inline-flex items-center gap-1 tabular-nums ${stageAgeIsStale ? 'text-amber-600 dark:text-amber-400 font-semibold' : ''}`}>
                            <Clock size={10} className="text-gray-400 dark:text-gray-500" />
                            {formatNumber(stageAgeDays, language)} {t('donors.kanban.days', 'يوم')}
                        </span>
                    )}
                    {overdueTasks.length > 0 && (
                        <span className="inline-flex items-center gap-1 font-semibold text-rose-600 dark:text-rose-400">
                            <Flag size={10} />
                            <span className="tabular-nums">{formatNumber(overdueTasks.length, language)}</span>
                            {t('donors.card.overdue')}
                        </span>
                    )}
                    {openTasks.length > 0 && overdueTasks.length === 0 && (
                        <span className="inline-flex items-center gap-1">
                            <Flag size={10} className="text-gray-400 dark:text-gray-500" />
                            <span className="tabular-nums">{formatNumber(openTasks.length, language)}</span>
                            {t('donors.card.openTasks')}
                        </span>
                    )}
                    <span className="inline-flex items-center gap-1.5">
                        <HealthBars health={donor.relationshipHealth} />
                        <span className="font-medium">{likelihoodLabel}</span>
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div
            ref={rootRef}
            className={`group relative flex flex-col rounded-[10px] bg-white dark:bg-dark-card p-3 pe-3.5 ${
                isDragOverlay
                    ? 'shadow-2xl ring-2 ring-primary/40 cursor-grabbing'
                    : 'shadow-[0_1px_0_rgba(15,23,42,0.04),0_1px_2px_rgba(15,23,42,0.03)] hover:shadow-[0_4px_12px_rgba(15,23,42,0.06),0_2px_4px_rgba(15,23,42,0.04)] transition-shadow'
            } ${isDragging ? 'opacity-40' : ''}`}
            aria-label={t('donors.card.ariaLabel', { name: donor.name })}
        >
            {/* Right rail */}
            <span
                className="absolute top-2.5 bottom-2.5 end-0 w-[3px] rounded-s-sm opacity-85"
                style={{ background: railColor }}
            />

            {/* Header: avatar + name/owner + drag */}
            <div className="flex items-center gap-2.5">
                <DonorAvatar name={donor.name} health={donor.relationshipHealth} size="md" />
                <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-foreground dark:text-dark-foreground leading-tight truncate">{donor.name}</div>
                    <div className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5 truncate">{owner}</div>
                </div>
                {dragHandle}
            </div>

            {/* 3-column stats */}
            <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-slate-800">
                <div className="flex flex-col gap-0.5">
                    <span className="text-[10.5px] text-gray-400 dark:text-gray-500 font-medium">{t('donors.kanban.suggestedAsk')}</span>
                    <span className="text-sm font-semibold text-foreground dark:text-dark-foreground tabular-nums">{formatCurrency(askAmount, language)}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                    <span className="text-[10.5px] text-gray-400 dark:text-gray-500 font-medium">{t('donors.kanban.stageAge')}</span>
                    <span className={`text-sm font-semibold tabular-nums ${stageAgeIsStale ? 'text-amber-600 dark:text-amber-400' : 'text-foreground dark:text-dark-foreground'}`}>
                        {stageAgeDays !== null ? `${formatNumber(stageAgeDays, language)} ${t('donors.kanban.days', 'يوم')}` : t('common.notAvailable', 'N/A')}
                    </span>
                </div>
                <div className="flex flex-col gap-0.5">
                    <span className="text-[10.5px] text-gray-400 dark:text-gray-500 font-medium">{t('donors.card.openTasks')}</span>
                    <span className={`text-sm font-semibold tabular-nums inline-flex items-center gap-1.5 ${overdueTasks.length > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-foreground dark:text-dark-foreground'}`}>
                        {formatNumber(openTasks.length, language)}
                        {overdueTasks.length > 0 && (
                            <span className="text-[10px] font-semibold bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 px-1.5 py-px rounded-md">{t('donors.card.overdue')}</span>
                        )}
                    </span>
                </div>
            </div>

            {/* Tags: health chip + probability bars */}
            <div className="flex flex-wrap items-center gap-2 mt-2.5">
                <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${HEALTH_CHIP_STYLES[donor.relationshipHealth] ?? 'bg-gray-100 text-gray-600'}`}>
                    {healthLabel}
                </span>
                <span className="inline-flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400">
                    <HealthBars health={donor.relationshipHealth} />
                    <span className="font-medium">{likelihoodLabel}</span>
                </span>
            </div>

            {/* Footer: next task + details */}
            <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-dashed border-gray-100 dark:border-slate-800">
                {nextTask ? (
                    <div className="flex items-center gap-1.5 min-w-0 text-[11.5px]">
                        <span className="shrink-0 bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400 text-[10px] font-semibold px-1.5 py-px rounded">{t('donors.card.nextTask')}</span>
                        <span className="truncate font-medium text-foreground dark:text-dark-foreground">{nextTask.text}</span>
                    </div>
                ) : <span />}
                <div className="flex items-center gap-1 shrink-0">
                    <button
                        type="button"
                        className="px-2.5 py-1 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-foreground dark:hover:text-dark-foreground hover:bg-gray-50 dark:hover:bg-slate-800 rounded-md transition-colors"
                    >
                        {t('donors.card.details', 'تفاصيل')}
                    </button>
                    <button
                        type="button"
                        className="p-1 text-gray-400 dark:text-gray-500 hover:text-foreground dark:hover:text-dark-foreground hover:bg-gray-50 dark:hover:bg-slate-800 rounded-md transition-colors"
                    >
                        <ChevronRight size={14} className="rtl:rotate-180" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export const KanbanCardOverlay: React.FC<KanbanCardProps> = (props) => (
    <KanbanCardShell
        {...props}
        isDragOverlay
        dragHandle={
            props.density === 'compact' ? undefined :
            <div className="rounded-md p-1 text-gray-300 dark:text-gray-600"><GripVertical size={14} /></div>
        }
    />
);

const KanbanCard: React.FC<KanbanCardProps> = (props) => {
    const { donor, density } = props;
    const isCompact = density === 'compact';
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
            className={`rounded-md text-gray-300 dark:text-gray-600 cursor-grab hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-500 dark:hover:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 active:cursor-grabbing ${
                isCompact ? 'p-0.5 opacity-0 group-hover:opacity-100 transition-opacity' : 'p-1'
            }`}
            aria-label={t('donors.kanban.dragHandle', { name: donor.name })}
            title={t('donors.kanban.dragHandle', { name: donor.name })}
        >
            <GripVertical size={isCompact ? 12 : 14} />
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
