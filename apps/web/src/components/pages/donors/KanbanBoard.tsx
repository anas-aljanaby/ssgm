import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { ArrowLeftToLine, ArrowRightToLine } from 'lucide-react';
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
    railColor: string;
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
    const totalBoard = maxPotential > 0 ? Math.max(1, Math.round((totalPotential / maxPotential) * 100)) : 0;

    return (
        <button
            ref={setNodeRef}
            type="button"
            onClick={() => onJump(stage.id)}
            className={`relative w-[13.5rem] shrink-0 rounded-[10px] border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-3 ps-3.5 text-start transition-colors overflow-hidden hover:border-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                isHighlighted ? 'bg-primary-light/80 ring-2 ring-primary/35 dark:bg-primary/20 dark:ring-secondary/40' : ''
            }`}
            aria-label={t('donors.kanban.jumpToStage', { stage: t(stage.titleKey) })}
        >
            {/* Colored right rail */}
            <span
                className="absolute top-2.5 bottom-2.5 end-0 w-[3px] rounded-s-sm"
                style={{ background: stage.railColor }}
            />
            {/* Row 1: count + label */}
            <span className="flex items-baseline justify-between gap-2">
                <span className="text-[22px] font-bold tabular-nums text-foreground dark:text-dark-foreground leading-none">
                    {formatNumber(donors.length, language)}
                </span>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 truncate">
                    {t(stage.titleKey)}
                </span>
            </span>
            {/* Row 2: bar + value */}
            <span className="mt-2.5 flex items-center justify-between gap-2">
                <span className="flex-1 h-1 overflow-hidden rounded-full bg-gray-100 dark:bg-slate-800" aria-hidden="true">
                    <span
                        className="block h-full rounded-full opacity-80"
                        style={{ width: `${totalBoard}%`, background: stage.railColor }}
                    />
                </span>
                <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500 tabular-nums shrink-0">
                    {formatCurrency(totalPotential, language)}
                </span>
            </span>
        </button>
    );
};

