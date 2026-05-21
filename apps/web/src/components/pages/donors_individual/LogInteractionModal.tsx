import React, { useState } from 'react';
import { useLocalization } from '../../../hooks/useLocalization';
import ModalPortal from '../../common/ModalPortal';
import { XIcon } from '../../icons/GenericIcons';

interface LogInteractionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLog: (interaction: any) => void;
}

const LogInteractionModal: React.FC<LogInteractionModalProps> = ({ isOpen, onClose, onLog }) => {
    const { t } = useLocalization(['common', 'individual_donors']);
    const [type, setType] = useState('Email');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [subject, setSubject] = useState('');
    const [notes, setNotes] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onLog({ type, date, subject, notes });
    };

    return (
        <ModalPortal isOpen={isOpen} onClose={onClose} dir="rtl">
            <div className="bg-card dark:bg-dark-card rounded-2xl shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-4 border-b dark:border-slate-700">
                    <h2 className="text-xl font-bold">{t('individual_donors.modals.log_interaction.title')}</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700"><XIcon /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium">{t('individual_donors.modals.log_interaction.type')}</label>
                                <select value={type} onChange={e => setType(e.target.value)} className="w-full p-2 mt-1 border rounded-md bg-gray-50 dark:bg-slate-800 dark:border-slate-700">
                                    <option value="Email">{t('individual_donors.modals.log_interaction.types.email')}</option>
                                    <option value="Call">{t('individual_donors.modals.log_interaction.types.call')}</option>
                                    <option value="Meeting">{t('individual_donors.modals.log_interaction.types.meeting')}</option>
                                    <option value="Note">{t('individual_donors.modals.log_interaction.types.note')}</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium">{t('individual_donors.modals.log_interaction.date')}</label>
                                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full p-2 mt-1 border rounded-md bg-gray-50 dark:bg-slate-800 dark:border-slate-700" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium">{t('individual_donors.modals.log_interaction.subject')}</label>
                            <input type="text" value={subject} onChange={e => setSubject(e.target.value)} className="w-full p-2 mt-1 border rounded-md bg-gray-50 dark:bg-slate-800 dark:border-slate-700" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">{t('individual_donors.modals.log_interaction.notes')}</label>
                            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4} className="w-full p-2 mt-1 border rounded-md bg-gray-50 dark:bg-slate-800 dark:border-slate-700" />
                        </div>
                    </div>
                    <div className="px-6 py-4 bg-gray-50 dark:bg-dark-card/50 rounded-b-xl flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-slate-700 text-sm font-semibold">{t('common.cancel')}</button>
                        <button type="submit" className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold">{t('individual_donors.modals.log_interaction.log')}</button>
                    </div>
                </form>
            </div>
        </ModalPortal>
    );
};

export default LogInteractionModal;
