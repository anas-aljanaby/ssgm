import React, { useState } from 'react';
import { useLocalization } from '../../../hooks/useLocalization';
import ModalPortal from '../../common/ModalPortal';
import { XIcon } from '../../icons/GenericIcons';

interface SendEmailModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSend: (data: { to: string; subject: string; body: string }) => void;
    donorEmail: string;
}

const SendEmailModal: React.FC<SendEmailModalProps> = ({ isOpen, onClose, donorEmail }) => {
    const { t } = useLocalization(['common', 'individual_donors']);
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
    };

    return (
        <ModalPortal isOpen={isOpen} onClose={onClose} dir="rtl">
            <div className="bg-card dark:bg-dark-card rounded-2xl shadow-xl w-full max-w-2xl m-4 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-4 border-b dark:border-slate-700">
                    <h2 className="text-xl font-bold">{t('individual_donors.modals.send_email.title')}</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700"><XIcon /></button>
                </div>
                <form onSubmit={handleSubmit} className="flex-grow flex flex-col">
                    <div className="relative p-6 space-y-4 overflow-y-auto">
                        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-card/75 backdrop-blur-sm dark:bg-dark-card/75">
                            <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-center shadow-soft dark:border-slate-700 dark:bg-slate-900">
                                <p className="text-sm font-bold text-foreground dark:text-dark-foreground">{t('individual_donors.modals.send_email.comingSoon', 'Coming soon')}</p>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium">{t('individual_donors.modals.send_email.to')}</label>
                            <input type="email" value={donorEmail} readOnly disabled className="w-full p-2 mt-1 border rounded-md bg-gray-100 dark:bg-slate-800 dark:border-slate-700" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">{t('individual_donors.modals.send_email.subject')}</label>
                            <input type="text" value={subject} onChange={e => setSubject(e.target.value)} disabled className="w-full p-2 mt-1 border rounded-md bg-gray-50 dark:bg-slate-800 dark:border-slate-700" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">{t('individual_donors.modals.send_email.body')}</label>
                            <textarea value={body} onChange={e => setBody(e.target.value)} disabled rows={10} className="w-full p-2 mt-1 border rounded-md bg-gray-50 dark:bg-slate-800 dark:border-slate-700" />
                        </div>
                    </div>
                    <div className="px-6 py-4 bg-gray-50 dark:bg-dark-card/50 rounded-b-xl flex justify-end gap-3 flex-shrink-0">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-slate-700 text-sm font-semibold">{t('common.cancel')}</button>
                        <button type="submit" disabled className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold opacity-50">{t('individual_donors.modals.send_email.send')}</button>
                    </div>
                </form>
            </div>
        </ModalPortal>
    );
};

export default SendEmailModal;
