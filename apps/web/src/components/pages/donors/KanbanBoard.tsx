import React, { useCallback, useMemo, useState } from 'react';
import {
    closestCenter,
    type CollisionDetection,
    DndContext,
    DragOverlay,
    KeyboardSensor,
    PointerSensor,
    pointerWithin,
    rectIntersection,
    useDroppable,
    useSensor,
    useSensors,
    type DragEndEvent,
    type DragOverEvent,
    type DragStartEvent,
} from '@dnd-kit/core';
import { useLocalization } from '../../../hooks/useLocalization';
import { formatCurrency, formatNumber } from '../../../lib/utils';
import type { Donor, DonorStageId } from '../../../types';
import KanbanColumn from './KanbanColumn';
import { KanbanCardOverlay } from './KanbanCard';

export interface DonorKanbanStage {
    id: DonorStageId;
    titleKey: string;
    color: string;
    border: string;
}

export type KanbanDensity = 'compact' | 'comfortable';

interface KanbanBoardProps {
    donors: Donor[];
    stages: DonorKanbanStage[];
    onDragEnd: (donorId: number, targetStageId: DonorStageId) => void;
    density: KanbanDensity;
}

interface StageRailTargetProps {
    stage: DonorKanbanStage;
    donors: Donor[];
    isActive: boolean;
    maxCount: number;
    maxPotential: number;
    onJump: (stageId: DonorStageId) => void;
}

const getStageIdFromEvent = (event: DragOverEvent | DragEndEvent): DonorStageId | null => {
    const stageId = event.over?.data.current?.stageId;
    return typeof stageId === 'string' ? stageId as DonorStageId : null;
};

const stageCollisionDetection: CollisionDetection = (args) => {
    const pointerCollisions = pointerWithin(args);
    if (pointerCollisions.length > 0) return pointerCollisions;

    const intersecting = rectIntersection(args);
    if (intersecting.length > 0) return intersecting;

    return closestCenter(args);
};

const StageRailTarget: React.FC<StageRailTargetProps> = ({ stage, donors, isActive, maxCount, maxPotential, onJump }) => {
    const { t, language } = useLocalization(['common', 'donors']);
    const { isOver, setNodeRef } = useDroppable({
        id: `stage-rail:${stage.id}`,
        data: { type: 'stage', stageId: stage.id },
    });
    const totalPotential = donors.reduce((sum, donor) => sum + donor.potentialGift, 0);
    const isHighlighted = isActive || isOver;
    const countShare = donors.length > 0 && maxCount > 0 ? Math.max(8, Math.round((donors.length / maxCount) * 100)) : 0;
    const valueShare = totalPotential > 0 && maxPotential > 0 ? Math.max(8, Math.round((totalPotential / maxPotential) * 100)) : 0;

    return (
        <button
            ref={setNodeRef}
            type="button"
            onClick={() => onJump(stage.id)}
            className={`min-w-0 rounded-lg border border-t-4 bg-white px-2.5 py-2.5 text-start transition-colors hover:border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/30 dark:bg-slate-900 dark:hover:bg-slate-800 ${stage.border} ${
                isHighlighted ? 'bg-primary-light/80 ring-2 ring-primary/35 dark:bg-primary/20 dark:ring-secondary/40' : ''
            }`}
            aria-label={t('donors.kanban.jumpToStage', { stage: t(stage.titleKey) })}
        >
            <span className="flex items-start justify-between gap-2">
                <span className="min-w-0">
                    <span className="block truncate text-xs font-bold text-foreground dark:text-dark-foreground">{t(stage.titleKey)}</span>
                    <span className="mt-0.5 block truncate text-[11px] font-medium text-gray-500 dark:text-gray-400">
                        {formatCurrency(totalPotential, language)}
                    </span>
                </span>
                <span className="shrink-0 rounded-full bg-gray-100 px-1.5 py-0.5 text-[11px] font-bold text-gray-600 dark:bg-slate-800 dark:text-gray-300">
                    {formatNumber(donors.length, language)}
                </span>
            </span>
            <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-slate-800" aria-hidden="true">
                <span className="block h-full rounded-full bg-primary/70 dark:bg-secondary/70" style={{ width: `${countShare}%` }} />
            </span>
            <span className="mt-1 block h-1 overflow-hidden rounded-full bg-gray-100 dark:bg-slate-800" aria-hidden="true">
                <span className="block h-full rounded-full bg-gray-300 dark:bg-slate-600" style={{ width: `${valueShare}%` }} />
            </span>
        </button>
    );
};

