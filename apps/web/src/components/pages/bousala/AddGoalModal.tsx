
import React, { useState, useEffect, useMemo } from 'react';
import ModalPortal from '../../common/ModalPortal';
import { useLocalization } from '../../../hooks/useLocalization';
import { X as XIcon } from 'lucide-react';
import type { HrData } from '../../../types';
import ResponsiblePersonField from './ResponsiblePersonField';

interface AddGoalModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (goalData: { title: string; description: string; progress: number; responsiblePerson: string; status?: string; }) => void;
    hrData: HrData;
}

const AddGoalModal: React.FC<AddGoalModalProps> = ({ isOpen, onClose, onAdd, hrData }) => {
    const { t, dir } = useLocalization(['common', 'bousala']);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [progress, setProgress] = useState(0);
    const [responsiblePerson, setResponsiblePerson] = useState('');
    const [status, setStatus] = useState('');
    const [titleError, setTitleError] = useState<string | undefined>();
    const statusOptions = useMemo(
        () => Object.values(t('bousala.statusOptions', { returnObjects: true }) as Record<string, string>),
        [t],
    );

    useEffect(() => {
        if (!isOpen) return;
        setTitle('');
        setDescription('');
        setProgress(0);
        setResponsiblePerson('');
        setStatus('');
        setTitleError(undefined);
    }, [isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) {
            setTitleError(t('bousala.addGoalModal.goalTitleRequired'));
            return;
        }
        onAdd({
            title: title.trim(),
            description: description.trim(),
            progress,
            responsiblePerson: responsiblePerson.trim(),
            status: status || undefined,
        });
        onClose();
    };

    return (
        <ModalPortal isOpen={isOpen} onClose={onClose} dir={dir}>
            <div className="bg-card dark:bg-dark-card rounded-2xl shadow-xl w-full max-w-lg m-4" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-4 border-b dark:border-slate-700">
                    <h2 className="text-xl font-bold">{t('bousala.addGoalModal.title')}</h2>
                    <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700"><XIcon /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium">{t('bousala.addGoalModal.goalTitle')}</label>
                            <input
                                type="text"
                                value={title}
                                onChange={e => { setTitle(e.target.value); if (titleError) setTitleError(undefined); }}
                                className="w-full p-2 mt-1 border rounded-md bg-gray-50 dark:bg-slate-800"
                                dir="auto"
                            />
                            {titleError && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{titleError}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium">{t('bousala.addGoalModal.description')}</label>
                            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full p-2 mt-1 border rounded-md bg-gray-50 dark:bg-slate-800" dir="auto" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium">{t('bousala.addGoalModal.target')} ({progress}%)</label>
                                <input type="range" min="0" max="100" value={progress} onChange={e => setProgress(Number(e.target.value))} className="w-full mt-1" />
                            </div>
                             <div>
                                <label className="block text-sm font-medium">{t('bousala.addGoalModal.responsiblePerson')}</label>
                                <ResponsiblePersonField
                                    value={responsiblePerson}
                                    onChange={setResponsiblePerson}
                                    hrData={hrData}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium">{t('bousala.addGoalModal.status')}</label>
                            <select value={status} onChange={e => setStatus(e.target.value)} className="w-full p-2 mt-1 border rounded-md bg-gray-50 dark:bg-slate-800">
                                <option value="">—</option>
                                {statusOptions.map(option => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="px-6 py-4 bg-gray-50 dark:bg-dark-card/50 rounded-b-xl flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-slate-700 text-sm font-semibold">{t('common.cancel')}</button>
                        <button type="submit" className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold">{t('bousala.addGoalModal.save')}</button>
                    </div>
                </form>
            </div>
        </ModalPortal>
    );
};

export default AddGoalModal;
