import React, { useState, useEffect } from 'react';
import ModalPortal from '../../common/ModalPortal';
import { useLocalization } from '../../../hooks/useLocalization';
import { X as XIcon } from 'lucide-react';
import type { BousalaGoal } from '../../../types';

interface AddTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (taskData: { title: string; goalId: string; dueDate: string; priority: string; }) => void;
    goals: BousalaGoal[];
    initialData?: { title?: string; goalId?: string; priority?: string } | null;
}

const AddTaskModal: React.FC<AddTaskModalProps> = ({ isOpen, onClose, onAdd, goals, initialData }) => {
    const { t } = useLocalization();
    const [title, setTitle] = useState('');
    const [goalId, setGoalId] = useState(goals[0]?.id || '');
    const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
    const [priority, setPriority] = useState('medium');

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setTitle(initialData.title || '');
                setGoalId(initialData.goalId || (goals[0]?.id || ''));
                setPriority(initialData.priority || 'medium');
            } else {
                // Reset for a blank modal
                setTitle('');
                setGoalId(goals[0]?.id || '');
                setDueDate(new Date().toISOString().split('T')[0]);
                setPriority('medium');
            }
        }
    }, [isOpen, initialData, goals]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !goalId) {
            alert(t('bousala.addTaskModal.titleAndGoalRequired'));
            return;
        }
        onAdd({ title, goalId, dueDate, priority });
    };

    return (
        <ModalPortal isOpen={isOpen} onClose={onClose} dir="rtl">
            <div className="bg-card dark:bg-dark-card rounded-2xl shadow-xl w-full max-w-lg m-4" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-4 border-b dark:border-slate-700">
                    <h2 className="text-xl font-bold">{t('bousala.addTaskModal.title')}</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700"><XIcon /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium">{t('bousala.addTaskModal.taskTitle')}</label>
                            <input type="text" value={title} onChange={e => setTitle(e.target.value)} required className="w-full p-2 mt-1 border rounded-md bg-gray-50 dark:bg-slate-800" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">{t('bousala.addTaskModal.relatedGoal')}</label>
                            <select value={goalId} onChange={e => setGoalId(e.target.value)} required className="w-full p-2 mt-1 border rounded-md bg-gray-50 dark:bg-slate-800">
                                {goals.map(g => <option key={g.id} value={g.id}>{g.title}</option>)}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium">{t('bousala.addTaskModal.dueDate')}</label>
                                <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full p-2 mt-1 border rounded-md bg-gray-50 dark:bg-slate-800" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">{t('bousala.addTaskModal.priority')}</label>
                                <select value={priority} onChange={e => setPriority(e.target.value)} className="w-full p-2 mt-1 border rounded-md bg-gray-50 dark:bg-slate-800">
                                    <option value="high">{t('bousala.addTaskModal.priorities.high')}</option>
                                    <option value="medium">{t('bousala.addTaskModal.priorities.medium')}</option>
                                    <option value="low">{t('bousala.addTaskModal.priorities.low')}</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className="px-6 py-4 bg-gray-50 dark:bg-dark-card/50 rounded-b-xl flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-slate-700 text-sm font-semibold">{t('common.cancel')}</button>
                        <button type="submit" className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold">{t('bousala.addTaskModal.save')}</button>
                    </div>
                </form>
            </div>
        </ModalPortal>
    );
};

export default AddTaskModal;