const KanbanBoard: React.FC<KanbanBoardProps> = ({ donors, stages, onDragEnd, density }) => {
    const { t, language } = useLocalization(['common', 'donors']);
    const [activeDonorId, setActiveDonorId] = useState<number | null>(null);
    const [activeStageId, setActiveStageId] = useState<DonorStageId | null>(null);
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 6 },
        }),
        useSensor(KeyboardSensor)
    );

    const donorsByStage = useMemo(() => {
        const grouped = new Map<DonorStageId, Donor[]>();
        stages.forEach(stage => grouped.set(stage.id, []));
        donors.forEach(donor => {
            grouped.get(donor.stage)?.push(donor);
        });
        return grouped;
    }, [donors, stages]);

    const boardStats = useMemo(() => {
        const stageCounts = stages.map(stage => donorsByStage.get(stage.id)?.length || 0);
        const stagePotentials = stages.map(stage => (donorsByStage.get(stage.id) || []).reduce((sum, donor) => sum + donor.potentialGift, 0));

        return {
            totalPotential: donors.reduce((sum, donor) => sum + donor.potentialGift, 0),
            maxStageCount: Math.max(1, ...stageCounts),
            maxStagePotential: Math.max(1, ...stagePotentials),
        };
    }, [donors, donorsByStage, stages]);

    const activeDonor = useMemo(
        () => donors.find(donor => donor.id === activeDonorId) || null,
        [activeDonorId, donors]
    );

    const handleDragStart = useCallback((event: DragStartEvent) => {
        const donorId = event.active.data.current?.donorId;
        setActiveDonorId(typeof donorId === 'number' ? donorId : null);
    }, []);

    const handleDragOver = useCallback((event: DragOverEvent) => {
        setActiveStageId(getStageIdFromEvent(event));
    }, []);

    const handleDragCancel = useCallback(() => {
        setActiveDonorId(null);
        setActiveStageId(null);
    }, []);

    const handleDragComplete = useCallback((event: DragEndEvent) => {
        const donorId = event.active.data.current?.donorId;
        const targetStageId = getStageIdFromEvent(event);

        if (typeof donorId === 'number' && targetStageId) {
            onDragEnd(donorId, targetStageId);
        }

        setActiveDonorId(null);
        setActiveStageId(null);
    }, [onDragEnd]);

    const jumpToStage = useCallback((stageId: DonorStageId) => {
        document.getElementById(`kanban-column-${stageId}`)?.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'start',
        });
    }, []);

    return (
        <div className="flex-grow pb-4">
            <DndContext
                sensors={sensors}
                collisionDetection={stageCollisionDetection}
                autoScroll
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragCancel={handleDragCancel}
                onDragEnd={handleDragComplete}
            >
                <div className="rounded-xl border border-gray-200 bg-card/95 p-3 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-dark-card/95">
                    <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <span className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">
                                {activeDonor ? t('donors.kanban.dropTargetHint') : t('donors.kanban.pipelineMap')}
                            </span>
                            <p className="mt-0.5 text-xs font-medium text-gray-500 dark:text-gray-400">
                                {t('donors.kanban.visibleDonors', { count: formatNumber(donors.length, language) })}
                            </p>
                        </div>
                        <div className="flex items-center gap-3 text-xs font-semibold text-gray-500 dark:text-gray-400">
                            <span>{t('donors.kanban.filteredValue')}: {formatCurrency(boardStats.totalPotential, language)}</span>
                            <span>{t(`donors.kanban.density.${density}`)}</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 lg:grid-cols-4 2xl:grid-cols-8">
                        {stages.map(stage => (
                            <StageRailTarget
                                key={stage.id}
                                stage={stage}
                                donors={donorsByStage.get(stage.id) || []}
                                isActive={activeStageId === stage.id}
                                maxCount={boardStats.maxStageCount}
                                maxPotential={boardStats.maxStagePotential}
                                onJump={jumpToStage}
                            />
                        ))}
                    </div>
                </div>

                <div className="mt-3 overflow-x-auto overscroll-x-contain pb-3 scroll-smooth">
                    <div className={`flex min-w-max items-stretch ${density === 'compact' ? 'gap-2' : 'gap-3'}`}>
                        {stages.map(stage => (
                            <KanbanColumn
                                key={stage.id}
                                stage={stage}
                                donors={donorsByStage.get(stage.id) || []}
                                stages={stages}
                                density={density}
                                onDragEnd={onDragEnd}
                            />
                        ))}
                    </div>
                </div>

                <DragOverlay dropAnimation={{ duration: 160, easing: 'cubic-bezier(0.2, 0, 0, 1)' }}>
                    {activeDonor ? (
                        <KanbanCardOverlay donor={activeDonor} density={density} />
                    ) : null}
                </DragOverlay>
            </DndContext>
        </div>
    );
};

export default KanbanBoard;