const KanbanBoard: React.FC<KanbanBoardProps> = ({ donors, stages, onDragEnd, density }) => {
    const { t, language, dir } = useLocalization(['common', 'donors']);
    const [activeDonorId, setActiveDonorId] = useState<number | null>(null);
    const [activeStageId, setActiveStageId] = useState<DonorStageId | null>(null);
    const [canScrollRailStart, setCanScrollRailStart] = useState(false);
    const [canScrollRailEnd, setCanScrollRailEnd] = useState(false);
    const [canScrollStart, setCanScrollStart] = useState(false);
    const [canScrollEnd, setCanScrollEnd] = useState(false);
    const stageRailScrollRef = useRef<HTMLDivElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    const checkRailScroll = useCallback(() => {
        const el = stageRailScrollRef.current;
        if (!el) return;
        const maxScroll = el.scrollWidth - el.clientWidth;
        if (maxScroll <= 0) {
            setCanScrollRailStart(false);
            setCanScrollRailEnd(false);
            return;
        }
        const pos = Math.abs(el.scrollLeft);
        setCanScrollRailStart(pos > 4);
        setCanScrollRailEnd(pos < maxScroll - 4);
    }, []);

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
        const el = stageRailScrollRef.current;
        if (!el) return;
        checkRailScroll();
        el.addEventListener('scroll', checkRailScroll, { passive: true });
        const observer = new ResizeObserver(checkRailScroll);
        observer.observe(el);
        return () => {
            el.removeEventListener('scroll', checkRailScroll);
            observer.disconnect();
        };
    }, [checkRailScroll]);

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
    }, [checkScroll]);

    const scrollRailToStart = useCallback(() => {
        const el = stageRailScrollRef.current;
        if (!el) return;
        el.scrollTo({ left: 0, behavior: 'smooth' });
    }, []);

    const scrollRailToEnd = useCallback(() => {
        const el = stageRailScrollRef.current;
        if (!el) return;
        const maxScroll = el.scrollWidth - el.clientWidth;
        const target = dir === 'rtl' ? -maxScroll : maxScroll;
        el.scrollTo({ left: target, behavior: 'smooth' });
    }, [dir]);

    const scrollToStart = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        el.scrollTo({ left: 0, behavior: 'smooth' });
    }, []);

    const scrollToEnd = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        const maxScroll = el.scrollWidth - el.clientWidth;
        const target = dir === 'rtl' ? -maxScroll : maxScroll;
        el.scrollTo({ left: target, behavior: 'smooth' });
    }, [dir]);
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
                <div className="rounded-xl border border-gray-200 bg-white dark:bg-dark-card p-4 dark:border-slate-700">
                    <div className="mb-3.5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <h2 className="text-base font-bold text-foreground dark:text-dark-foreground">
                                {activeDonor ? t('donors.kanban.dropTargetHint') : t('donors.kanban.pipelineMap')}
                            </h2>
                            <p className="mt-1 text-[13px] text-gray-500 dark:text-gray-400 tabular-nums">
                                {t('donors.kanban.visibleDonors', { count: formatNumber(donors.length, language) })}
                                {' · '}
                                <span className="font-semibold text-foreground dark:text-dark-foreground">{formatCurrency(boardStats.totalPotential, language)}</span>
                            </p>
                        </div>
                    </div>
                    <div className="relative">
                        {canScrollRailStart && (
                            <div className="pointer-events-none absolute inset-y-0 start-0 z-10 w-10 bg-gradient-to-r from-white to-transparent dark:from-slate-900 rtl:bg-gradient-to-l" />
                        )}
                        {canScrollRailEnd && (
                            <div className="pointer-events-none absolute inset-y-0 end-0 z-10 w-14 bg-gradient-to-l from-white to-transparent dark:from-slate-900 rtl:bg-gradient-to-r" />
                        )}
                        {canScrollRailStart && (
                            <button
                                type="button"
                                onClick={scrollRailToStart}
                                aria-label={t('donors.kanban.scrollToStart')}
                                title={t('donors.kanban.scrollToStart')}
                                className="absolute start-3 top-1/2 z-20 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-slate-200/85 bg-white/80 text-gray-600 opacity-75 shadow-lg shadow-slate-900/10 backdrop-blur-md transition hover:scale-105 hover:bg-white hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary/30 dark:border-slate-700/80 dark:bg-slate-900/80 dark:text-gray-200 dark:shadow-black/20 rtl:rotate-180"
                            >
                                <ArrowLeftToLine size={16} />
                            </button>
                        )}
                        {canScrollRailEnd && (
                            <button
                                type="button"
                                onClick={scrollRailToEnd}
                                aria-label={t('donors.kanban.scrollToEnd')}
                                title={t('donors.kanban.scrollToEnd')}
                                className="absolute end-3 top-1/2 z-20 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-slate-200/85 bg-white/80 text-gray-600 opacity-75 shadow-lg shadow-slate-900/10 backdrop-blur-md transition hover:scale-105 hover:bg-white hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary/30 dark:border-slate-700/80 dark:bg-slate-900/80 dark:text-gray-200 dark:shadow-black/20 rtl:rotate-180"
                            >
                                <ArrowRightToLine size={16} />
                            </button>
                        )}
                        <div ref={stageRailScrollRef} className="overflow-x-auto overscroll-x-contain pb-2 scroll-smooth">
                            <div className="flex min-w-max items-stretch gap-2.5">
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
                    </div>
                </div>

                <div className="relative mt-3">
                    {canScrollStart && (
                        <div className="pointer-events-none absolute inset-y-0 start-0 z-10 w-10 bg-gradient-to-r from-background to-transparent dark:from-dark-background rtl:bg-gradient-to-l" />
                    )}
                    {canScrollEnd && (
                        <div className="pointer-events-none absolute inset-y-0 end-0 z-10 w-14 bg-gradient-to-l from-background to-transparent dark:from-dark-background rtl:bg-gradient-to-r" />
                    )}
                    {canScrollStart && (
                        <button
                            type="button"
                            onClick={scrollToStart}
                            aria-label={t('donors.kanban.scrollToStart')}
                            title={t('donors.kanban.scrollToStart')}
                            className="absolute start-3 top-1/2 z-20 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-slate-200/85 bg-white/80 text-gray-600 opacity-75 shadow-lg shadow-slate-900/10 backdrop-blur-md transition hover:scale-105 hover:bg-white hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary/30 dark:border-slate-700/80 dark:bg-slate-900/80 dark:text-gray-200 dark:shadow-black/20 rtl:rotate-180"
                        >
                            <ArrowLeftToLine size={16} />
                        </button>
                    )}
                    {canScrollEnd && (
                        <button
                            type="button"
                            onClick={scrollToEnd}
                            aria-label={t('donors.kanban.scrollToEnd')}
                            title={t('donors.kanban.scrollToEnd')}
                            className="absolute end-3 top-1/2 z-20 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-slate-200/85 bg-white/80 text-gray-600 opacity-75 shadow-lg shadow-slate-900/10 backdrop-blur-md transition hover:scale-105 hover:bg-white hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary/30 dark:border-slate-700/80 dark:bg-slate-900/80 dark:text-gray-200 dark:shadow-black/20 rtl:rotate-180"
                        >
                            <ArrowRightToLine size={16} />
                        </button>
                    )}
                    <div ref={scrollRef} className="overflow-x-auto overscroll-x-contain pb-3 scroll-smooth">
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
