import React from 'react';
import { List } from 'lucide-react';
import { SearchIcon } from '../../icons/GenericIcons';
import { HrIcon } from '../../icons/ModuleIcons';
import { useLocalization } from '../../../hooks/useLocalization';
import type { BeneficiaryType } from '../../../types';

interface BeneficiaryToolbarProps {
    view: 'table' | 'card';
    onViewChange: (view: 'table' | 'card') => void;
    searchTerm: string;
    onSearchChange: (term: string) => void;
    selectedType: BeneficiaryType | 'all';
    onTypeChange: (type: BeneficiaryType | 'all') => void;
    selectedStatus: string;
    onStatusChange: (status: string) => void;
    selectedCountry: string;
    onCountryChange: (country: string) => void;
    countries: string[];
    onAddBeneficiary: () => void;
}

const BeneficiaryToolbar: React.FC<BeneficiaryToolbarProps> = ({
    view, onViewChange, searchTerm, onSearchChange,
    selectedType, onTypeChange,
    selectedStatus, onStatusChange,
    selectedCountry, onCountryChange,
    countries, onAddBeneficiary,
}) => {
    const { t, dir } = useLocalization(['common', 'beneficiaries']);

    const beneficiaryTypes: Array<BeneficiaryType | 'all'> = ['all', 'student', 'orphan', 'hafiz', 'family', 'institution', 'community'];
    const statuses = ['all', 'active', 'inactive', 'graduated', 'suspended', 'on-hold'];

    const ViewButton: React.FC<{
        label: string;
        icon: React.ReactNode;
        isActive: boolean;
        onClick: () => void;
    }> = ({ label, icon, isActive, onClick }) => (
        <button
            onClick={onClick}
            title={label}
            className={`p-2 rounded-md transition-colors ${isActive ? 'bg-primary text-white' : 'hover:bg-gray-200 dark:hover:bg-slate-700'}`}
        >
            {icon}
        </button>
    );

    return (
        <div className="flex-shrink-0 p-4 bg-card dark:bg-dark-card rounded-xl shadow-soft border dark:border-slate-700/50">
            <div className="flex flex-col lg:flex-row gap-3">
                {/* Search */}
                <div className="relative flex-grow">
                    <div className={`absolute inset-y-0 flex items-center ${dir === 'ltr' ? 'ps-3' : 'pe-3'} pointer-events-none`}>
                        <SearchIcon />
                    </div>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={e => onSearchChange(e.target.value)}
                        placeholder={t('beneficiaries.searchPlaceholder')}
                        className={`block w-full p-2.5 ${dir === 'ltr' ? 'ps-10' : 'pe-10'} text-sm border border-gray-300 dark:border-slate-700 rounded-lg bg-gray-50 dark:bg-slate-800 focus:ring-primary focus:border-primary`}
                    />
                </div>

                {/* Filters row */}
                <div className="flex flex-wrap items-center gap-2">
                    {/* Type filter */}
                    <select
                        value={selectedType}
                        onChange={e => onTypeChange(e.target.value as BeneficiaryType | 'all')}
                        className="px-3 py-2.5 text-sm border border-gray-300 dark:border-slate-700 rounded-lg bg-gray-50 dark:bg-slate-800"
                    >
                        {beneficiaryTypes.map(type => (
                            <option key={type} value={type}>{t(`beneficiaries.types.${type}`)}</option>
                        ))}
                    </select>

                    {/* Status filter */}
                    <select
                        value={selectedStatus}
                        onChange={e => onStatusChange(e.target.value)}
                        className="px-3 py-2.5 text-sm border border-gray-300 dark:border-slate-700 rounded-lg bg-gray-50 dark:bg-slate-800"
                    >
                        {statuses.map(s => (
                            <option key={s} value={s}>{t(`beneficiaries.statuses.${s}`)}</option>
                        ))}
                    </select>

                    {/* Country filter */}
                    <select
                        value={selectedCountry}
                        onChange={e => onCountryChange(e.target.value)}
                        className="px-3 py-2.5 text-sm border border-gray-300 dark:border-slate-700 rounded-lg bg-gray-50 dark:bg-slate-800"
                    >
                        <option value="all">{t('beneficiaries.filters.allCountries')}</option>
                        {countries.map(c => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>

                    {/* View toggle */}
                    <div className="p-1 bg-gray-100 dark:bg-slate-900 rounded-lg flex items-center">
                        <ViewButton label={t('beneficiaries.views.table')} icon={<List size={18} />} isActive={view === 'table'} onClick={() => onViewChange('table')} />
                        <ViewButton label={t('beneficiaries.views.card')} icon={<HrIcon className="w-[18px] h-[18px]" />} isActive={view === 'card'} onClick={() => onViewChange('card')} />
                    </div>

                    {/* Add button */}
                    <button
                        onClick={onAddBeneficiary}
                        className="px-4 py-2 text-sm font-medium text-white bg-secondary hover:bg-secondary-dark rounded-lg transition-colors"
                    >
                        {t('beneficiaries.addBeneficiary')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BeneficiaryToolbar;
