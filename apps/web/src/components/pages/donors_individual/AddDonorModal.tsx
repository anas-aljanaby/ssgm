import React, { useState } from 'react';
import type { IndividualDonor } from '../../../types';
import { useLocalization } from '../../../hooks/useLocalization';
import ModalPortal from '../../common/ModalPortal';
import { XIcon } from '../../icons/GenericIcons';

interface AddDonorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (donorData: Omit<IndividualDonor, 'id' | 'totalDonations' | 'lastDonationDate' | 'status' | 'tier' | 'tags' | 'assignedManager' | 'avatar' | 'donorSince'>) => void;
}

const AddDonorModal: React.FC<AddDonorModalProps> = ({ isOpen, onClose, onAdd }) => {
    const { t } = useLocalization(['common', 'individual_donors']);
    const [fullName, setFullName] = useState({ en: '', ar: '' });
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [country, setCountry] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!fullName.en || !email) {
            alert(t('individual_donors.modal.requiredFields'));
            return;
        }
        onAdd({
            fullName: {
                en: fullName.en,
                ar: fullName.ar || fullName.en,

            },
            email,
            phone,
            country,
        });
        // Reset form and close
        setFullName({ en: '', ar: '' });
        setEmail('');
        setPhone('');
        setCountry('');
        onClose();
    };

    return (
        <ModalPortal isOpen={isOpen} onClose={onClose} labelledBy="add-donor-title">
                <div
                    className="bg-card dark:bg-dark-card rounded-2xl shadow-xl w-full max-w-lg"
                    onClick={(e) => e.stopPropagation()}
                >
                <div className="flex items-center justify-between p-4 border-b dark:border-slate-700">
                    <h2 id="add-donor-title" className="text-xl font-bold text-foreground dark:text-dark-foreground">
                        {t('individual_donors.addDonor')}
                    </h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700" aria-label={t('common.close')}>
                        <XIcon />
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('individual_donors.modal.fullNameEN')}</label>
                            <input type="text" value={fullName.en} onChange={e => setFullName(f => ({...f, en: e.target.value}))} required className="mt-1 block w-full p-2 border rounded-md bg-gray-50 dark:bg-slate-800 dark:border-slate-700"/>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('individual_donors.modal.fullNameAR')}</label>
                            <input type="text" value={fullName.ar} onChange={e => setFullName(f => ({...f, ar: e.target.value}))} dir="rtl" className="mt-1 block w-full p-2 border rounded-md bg-gray-50 dark:bg-slate-800 dark:border-slate-700"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('individual_donors.modal.email')}</label>
                            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="mt-1 block w-full p-2 border rounded-md bg-gray-50 dark:bg-slate-800 dark:border-slate-700"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('individual_donors.modal.phone')}</label>
                            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="mt-1 block w-full p-2 border rounded-md bg-gray-50 dark:bg-slate-800 dark:border-slate-700"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('individual_donors.modal.country')}</label>
                            <input type="text" value={country} onChange={e => setCountry(e.target.value)} className="mt-1 block w-full p-2 border rounded-md bg-gray-50 dark:bg-slate-800 dark:border-slate-700"/>
                        </div>
                    </div>
                    <div className="px-6 py-4 bg-gray-50 dark:bg-dark-card/50 rounded-b-2xl flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-slate-700 text-sm font-semibold">{t('common.cancel')}</button>
                        <button type="submit" className="px-4 py-2 rounded-lg bg-secondary text-white text-sm font-semibold hover:bg-secondary-dark">{t('individual_donors.modal.saveDonor')}</button>
                    </div>
                </form>
                </div>
        </ModalPortal>
    );
};

export default AddDonorModal;
