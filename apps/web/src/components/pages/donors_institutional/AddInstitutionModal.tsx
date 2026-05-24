
import React, { useState } from 'react';
import type { InstitutionalDonor, InstitutionType, GrantmakerRelationshipStatus, PriorityLevel } from '../../../types';
import { useLocalization } from '../../../hooks/useLocalization';
import { useToast } from '../../../hooks/useToast';
import ModalPortal from '../../common/ModalPortal';
import CountryCombobox from '../../common/CountryCombobox';
import { XIcon } from '../../icons/GenericIcons';

interface AddInstitutionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (donorData: Omit<InstitutionalDonor, 'id' | 'logo' | 'totalGrantsAwarded' | 'activeGrants' | 'nextDeadline' | 'lastContactDate' | 'assignedManager' | 'createdDate'>) => Promise<void>;
    existingCountries?: string[];
}

const AddInstitutionModal: React.FC<AddInstitutionModalProps> = ({ isOpen, onClose, onAdd, existingCountries = [] }) => {
    const { t } = useLocalization(['common', 'institutional_donors']);
    const toast = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [organizationName, setOrganizationName] = useState({ en: '', ar: '' });
    const [type, setType] = useState<InstitutionType>('Foundation');
    const [country, setCountry] = useState('');
    const [city, setCity] = useState('');
    const [registrationNumber, setRegistrationNumber] = useState('');
    const [establishmentDate, setEstablishmentDate] = useState('');
    const [contactName, setContactName] = useState('');
    const [contactEmail, setContactEmail] = useState('');
    const [focusAreas, setFocusAreas] = useState('');
    const [geographicFocus, setGeographicFocus] = useState('');
    const [priority, setPriority] = useState<PriorityLevel>('Medium');
    const [relationshipStatus, setRelationshipStatus] = useState<GrantmakerRelationshipStatus>('Prospect');


    const resetForm = () => {
        setOrganizationName({ en: '', ar: '' });
        setType('Foundation');
        setCountry('');
        setCity('');
        setRegistrationNumber('');
        setEstablishmentDate('');
        setContactName('');
        setContactEmail('');
        setFocusAreas('');
        setGeographicFocus('');
        setPriority('Medium');
        setRelationshipStatus('Prospect');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!organizationName.en.trim()) {
            toast.showError(t('institutional_donors.modal.requiredName'));
            return;
        }
        if (contactEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail.trim())) {
            toast.showError(t('institutional_donors.detail.validation.email'));
            return;
        }

        setIsSubmitting(true);
        try {
            await onAdd({
                organizationName: {
                    en: organizationName.en.trim(),
                    ar: organizationName.ar.trim() || organizationName.en.trim(),
                },
                type,
                primaryContact: {
                    name: contactName.trim(),
                    email: contactEmail.trim(),
                },
                relationshipStatus,
                focusAreas: focusAreas.split(',').map((s) => s.trim()).filter(Boolean),
                geographicFocus: geographicFocus.split(',').map((s) => s.trim()).filter(Boolean),
                priority,
                country: country.trim(),
                city: city.trim(),
                registrationNumber: registrationNumber.trim(),
                establishmentDate,
            });
            resetForm();
            onClose();
        } catch {
            toast.showError(t('institutional_donors.errors.generic'));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <ModalPortal isOpen={isOpen} onClose={onClose}>
            <div 
                className="bg-card dark:bg-dark-card rounded-2xl shadow-xl w-full max-w-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-4 border-b dark:border-slate-700">
                    <h2 className="text-xl font-bold text-foreground dark:text-dark-foreground">
                        {t('institutional_donors.addInstitution')}
                    </h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700" aria-label={t('common.close')}>
                        <XIcon />
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('institutional_donors.modal.nameEn')}</label>
                            <input type="text" value={organizationName.en} onChange={e => setOrganizationName(f => ({...f, en: e.target.value}))} required className="mt-1 block w-full p-2 border rounded-md bg-gray-50 dark:bg-slate-800 dark:border-slate-700"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('institutional_donors.modal.nameAr')}</label>
                            <input type="text" value={organizationName.ar} dir="rtl" onChange={e => setOrganizationName(f => ({...f, ar: e.target.value}))} className="mt-1 block w-full p-2 border rounded-md bg-gray-50 dark:bg-slate-800 dark:border-slate-700"/>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium">{t('institutional_donors.filter_labels.institutionType')}</label>
                                <select value={type} onChange={e => setType(e.target.value as InstitutionType)} className="w-full p-2 mt-1 border rounded-md bg-gray-50 dark:bg-slate-800 dark:border-slate-700">
                                    {(['Foundation', 'Corporate', 'Government', 'Multilateral'] as InstitutionType[]).map(t_ => <option key={t_} value={t_}>{t(`institutional_donors.types.${t_}`)}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('institutional_donors.modal.country')}</label>
                                <CountryCombobox
                                    value={country}
                                    onChange={setCountry}
                                    existingCountries={existingCountries}
                                    placeholder={t('common.countryField.placeholder')}
                                    noResultsText={t('common.countryField.noResults')}
                                    className="mt-1"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium">{t('institutional_donors.modal.city')}</label>
                                <input type="text" value={city} onChange={e => setCity(e.target.value)} className="w-full p-2 mt-1 border rounded-md bg-gray-50 dark:bg-slate-800 dark:border-slate-700"/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium">{t('institutional_donors.modal.registrationNumber')}</label>
                                <input type="text" value={registrationNumber} onChange={e => setRegistrationNumber(e.target.value)} className="w-full p-2 mt-1 border rounded-md bg-gray-50 dark:bg-slate-800 dark:border-slate-700"/>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium">{t('institutional_donors.modal.establishmentDate')}</label>
                            <input type="date" value={establishmentDate} onChange={e => setEstablishmentDate(e.target.value)} className="w-full p-2 mt-1 border rounded-md bg-gray-50 dark:bg-slate-800 dark:border-slate-700"/>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div>
                                <label className="block text-sm font-medium">{t('institutional_donors.modal.contactName')}</label>
                                <input type="text" value={contactName} onChange={e => setContactName(e.target.value)} className="w-full p-2 mt-1 border rounded-md bg-gray-50 dark:bg-slate-800 dark:border-slate-700"/>
                            </div>
                             <div>
                                <label className="block text-sm font-medium">{t('institutional_donors.modal.contactEmail')}</label>
                                <input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} className="w-full p-2 mt-1 border rounded-md bg-gray-50 dark:bg-slate-800 dark:border-slate-700"/>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium">{t('institutional_donors.modal.focusAreas')}</label>
                            <input type="text" value={focusAreas} onChange={e => setFocusAreas(e.target.value)} placeholder={t('institutional_donors.modal.focusAreasHint')} className="w-full p-2 mt-1 border rounded-md bg-gray-50 dark:bg-slate-800 dark:border-slate-700"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium">{t('institutional_donors.detail.geographicFocus')}</label>
                            <input type="text" value={geographicFocus} onChange={e => setGeographicFocus(e.target.value)} placeholder={t('institutional_donors.modal.geographicFocusHint')} className="w-full p-2 mt-1 border rounded-md bg-gray-50 dark:bg-slate-800 dark:border-slate-700"/>
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium">{t('institutional_donors.filter_labels.priorityLevel')}</label>
                                <select value={priority} onChange={e => setPriority(e.target.value as PriorityLevel)} className="w-full p-2 mt-1 border rounded-md bg-gray-50 dark:bg-slate-800 dark:border-slate-700">
                                     {(['High', 'Medium', 'Low'] as PriorityLevel[]).map(p_ => <option key={p_} value={p_}>{t(`institutional_donors.priorities.${p_}`)}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium">{t('institutional_donors.filter_labels.relationshipStatus')}</label>
                                <select value={relationshipStatus} onChange={e => setRelationshipStatus(e.target.value as GrantmakerRelationshipStatus)} className="w-full p-2 mt-1 border rounded-md bg-gray-50 dark:bg-slate-800 dark:border-slate-700">
                                     {(['Cold', 'Prospect', 'Cultivating', 'Active', 'Stewardship'] as GrantmakerRelationshipStatus[]).map(s_ => <option key={s_} value={s_}>{t(`institutional_donors.statuses.${s_}`)}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className="px-6 py-4 bg-gray-50 dark:bg-dark-card/50 rounded-b-2xl flex justify-end gap-3">
                        <button type="button" onClick={onClose} disabled={isSubmitting} className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-slate-700 text-sm font-semibold disabled:opacity-50">{t('common.cancel')}</button>
                        <button type="submit" disabled={isSubmitting} className="px-4 py-2 rounded-lg bg-secondary text-white text-sm font-semibold hover:bg-secondary-dark disabled:opacity-50">
                            {isSubmitting ? t('common.saving') : t('institutional_donors.addInstitution')}
                        </button>
                    </div>
                </form>
            </div>
        </ModalPortal>
    );
};

export default AddInstitutionModal;
