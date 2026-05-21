import React, { useState } from 'react';
import ModalPortal from '../../common/ModalPortal';
import { XIcon } from '../../icons/GenericIcons';
import type { Beneficiary, BeneficiaryType, SupportType, BeneficiaryProfile } from '../../../types';
import { useLocalization } from '../../../hooks/useLocalization';

interface AddBeneficiaryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (data: Partial<Beneficiary>) => void;
}

const BENEFICIARY_TYPES: BeneficiaryType[] = ['student', 'orphan', 'hafiz', 'family', 'institution', 'community'];

const AddBeneficiaryModal: React.FC<AddBeneficiaryModalProps> = ({ isOpen, onClose, onAdd }) => {
    const { t } = useLocalization(['common', 'beneficiaries']);
    const [nameEn, setNameEn] = useState('');
    const [nameAr, setNameAr] = useState('');
    const [beneficiaryType, setBeneficiaryType] = useState<BeneficiaryType>('student');
    const [supportType, setSupportType] = useState<SupportType>('direct-support');
    const [country, setCountry] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!nameEn.trim() && !nameAr.trim()) return;

        const profile: BeneficiaryProfile = { type: beneficiaryType, contact: { email, phone } } as BeneficiaryProfile;

        onAdd({
            name: { en: nameEn, ar: nameAr || nameEn },
            beneficiaryType,
            supportType,
            country,
            profile,
        });

        // Reset
        setNameEn('');
        setNameAr('');
        setBeneficiaryType('student');
        setSupportType('direct-support');
        setCountry('');
        setEmail('');
        setPhone('');
    };

    if (!isOpen) return null;

    return (
        <ModalPortal isOpen={isOpen} onClose={onClose}>
            <div className="bg-card dark:bg-dark-card rounded-2xl shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-4 border-b dark:border-slate-700">
                    <h2 className="text-xl font-bold text-foreground dark:text-dark-foreground">{t('beneficiaries.addModal.title')}</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700" aria-label={t('common.close')}>
                        <XIcon />
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground dark:text-dark-foreground mb-1">{t('beneficiaries.addModal.nameEn')}</label>
                                <input type="text" value={nameEn} onChange={e => setNameEn(e.target.value)} required className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-slate-800 dark:border-slate-700 text-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground dark:text-dark-foreground mb-1">{t('beneficiaries.addModal.nameAr')}</label>
                                <input type="text" value={nameAr} onChange={e => setNameAr(e.target.value)} dir="rtl" className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-slate-800 dark:border-slate-700 text-sm" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground dark:text-dark-foreground mb-1">{t('beneficiaries.addModal.type')}</label>
                                <select value={beneficiaryType} onChange={e => setBeneficiaryType(e.target.value as BeneficiaryType)} className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-slate-800 dark:border-slate-700 text-sm">
                                    {BENEFICIARY_TYPES.map(type => (
                                        <option key={type} value={type}>{t(`beneficiaries.types.${type}`)}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground dark:text-dark-foreground mb-1">{t('beneficiaries.addModal.supportType')}</label>
                                <select value={supportType} onChange={e => setSupportType(e.target.value as SupportType)} className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-slate-800 dark:border-slate-700 text-sm">
                                    <option value="direct-support">{t('beneficiaries.supportTypes.direct-support')}</option>
                                    <option value="sponsorship">{t('beneficiaries.supportTypes.sponsorship')}</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground dark:text-dark-foreground mb-1">{t('beneficiaries.fields.country')}</label>
                            <input type="text" value={country} onChange={e => setCountry(e.target.value)} className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-slate-800 dark:border-slate-700 text-sm" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground dark:text-dark-foreground mb-1">{t('beneficiaries.fields.email')}</label>
                                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-slate-800 dark:border-slate-700 text-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground dark:text-dark-foreground mb-1">{t('beneficiaries.fields.phone')}</label>
                                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-slate-800 dark:border-slate-700 text-sm" />
                            </div>
                        </div>
                    </div>
                    <div className="px-6 py-4 bg-gray-50 dark:bg-dark-card/50 rounded-b-2xl flex justify-end gap-3 border-t dark:border-slate-700">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-slate-700 text-sm font-semibold">{t('common.cancel')}</button>
                        <button type="submit" className="px-4 py-2 rounded-lg bg-secondary text-white text-sm font-semibold hover:bg-secondary-dark transition-colors">{t('beneficiaries.addModal.submit')}</button>
                    </div>
                </form>
            </div>
        </ModalPortal>
    );
};

export default AddBeneficiaryModal;
