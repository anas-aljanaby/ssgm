import React, { useState } from 'react';
import { useLocalization } from '../../../../hooks/useLocalization';
import type { Project, GanttTask } from '../../../../types';
import AiCard from '../../ai/AiCard';
import { CheckCircle2, Clock, Circle, PlusCircle, Pencil, Trash2, X, Check } from 'lucide-react';
import { useProjectTasks } from '../../../../hooks/useProjects';
import { useToast } from '../../../../hooks/useToast';

interface ScheduleManagementTabProps {
    project: Project;
    onUpdate?: (updated: Project) => void;
}

interface TaskForm {
    name: string;
    start: string;
    end: string;
    progress: number;
}

const emptyTaskForm = (): TaskForm => ({ name: '', start: '', end: '', progress: 0 });

const progressColor = (progress: number) => {
    if (progress === 100) return 'bg-emerald-500';
    if (progress >= 50) return 'bg-blue-500';
    if (progress > 0) return 'bg-amber-500';
    return 'bg-gray-200 dark:bg-slate-700';
};

const statusIcon = (progress: number) => {
    if (progress === 100) return <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />;
    if (progress > 0) return <Clock size={14} className="text-amber-500 shrink-0" />;
    return <Circle size={14} className="text-gray-300 dark:text-slate-600 shrink-0" />;
};

const ScheduleManagementTab: React.FC<ScheduleManagementTabProps> = ({ project }) => {
    const { t } = useLocalization(['projects']);
    const toast = useToast();
    const { data: tasks = project.schedule, createTask, updateTask, deleteTask } = useProjectTasks(project.id);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<GanttTask | null>(null);
    const [form, setForm] = useState<TaskForm>(emptyTaskForm());

    const openAddModal = () => {
        setEditingTask(null);
        setForm(emptyTaskForm());
        setModalOpen(true);
    };

    const openEditModal = (task: GanttTask) => {
        setEditingTask(task);
        setForm({ name: task.name, start: task.start, end: task.end, progress: task.progress });
        setModalOpen(true);
    };

    const closeModal = () => setModalOpen(false);

    const handleSave = async () => {
        if (!form.name.trim()) return;
        try {
            if (editingTask) {
                await updateTask({ ...editingTask, ...form, name: form.name.trim() });
            } else {
                await createTask({ ...form, name: form.name.trim() });
            }
            closeModal();
        } catch {
            toast.showError(t('common.error', 'Something went wrong. Please try again.'));
        }
    };

    const handleDelete = (id: string) => {
        void deleteTask(id).catch(() => {
            toast.showError(t('common.error', 'Something went wrong. Please try again.'));
        });
    };

    const inputClass = "w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-dark-foreground focus:ring-1 focus:ring-primary";
    const labelClass = "block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1";

    return (
        <div className="space-y-6">
            <AiCard title={t('projects.schedule.gantt')}>
                <div className="flex justify-end mb-3">
                    <button onClick={openAddModal} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-lg transition-colors">
                        <PlusCircle size={15} /> {t('projects.schedule.addTask')}
                    </button>
                </div>
                <div className="space-y-1">
                    <div className="grid grid-cols-[1fr_2fr_100px_56px] gap-4 px-3 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-slate-700/50">
                        <span>{t('projects.schedule.task')}</span>
                        <span>{t('projects.schedule.timeline')}</span>
                        <span className="text-end">{t('projects.list.progress')}</span>
                        <span></span>
                    </div>
                    {tasks.map(task => (
                        <div key={task.id} className="grid grid-cols-[1fr_2fr_100px_56px] gap-4 items-center p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors group">
                            <div className="flex items-center gap-2 min-w-0">
                                {statusIcon(task.progress)}
                                <span className="text-sm font-medium text-foreground dark:text-dark-foreground truncate">{task.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex-1 bg-gray-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                                    <div className={`h-full rounded-full transition-all ${progressColor(task.progress)}`} style={{ width: `${Math.max(task.progress, 2)}%` }} />
                                </div>
                                <span className="text-xs text-gray-400 whitespace-nowrap">{task.start} → {task.end}</span>
                            </div>
                            <span className="text-sm font-semibold text-end text-foreground dark:text-dark-foreground">{task.progress}%</span>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => openEditModal(task)} className="p-1 text-gray-400 hover:text-primary rounded">
                                    <Pencil size={13} />
                                </button>
                                <button onClick={() => handleDelete(task.id)} className="p-1 text-gray-400 hover:text-red-500 rounded">
                                    <Trash2 size={13} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </AiCard>

            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-card dark:bg-dark-card rounded-xl border border-gray-200 dark:border-slate-700 p-6 w-full max-w-md mx-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base font-bold">{editingTask ? t('projects.schedule.taskName') : t('projects.schedule.addTask')}</h3>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <label className={labelClass}>{t('projects.schedule.taskName')}</label>
                                <input className={inputClass} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className={labelClass}>{t('projects.schedule.startDate')}</label>
                                    <input type="date" className={inputClass} value={form.start} onChange={e => setForm(f => ({ ...f, start: e.target.value }))} />
                                </div>
                                <div>
                                    <label className={labelClass}>{t('projects.schedule.endDate')}</label>
                                    <input type="date" className={inputClass} value={form.end} onChange={e => setForm(f => ({ ...f, end: e.target.value }))} />
                                </div>
                            </div>
                            <div>
                                <label className={labelClass}>{t('projects.list.progress')} ({form.progress}%)</label>
                                <input type="range" min={0} max={100} className="w-full" value={form.progress} onChange={e => setForm(f => ({ ...f, progress: Number(e.target.value) }))} />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-5">
                            <button onClick={closeModal} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg">{t('common.cancel')}</button>
                            <button onClick={handleSave} disabled={!form.name.trim()} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-lg disabled:opacity-50">
                                <Check size={14} /> {t('common.save')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ScheduleManagementTab;
