import React, { useState } from 'react';
import { Check, CheckCircle2, ListTodo, MessageSquare, Pencil, Plus, Trash2, X } from 'lucide-react';
import { INTERACTION_TYPES, TASK_TYPES } from '@gms/shared';
import type { DonorProfileInteraction, DonorProfileTask } from '../../../../types';
import { useLocalization } from '../../../../hooks/useLocalization';
import { formatDate, formatNumber, formatRelativeFromEvent } from '../../../../lib/utils';
import { EmptyPanel, Section } from './profileUi';

interface DonorRelationshipActivityTabProps {
    tasks: DonorProfileTask[];
    interactions: DonorProfileInteraction[];
    isLoading?: boolean;
    isLoggingInteraction?: boolean;
    highlightedInteractionId?: string | null;
    onCreateTask?: (task: { text: string; type: string; assignedTo: string; dueDate: string }) => Promise<void> | void;
    onUpdateTask?: (taskId: string, task: { text: string; type: string; assignedTo: string; dueDate: string }) => Promise<void> | void;
    onToggleTask?: (taskId: string, completed: boolean) => Promise<void> | void;
    onDeleteTask?: (taskId: string) => Promise<void> | void;
    onUpdateInteraction?: (interactionId: string, interaction: { type: string; date: string; subject: string; status: string; notes: string }) => Promise<void> | void;
    onDeleteInteraction?: (interactionId: string) => Promise<void> | void;
}

interface TaskDraft {
    text: string;
    type: string;
    assignedTo: string;
    dueDate: string;
}

interface InteractionDraft {
    type: string;
    date: string;
    subject: string;
    status: string;
    notes: string;
}

const toDateInputValue = (value?: string | null) => {
    if (!value) return new Date().toISOString().split('T')[0];
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? new Date().toISOString().split('T')[0] : date.toISOString().split('T')[0];
};

const taskToDraft = (task: DonorProfileTask): TaskDraft => ({
    text: task.text,
    type: task.type,
    assignedTo: task.assigned_to || '',
    dueDate: toDateInputValue(task.due_date),
});

const interactionToDraft = (interaction: DonorProfileInteraction): InteractionDraft => ({
    type: interaction.interaction_type,
    date: toDateInputValue(interaction.occurred_at),
    subject: interaction.subject,
    status: interaction.status || 'logged',
    notes: interaction.notes || '',
});

const iconButtonClass = 'inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 text-gray-500 transition-colors hover:bg-gray-100 hover:text-foreground dark:border-slate-600 dark:hover:bg-slate-700 dark:hover:text-dark-foreground';
const isOptimisticInteraction = (id: string) => id.startsWith('optimistic-interaction-');

