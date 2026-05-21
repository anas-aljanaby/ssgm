import React, { useState } from 'react';
import ModalPortal from '../../common/ModalPortal';
import type { Donor } from '../../../types';
import { useLocalization } from '../../../hooks/useLocalization';
import { XIcon } from '../../icons/GenericIcons';

interface AddDonorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddDonor: (donorData: Omit<Donor, 'id' | 'tasks' | 'totalDonated' | 'donationCount' | 'firstDonation' | 'lastDonation' | 'lastContact' | 'relationshipHealth' | 'stage'>) => void;
}

const AddDonorModal: React.FC<AddDonorModalProps> = ({ isOpen, onClose, onAddDonor }) => {
    const { t } = useLocalization(['common', 'donors']);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [country, setCountry] = useState('');
    const [potentialGift, setPotentialGift] = useState(0);
    const [avatar, setAvatar] = useState(`https://picsum.photos/seed/${Math.random()}/100/100`);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !email) {
            // Basic validation
            alert(t('donors.modal.requiredFields'));
            return;
        }
        onAddDonor({
            name,
            email,
            country,
            potentialGift,
            avatar,
        });
        // Reset form and close
        setName('');
        setEmail('');
        setCountry('');
        setPotentialGift(0);
        setAvatar(`https://picsum.photos/seed/${Math.random()}/100/100`);
        onClose();
    };

    return (
        <ModalPortal isOpen={isOpen} onClose={onClose} labelledBy="add-donor-title">
            <div 
                className="bg-card dark:bg-dark-card rounded-2xl shadow-xl w-full max-w-md"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-4 border-b dark:border-slate-700">
                    <h2 id="add-donor-title" className="text-xl font-bold text-foreground dark:text-dark-foreground">
                        {t('donors.modal.addDonorTitle')}
                    </h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700" aria-label={t('common.close')}>
                        <XIcon />
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        <div>
                            <label htmlFor="donor-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('donors.modal.donorName')}</label>
                            <input type="text" id="donor-name" value={name} onChange={e => setName(e.target.value)} required className="mt-1 block w-full p-2 border rounded-md bg-gray-50 dark:bg-slate-800 dark:border-slate-700"/>
                        </div>
                        <div>
                            <label htmlFor="donor-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('donors.modal.email')}</label>
                            <input type="email" id="donor-email" value={email} onChange={e => setEmail(e.target.value)} required className="mt-1 block w-full p-2 border rounded-md bg-gray-50 dark:bg-slate-800 dark:border-slate-700"/>
                        </div>
                        <div>
                            <label htmlFor="donor-country" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('donors.modal.country')}</label>
                            <input type="text" id="donor-country" value={country} onChange={e => setCountry(e.target.value)} className="mt-1 block w-full p-2 border rounded-md bg-gray-50 dark:bg-slate-800 dark:border-slate-700"/>
                        </div>
                        <div>
                            <label htmlFor="donor-potential" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('donors.modal.potentialGift')}</label>
                            <input type="number" id="donor-potential" value={potentialGift} onChange={e => setPotentialGift(Number(e.target.value))} min="0" className="mt-1 block w-full p-2 border rounded-md bg-gray-50 dark:bg-slate-800 dark:border-slate-700"/>
                        </div>
                    </div>
                    <div className="px-6 py-4 bg-gray-50 dark:bg-dark-card/50 rounded-b-2xl flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-slate-700 text-sm font-semibold">{t('donors.modal.cancel')}</button>
                        <button type="submit" className="px-4 py-2 rounded-lg bg-secondary text-white text-sm font-semibold hover:bg-secondary-dark">{t('donors.modal.saveDonor')}</button>
                    </div>
                </form>
            </div>
        </ModalPortal>
    );
};

export default AddDonorModal;
