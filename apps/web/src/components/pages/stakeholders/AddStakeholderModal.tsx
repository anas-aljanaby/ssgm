

import React, { useEffect, useState } from 'react';
import ModalPortal from '../../common/ModalPortal';
import { useLocalization } from '../../../hooks/useLocalization';
import { XIcon } from '../../icons/GenericIcons';
import type { Stakeholder, StakeholderType, StakeholderCategoryKey } from '../../../types';

export interface StakeholderFormValues {
    name: {
        en: string;
        ar: string;
    };
    type: StakeholderType;
    category: StakeholderCategoryKey;
    country: string;
    email: string;
    phone: string;
}

interface AddStakeholderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: StakeholderFormValues) => Promise<void> | void;
    initialStakeholder?: Stakeholder | null;
    mode?: 'create' | 'edit';
}

const AddStakeholderModal: React.FC<AddStakeholderModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    initialStakeholder = null,
    mode = 'create',
}) => {
    const { t } = useLocalization();
    const [name, setName] = useState({ en: '', ar: '' });
    const [type, setType] = useState<StakeholderType>('donor');
    const [category, setCategory] = useState<StakeholderCategoryKey>('foundation');
    const [country, setCountry] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [validationError, setValidationError] = useState<string | null>(null);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!isOpen) return;

        if (initialStakeholder) {
            setName(initialStakeholder.name);
            setType(initialStakeholder.type);
            setCategory(initialStakeholder.category);
            setCountry(initialStakeholder.country);
            setEmail(initialStakeholder.email);
            setPhone(initialStakeholder.phone);
        } else {
            setName({ en: '', ar: '' });
            setType('donor');
            setCategory('foundation');
            setCountry('');
            setEmail('');
            setPhone('');
        }

        setValidationError(null);
        setSubmitError(null);
        setIsSubmitting(false);
    }, [isOpen, initialStakeholder]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.en && !name.ar) {
            setValidationError(t('stakeholder_management.add_modal.validation.nameRequired'));
            return;
        }

        setValidationError(null);
        setSubmitError(null);
        setIsSubmitting(true);

        try {
            await onSubmit({
            name: {
                en: name.en || name.ar,
                ar: name.ar || name.en,
            },
            type,
            category,
            country,
            email,
            phone,
        });
            onClose();
        } catch (_error) {
            setSubmitError(t('stakeholder_management.add_modal.submitError'));
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <ModalPortal isOpen={isOpen} onClose={onClose}>
            <div className="bg-card dark:bg-dark-card rounded-2xl shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-4 border-b dark:border-slate-700">
                    <h2 className="text-xl font-bold">
                        {mode === 'edit'
                            ? t('stakeholder_management.add_modal.editTitle')
                            : t('stakeholder_management.add_modal.title')}
                    </h2>
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 disabled:opacity-50"
                    >
                        <XIcon />
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                        <div><label className="block text-sm font-medium">{t('stakeholder_management.add_modal.name_ar')}</label><input dir="rtl" type="text" value={name.ar} onChange={e => setName(n => ({...n, ar: e.target.value}))} className="w-full p-2 mt-1 border rounded-md"/></div>
                        <div><label className="block text-sm font-medium">{t('stakeholder_management.add_modal.name_en')}</label><input type="text" value={name.en} onChange={e => setName(n => ({...n, en: e.target.value}))} className="w-full p-2 mt-1 border rounded-md"/></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="block text-sm font-medium">{t('stakeholder_management.add_modal.type')}</label><select value={type} onChange={e => setType(e.target.value as StakeholderType)} className="w-full p-2 mt-1 border rounded-md">
                                <option value="donor">{t('stakeholder_management.types.donor')}</option>
                                <option value="beneficiary">{t('stakeholder_management.types.beneficiary')}</option>
                                <option value="partner">{t('stakeholder_management.types.partner')}</option>
                                <option value="volunteer">{t('stakeholder_management.types.volunteer')}</option>
                                <option value="mentor">{t('stakeholder_management.types.mentor')}</option>
                                <option value="expert">{t('stakeholder_management.types.expert')}</option>
                                <option value="investor">{t('stakeholder_management.types.investor')}</option>
                                <option value="board_member">{t('stakeholder_management.types.board_member')}</option>
                                <option value="government">{t('stakeholder_management.types.government')}</option>
                                <option value="supplier">{t('stakeholder_management.types.supplier')}</option>
                                <option value="community">{t('stakeholder_management.types.community')}</option>
                                <option value="media">{t('stakeholder_management.types.media')}</option>
                            </select></div>
                            <div><label className="block text-sm font-medium">{t('stakeholder_management.add_modal.category')}</label><select value={category} onChange={e => setCategory(e.target.value as StakeholderCategoryKey)} className="w-full p-2 mt-1 border rounded-md"><option value="foundation">{t('stakeholder_management.add_modal.categories.foundation')}</option><option value="family">{t('stakeholder_management.add_modal.categories.family')}</option><option value="company">{t('stakeholder_management.add_modal.categories.company')}</option></select></div>
                        </div>
                        <div><label className="block text-sm font-medium">{t('stakeholder_management.add_modal.country')}</label><input type="text" value={country} onChange={e => setCountry(e.target.value)} className="w-full p-2 mt-1 border rounded-md"/></div>
                        <div><label className="block text-sm font-medium">{t('stakeholder_management.add_modal.email')}</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-2 mt-1 border rounded-md"/></div>
                        <div><label className="block text-sm font-medium">{t('stakeholder_management.add_modal.phone')}</label><input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full p-2 mt-1 border rounded-md"/></div>
                        {validationError && (
                            <p className="text-sm text-red-600 dark:text-red-400">{validationError}</p>
                        )}
                        {submitError && (
                            <p className="text-sm text-red-600 dark:text-red-400">{submitError}</p>
                        )}
                    </div>
                    <div className="px-6 py-4 bg-gray-50 dark:bg-dark-card/50 rounded-b-xl flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-slate-700 text-sm font-semibold disabled:opacity-60"
                        >
                            {t('common.cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-4 py-2 rounded-lg bg-secondary text-white text-sm font-semibold disabled:opacity-60"
                        >
                            {isSubmitting
                                ? t('common.saving')
                                : mode === 'edit'
                                  ? t('stakeholder_management.actions.saveChanges')
                                  : t('common.save')}
                        </button>
                    </div>
                </form>
            </div>
        </ModalPortal>
    );
};

export default AddStakeholderModal;