const DonorRelationshipActivityTab: React.FC<DonorRelationshipActivityTabProps> = ({
    tasks,
    interactions,
    isLoading,
    isLoggingInteraction,
    highlightedInteractionId,
    onCreateTask,
    onUpdateTask,
    onToggleTask,
    onDeleteTask,
    onUpdateInteraction,
    onDeleteInteraction,
}) => {
    const { t, language } = useLocalization(['common', 'individual_donors', 'donors']);
    const [taskText, setTaskText] = useState('');
    const [taskType, setTaskType] = useState<string>('Follow-up');
    const [assignedTo, setAssignedTo] = useState('');
    const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
    const [isCreatingTask, setIsCreatingTask] = useState(false);
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
    const [taskDraft, setTaskDraft] = useState<TaskDraft>({ text: '', type: 'Follow-up', assignedTo: '', dueDate: new Date().toISOString().split('T')[0] });
    const [editingInteractionId, setEditingInteractionId] = useState<string | null>(null);
    const [interactionDraft, setInteractionDraft] = useState<InteractionDraft>({ type: 'note', date: new Date().toISOString().split('T')[0], subject: '', status: 'logged', notes: '' });
    const [savingId, setSavingId] = useState<string | null>(null);
    const openTasks = tasks.filter((task) => !task.completed);
    const completedTasks = tasks.filter((task) => task.completed);
    const today = new Date().toISOString().split('T')[0];

    const handleCreateTask = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!taskText.trim() || !onCreateTask) return;

        setIsCreatingTask(true);
        try {
            await onCreateTask({ text: taskText.trim(), type: taskType, assignedTo: assignedTo.trim(), dueDate });
            setTaskText('');
            setAssignedTo('');
            setDueDate(new Date().toISOString().split('T')[0]);
        } finally {
            setIsCreatingTask(false);
        }
    };

    const startTaskEdit = (task: DonorProfileTask) => {
        setEditingTaskId(task.id);
        setTaskDraft(taskToDraft(task));
    };

    const saveTaskEdit = async (taskId: string) => {
        if (!taskDraft.text.trim() || !onUpdateTask) return;
        setSavingId(taskId);
        try {
            await onUpdateTask(taskId, {
                text: taskDraft.text.trim(),
                type: taskDraft.type,
                assignedTo: taskDraft.assignedTo.trim(),
                dueDate: taskDraft.dueDate,
            });
            setEditingTaskId(null);
        } finally {
            setSavingId(null);
        }
    };

    const deleteTask = async (taskId: string) => {
        if (!onDeleteTask || !window.confirm(t('individual_donors.detailView.deleteTaskConfirm', 'Delete this task?'))) return;
        setSavingId(taskId);
        try {
            await onDeleteTask(taskId);
            if (editingTaskId === taskId) setEditingTaskId(null);
        } finally {
            setSavingId(null);
        }
    };

    const startInteractionEdit = (interaction: DonorProfileInteraction) => {
        setEditingInteractionId(interaction.id);
        setInteractionDraft(interactionToDraft(interaction));
    };

    const saveInteractionEdit = async (interactionId: string) => {
        if (!interactionDraft.subject.trim() || !onUpdateInteraction) return;
        setSavingId(interactionId);
        try {
            await onUpdateInteraction(interactionId, {
                type: interactionDraft.type,
                date: interactionDraft.date,
                subject: interactionDraft.subject.trim(),
                status: interactionDraft.status.trim() || 'logged',
                notes: interactionDraft.notes.trim(),
            });
            setEditingInteractionId(null);
        } finally {
            setSavingId(null);
        }
    };

    const deleteInteraction = async (interactionId: string) => {
        if (!onDeleteInteraction || !window.confirm(t('individual_donors.detailView.deleteInteractionConfirm', 'Delete this interaction?'))) return;
        setSavingId(interactionId);
        try {
            await onDeleteInteraction(interactionId);
            if (editingInteractionId === interactionId) setEditingInteractionId(null);
        } finally {
            setSavingId(null);
        }
    };

    const renderTask = (task: DonorProfileTask) => {
        const isEditing = editingTaskId === task.id;
        const isSaving = savingId === task.id;

        if (isEditing) {
            return (
                <div key={task.id} className="rounded-lg border border-primary/30 bg-white p-4 dark:bg-slate-900/50">
                    <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(140px,0.65fr)_minmax(140px,0.65fr)_minmax(140px,0.65fr)]">
                        <label className="min-w-0">
                            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">{t('individual_donors.detailView.taskDescription', 'Description')}</span>
                            <input value={taskDraft.text} onChange={(event) => setTaskDraft((draft) => ({ ...draft, text: event.target.value }))} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold dark:border-slate-600 dark:bg-slate-900" />
                        </label>
                        <label className="min-w-0">
                            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">{t('individual_donors.modals.log_interaction.type')}</span>
                            <select value={taskDraft.type} onChange={(event) => setTaskDraft((draft) => ({ ...draft, type: event.target.value }))} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold dark:border-slate-600 dark:bg-slate-900">
                                {TASK_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                            </select>
                        </label>
                        <label className="min-w-0">
                            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">{t('individual_donors.columns.owner')}</span>
                            <input value={taskDraft.assignedTo} onChange={(event) => setTaskDraft((draft) => ({ ...draft, assignedTo: event.target.value }))} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold dark:border-slate-600 dark:bg-slate-900" />
                        </label>
                        <label className="min-w-0">
                            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">{t('donors.card.due')}</span>
                            <input type="date" value={taskDraft.dueDate} onChange={(event) => setTaskDraft((draft) => ({ ...draft, dueDate: event.target.value }))} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold dark:border-slate-600 dark:bg-slate-900" />
                        </label>
                    </div>
                    <div className="mt-3 flex flex-wrap justify-end gap-2">
                        <button onClick={() => saveTaskEdit(task.id)} disabled={!taskDraft.text.trim() || isSaving} className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60">
                            <Check size={14} /> {isSaving ? t('common.loading') : t('common.save')}
                        </button>
                        <button onClick={() => setEditingTaskId(null)} disabled={isSaving} className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-xs font-bold hover:bg-gray-100 disabled:opacity-60 dark:border-slate-600 dark:hover:bg-slate-700">
                            <X size={14} /> {t('common.cancel')}
                        </button>
                        {onDeleteTask && (
                            <button onClick={() => deleteTask(task.id)} disabled={isSaving} className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-60 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-900/20">
                                <Trash2 size={14} /> {t('common.delete', 'Delete')}
                            </button>
                        )}
                    </div>
                </div>
            );
        }

        return (
            <div
                key={task.id}
                className={`flex min-w-0 flex-col justify-between gap-3 rounded-lg border p-4 sm:flex-row sm:items-start ${
                    task.completed
                        ? 'border-gray-100 bg-gray-50/80 dark:border-slate-800 dark:bg-slate-900/40'
                        : 'border-gray-200 dark:border-slate-700'
                }`}
            >
                <div className="min-w-0">
                    <p className={`break-words font-bold ${task.completed ? 'text-gray-600 dark:text-gray-300' : 'text-foreground dark:text-dark-foreground'}`}>{task.text}</p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{task.type} / {task.assigned_to || 'Unassigned'}</p>
                </div>
                <div className="flex flex-shrink-0 flex-wrap items-center gap-2">
                    <span className={`inline-flex w-fit rounded-full px-2 py-1 text-xs font-bold ${task.due_date && task.due_date < today ? 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-300' : 'bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-gray-300'}`}>
                        {task.due_date ? formatDate(task.due_date, language) : 'N/A'}
                    </span>
                    {onUpdateTask && (
                        <button onClick={() => startTaskEdit(task)} className={iconButtonClass} aria-label={t('common.edit', 'Edit')}>
                            <Pencil size={14} />
                        </button>
                    )}
                    {onToggleTask && (
                        <button onClick={() => onToggleTask(task.id, !task.completed)} className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-bold hover:bg-gray-100 dark:border-slate-600 dark:hover:bg-slate-700">
                            <CheckCircle2 size={14} /> {task.completed ? t('common.reopen', 'Reopen') : t('common.complete', 'Complete')}
                        </button>
                    )}
                    {onDeleteTask && (
                        <button onClick={() => deleteTask(task.id)} className={`${iconButtonClass} hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:hover:border-red-800 dark:hover:bg-red-900/20 dark:hover:text-red-300`} aria-label={t('common.delete', 'Delete')}>
                            <Trash2 size={14} />
                        </button>
                    )}
                </div>
            </div>
        );
    };

    const renderInteraction = (interaction: DonorProfileInteraction) => {
        const isEditing = editingInteractionId === interaction.id;
        const isSaving = savingId === interaction.id;
        const isOptimistic = isOptimisticInteraction(interaction.id);

        if (isEditing) {
            return (
                <div key={interaction.id} className="rounded-lg border border-primary/30 bg-white p-4 dark:bg-slate-900/50">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                        <label className="min-w-0">
                            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">{t('individual_donors.modals.log_interaction.type')}</span>
                            <select value={interactionDraft.type} onChange={(event) => setInteractionDraft((draft) => ({ ...draft, type: event.target.value }))} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold dark:border-slate-600 dark:bg-slate-900">
                                {INTERACTION_TYPES.map((type) => <option key={type} value={type}>{t(`individual_donors.modals.log_interaction.types.${type}`, type)}</option>)}
                            </select>
                        </label>
                        <label className="min-w-0">
                            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">{t('individual_donors.modals.log_interaction.date')}</span>
                            <input type="date" value={interactionDraft.date} onChange={(event) => setInteractionDraft((draft) => ({ ...draft, date: event.target.value }))} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold dark:border-slate-600 dark:bg-slate-900" />
                        </label>
                        <label className="min-w-0">
                            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">{t('individual_donors.detailView.status', 'Status')}</span>
                            <input value={interactionDraft.status} onChange={(event) => setInteractionDraft((draft) => ({ ...draft, status: event.target.value }))} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold dark:border-slate-600 dark:bg-slate-900" />
                        </label>
                        <label className="min-w-0 md:col-span-2 xl:col-span-1">
                            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">{t('individual_donors.modals.log_interaction.subject')}</span>
                            <input value={interactionDraft.subject} onChange={(event) => setInteractionDraft((draft) => ({ ...draft, subject: event.target.value }))} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold dark:border-slate-600 dark:bg-slate-900" />
                        </label>
                        <label className="min-w-0 md:col-span-2 xl:col-span-4">
                            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">{t('individual_donors.modals.log_interaction.notes')}</span>
                            <textarea value={interactionDraft.notes} onChange={(event) => setInteractionDraft((draft) => ({ ...draft, notes: event.target.value }))} rows={3} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900" />
                        </label>
                    </div>
                    <div className="mt-3 flex flex-wrap justify-end gap-2">
                        <button onClick={() => saveInteractionEdit(interaction.id)} disabled={!interactionDraft.subject.trim() || isSaving} className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60">
                            <Check size={14} /> {isSaving ? t('common.loading') : t('common.save')}
                        </button>
                        <button onClick={() => setEditingInteractionId(null)} disabled={isSaving} className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-xs font-bold hover:bg-gray-100 disabled:opacity-60 dark:border-slate-600 dark:hover:bg-slate-700">
                            <X size={14} /> {t('common.cancel')}
                        </button>
                        {onDeleteInteraction && (
                            <button onClick={() => deleteInteraction(interaction.id)} disabled={isSaving} className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-60 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-900/20">
                                <Trash2 size={14} /> {t('common.delete', 'Delete')}
                            </button>
                        )}
                    </div>
                </div>
            );
        }

        return (
            <div
                key={interaction.id}
                className={`rounded-lg border p-4 ${
                    isOptimistic
                        ? 'border-blue-200 bg-blue-50/70 opacity-75 animate-pulse dark:border-blue-800/60 dark:bg-blue-950/20'
                        : highlightedInteractionId === interaction.id
                            ? 'border-emerald-200 bg-emerald-50/80 ring-1 ring-inset ring-emerald-200/80 dark:border-emerald-800/60 dark:bg-emerald-950/20 dark:ring-emerald-800/60'
                            : 'border-gray-200 dark:border-slate-700'
                }`}
            >
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                        <p className="break-words font-bold text-foreground dark:text-dark-foreground">{interaction.subject}</p>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            {interaction.interaction_type} / {isOptimistic ? t('individual_donors.detailView.interactionSaving', 'Saving...') : interaction.status}
                        </p>
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-2">
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">{interaction.occurred_at ? formatRelativeFromEvent(interaction.occurred_at, language) : 'N/A'}</span>
                        {onUpdateInteraction && !isOptimistic && (
                            <button onClick={() => startInteractionEdit(interaction)} className={iconButtonClass} aria-label={t('common.edit', 'Edit')}>
                                <Pencil size={14} />
                            </button>
                        )}
                        {onDeleteInteraction && !isOptimistic && (
                            <button onClick={() => deleteInteraction(interaction.id)} className={`${iconButtonClass} hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:hover:border-red-800 dark:hover:bg-red-900/20 dark:hover:text-red-300`} aria-label={t('common.delete', 'Delete')}>
                                <Trash2 size={14} />
                            </button>
                        )}
                    </div>
                </div>
                {interaction.notes && <p className="mt-3 break-words text-sm text-gray-600 dark:text-gray-300">{interaction.notes}</p>}
            </div>
        );
    };

    const hasAnyTasks = openTasks.length > 0 || completedTasks.length > 0;
    const subsectionTitle = (label: string, count: number) =>
        count > 0 ? `${label} (${formatNumber(count, language)})` : label;

    const TaskSubsection: React.FC<{ title: string; children: React.ReactNode; showDivider?: boolean }> = ({ title, children, showDivider }) => (
        <div className={showDivider ? 'border-t border-gray-200 pt-5 dark:border-slate-700' : ''}>
            <div className="mb-3 flex items-center gap-2">
                <h4 className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">{title}</h4>
            </div>
            {children}
        </div>
    );

    return (
        <div className="space-y-5">
            <Section title={t('individual_donors.detailView.tasks')} icon={<ListTodo size={18} />}>
                <div className="space-y-5">
                    {onCreateTask && (
                        <form onSubmit={handleCreateTask} className="grid grid-cols-1 gap-3 rounded-lg border border-dashed border-gray-300 bg-gray-50/70 p-4 dark:border-slate-700 dark:bg-slate-900/30 lg:grid-cols-[minmax(0,1.2fr)_minmax(140px,0.7fr)_minmax(140px,0.7fr)_minmax(140px,0.7fr)_auto]">
                            <label className="min-w-0">
                                <span className="text-xs font-bold text-gray-500 dark:text-gray-400">{t('individual_donors.detailView.taskDescription', 'Description')}</span>
                                <input value={taskText} onChange={(event) => setTaskText(event.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold dark:border-slate-600 dark:bg-slate-900" />
                            </label>
                            <label className="min-w-0">
                                <span className="text-xs font-bold text-gray-500 dark:text-gray-400">{t('individual_donors.modals.log_interaction.type')}</span>
                                <select value={taskType} onChange={(event) => setTaskType(event.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold dark:border-slate-600 dark:bg-slate-900">
                                    {TASK_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                                </select>
                            </label>
                            <label className="min-w-0">
                                <span className="text-xs font-bold text-gray-500 dark:text-gray-400">{t('individual_donors.columns.owner')}</span>
                                <input value={assignedTo} onChange={(event) => setAssignedTo(event.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold dark:border-slate-600 dark:bg-slate-900" />
                            </label>
                            <label className="min-w-0">
                                <span className="text-xs font-bold text-gray-500 dark:text-gray-400">{t('donors.card.due')}</span>
                                <input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold dark:border-slate-600 dark:bg-slate-900" />
                            </label>
                            <button type="submit" disabled={!taskText.trim() || isCreatingTask} className="inline-flex items-center justify-center gap-2 rounded-lg bg-secondary px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-secondary-dark disabled:cursor-not-allowed disabled:opacity-60 lg:self-end">
                                <Plus size={16} /> {isCreatingTask ? t('common.loading') : t('donors.card.addTask')}
                            </button>
                        </form>
                    )}

                    {isLoading ? (
                        <div className="h-24 animate-pulse rounded-lg bg-gray-100 dark:bg-slate-800" />
                    ) : !hasAnyTasks ? (
                        <EmptyPanel text={t('individual_donors.detailView.noTasks')} />
                    ) : (
                        <>
                            <TaskSubsection title={subsectionTitle(t('individual_donors.detailView.openTasks'), openTasks.length)}>
                                {openTasks.length === 0 ? (
                                    <p className="rounded-lg border border-dashed border-gray-200 px-4 py-3 text-sm font-semibold text-gray-500 dark:border-slate-700 dark:text-gray-400">
                                        {t('individual_donors.detailView.noOpenTasks')}
                                    </p>
                                ) : (
                                    <div className="space-y-3">{openTasks.map(renderTask)}</div>
                                )}
                            </TaskSubsection>

                            {completedTasks.length > 0 && (
                                <TaskSubsection
                                    title={subsectionTitle(t('individual_donors.detailView.completedTasks'), completedTasks.length)}
                                    showDivider
                                >
                                    <div className="space-y-3">{completedTasks.map(renderTask)}</div>
                                </TaskSubsection>
                            )}
                        </>
                    )}
                </div>
            </Section>

            <Section title={t('individual_donors.detailView.communicationHistory')} icon={<MessageSquare size={18} />}>
                {isLoggingInteraction ? (
                    <p className="mb-3 text-xs text-blue-600 dark:text-blue-400">{t('individual_donors.detailView.loggingInteraction', 'Logging interaction...')}</p>
                ) : null}
                {interactions.length === 0 ? (
                    <EmptyPanel text={t('individual_donors.detailView.noCommunications')} />
                ) : (
                    <div className="space-y-3">
                        {interactions.map(renderInteraction)}
                    </div>
                )}
            </Section>
        </div>
    );
};

export default DonorRelationshipActivityTab;
