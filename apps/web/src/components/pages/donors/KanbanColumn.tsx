import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useLocalization } from '../../../hooks/useLocalization';
import { formatCurrency, formatNumber } from '../../../lib/utils';
import type { Donor, DonorStageId } from '../../../types';
import KanbanCard from './KanbanCard';
import type { DonorKanbanStage, KanbanDensity } from './KanbanBoard';
import { Plus } from 'lucide-react';

interface KanbanColumnProps {
    stage: DonorKanbanStage;
    donors: Donor[];
    onDragEnd: (donorId: number, targetStageId: DonorStageId) => void;
    stages: DonorKanbanStage[];
    density: KanbanDensity;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({ stage, donors, onDragEnd, stages, density }) => {
    const { t, language } = useLocalization(['common', 'donors']);
    const [isFocused, setIsFocused] = useState(false);
    const { isOver, setNodeRef } = useDroppable({
        id: `stage:${stage.id}`,
        data: { type: 'stage', stageId: stage.id },
    });

    const totalPotential = donors.reduce((sum, donor) => sum + donor.potentialGift, 0);
    const isCompact = density === 'compact';
    const isActiveTarget = isOver || isFocused;
    const openTasks = donors.reduce((sum, donor) => sum + donor.tasks.filter(task => !task.completed).length, 0);

    return (
        <div
            ref={setNodeRef}
            id={`kanban-column-${stage.id}`}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className={`h-full flex flex-col rounded-xl overflow-hidden transition-colors ${
                isCompact ? 'min-w-[14rem] max-w-[14rem]' : 'min-w-[17rem] max-w-[17rem]'
            } ${
                isActiveTarget
                    ? 'ring-2 ring-primary/35 dark:ring-secondary/40'
                    : ''
            } bg-[#f3f5f8] dark:bg-slate-900/40`}
        >
            {/* Column header with colored top rail */}
            <div className="relative bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 px-3.5 pt-4 pb-3">
                <span
                    className="absolute top-0 inset-x-0 h-[3px]"
                    style={{ background: stage.railColor }}
                />
                <div className="flex items-center justify-between gap-2">
                    <h2 className={`${isCompact ? 'text-sm' : 'text-[14px]'} font-bold text-foreground dark:text-dark-foreground truncate`}>
                        {t(stage.titleKey)}
                    </h2>
                    <span className="shrink-0 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 px-2 py-0.5 rounded-full tabular-nums">
                        {formatNumber(donors.length, language)}
                    </span>
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                    <span className="font-semibold text-foreground dark:text-dark-foreground tabular-nums">
                        {formatCurrency(totalPotential, language)}
                    </span>
                    <span className="text-gray-300 dark:text-slate-600">·</span>
                    <span>
                        {openTasks > 0
                            ? `${formatNumber(openTasks, language)} ${t('donors.card.openTasks')}`
                            : t('donors.kanban.noTasks', 'لا مهام')}
                    </span>
                </div>
            </div>

            {/* Cards body */}
            <div className={`flex-grow ${isCompact ? 'p-2 space-y-2 min-h-[20rem] max-h-[calc(100vh-22rem)]' : 'p-2.5 space-y-2 min-h-[20rem] max-h-[calc(100vh-20rem)]'} overflow-y-auto`}>
                {donors.map(donor => (
                    <KanbanCard
                        key={donor.id}
                        donor={donor}
                        density={density}
                        stages={stages}
                        onMoveDonor={onDragEnd}
                    />
                ))}
                {donors.length === 0 && (
                    <div className="flex flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-gray-300 dark:border-slate-600 p-6 text-center text-xs text-gray-400 dark:text-gray-500 flex-1 min-h-[100px]">
                        <div className="w-7 h-7 rounded-full bg-white dark:bg-slate-800 border border-dashed border-gray-300 dark:border-slate-600 grid place-items-center">
                            <Plus size={14} className="text-gray-400 dark:text-gray-500" />
                        </div>
                        {t('donors.kanban.emptyColumn')}
                    </div>
                )}
            </div>
        </div>
    );
};

export default KanbanColumn;
