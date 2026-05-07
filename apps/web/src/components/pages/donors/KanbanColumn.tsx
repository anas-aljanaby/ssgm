import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useLocalization } from '../../../hooks/useLocalization';
import { formatCurrency, formatNumber } from '../../../lib/utils';
import type { Donor, DonorStageId } from '../../../types';
import KanbanCard from './KanbanCard';
import type { DonorKanbanStage, KanbanDensity } from './KanbanBoard';

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
            className={`h-full flex flex-col rounded-xl border transition-colors ${
                isCompact ? 'min-w-[12.5rem] max-w-[12.5rem]' : 'min-w-[18rem] max-w-[18rem]'
            } ${
                isActiveTarget
                    ? 'border-primary bg-primary-light/50 shadow-inner dark:border-secondary dark:bg-primary/20'
                    : 'border-gray-200 bg-white/55 dark:border-slate-800 dark:bg-slate-900/30'
            }`}
        >
            <div className={`${isCompact ? 'p-2.5' : 'p-3'} sticky top-0 z-10 rounded-t-xl border-t-4 border-b border-gray-200 bg-white/95 backdrop-blur dark:border-slate-700 dark:bg-slate-900/95 ${stage.border}`}>
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <h2 className={`${isCompact ? 'text-sm' : 'text-base'} font-bold text-foreground dark:text-dark-foreground truncate`}>{t(stage.titleKey)}</h2>
                        <p className={`${isCompact ? 'mt-0.5' : 'mt-1'} text-xs font-semibold text-gray-500 dark:text-gray-400 truncate`}>
                            {formatCurrency(totalPotential, language)}
                        </p>
                    </div>
                    <div className="text-end">
                        <span className={`${isCompact ? 'text-lg' : 'text-xl'} block font-bold leading-none text-foreground dark:text-dark-foreground`}>
                            {formatNumber(donors.length, language)}
                        </span>
                        {!isCompact && (
                            <span className="mt-1 block whitespace-nowrap text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                                {t('donors.card.openTasks')}: {formatNumber(openTasks, language)}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className={`flex-grow ${isCompact ? 'p-1.5 space-y-1.5 min-h-[24rem] max-h-[calc(100vh-22rem)]' : 'p-2.5 space-y-2.5 min-h-[28rem] max-h-[calc(100vh-20rem)]'} overflow-y-auto rounded-b-xl bg-gray-50/80 dark:bg-dark-background/40`}>
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
                    <div className="rounded-lg border border-dashed border-gray-300 p-4 text-center text-sm text-gray-500 dark:border-slate-700 dark:text-gray-400">
                        {t('donors.kanban.emptyColumn')}
                    </div>
                )}
            </div>
        </div>
    );
};

export default KanbanColumn;
