
import React from 'react';
import type { GrantmakerRelationshipStatus, InstitutionType, PriorityLevel } from '../../../types';
import { useLocalization } from '../../../hooks/useLocalization';

export type InstitutionalFilterType = InstitutionType | 'all';
export type InstitutionalFilterStatus = GrantmakerRelationshipStatus | 'all';
export type InstitutionalFilterPriority = PriorityLevel | 'all';

export interface InstitutionalDonorFilters {
    institutionType: InstitutionalFilterType;
    relationshipStatus: InstitutionalFilterStatus;
    grantFocusArea: string;
    priority: InstitutionalFilterPriority;
}

export const DEFAULT_INSTITUTIONAL_DONOR_FILTERS: InstitutionalDonorFilters = {
    institutionType: 'all',
    relationshipStatus: 'all',
    grantFocusArea: '',
    priority: 'all',
};

interface AdvancedFilterPanelInstitutionalProps {
    isOpen: boolean;
    filters: InstitutionalDonorFilters;
    onFiltersChange: (filters: InstitutionalDonorFilters) => void;
    onApply: () => void;
    onClear: () => void;
}

const INSTITUTION_TYPES: InstitutionType[] = ['Foundation', 'Corporate', 'Government', 'Multilateral'];
const RELATIONSHIP_STATUSES: GrantmakerRelationshipStatus[] = ['Cold', 'Prospect', 'Cultivating', 'Active', 'Stewardship'];
const PRIORITY_LEVELS: PriorityLevel[] = ['High', 'Medium', 'Low'];

const AdvancedFilterPanelInstitutional: React.FC<AdvancedFilterPanelInstitutionalProps> = ({
    isOpen,
    filters,
    onFiltersChange,
    onApply,
    onClear,
}) => {
    const { t } = useLocalization(['common', 'institutional_donors']);

    const update = (patch: Partial<InstitutionalDonorFilters>) => {
        onFiltersChange({ ...filters, ...patch });
    };

    return (
        <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-96' : 'max-h-0'}`}>
            <div className="p-4 mb-4 bg-gray-50 dark:bg-dark-card/50 rounded-xl border dark:border-slate-700">
                <h3 className="font-semibold mb-4">{t('institutional_donors.filters')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label className="text-sm">{t('institutional_donors.filter_labels.institutionType')}</label>
                        <select
                            value={filters.institutionType}
                            onChange={(e) => update({ institutionType: e.target.value as InstitutionalFilterType })}
                            className="w-full p-2 mt-1 border rounded-md bg-white dark:bg-slate-800 dark:border-slate-600"
                        >
                            <option value="all">{t('institutional_donors.filterAll')}</option>
                            {INSTITUTION_TYPES.map((type) => (
                                <option key={type} value={type}>{t(`institutional_donors.types.${type}`)}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-sm">{t('institutional_donors.filter_labels.relationshipStatus')}</label>
                        <select
                            value={filters.relationshipStatus}
                            onChange={(e) => update({ relationshipStatus: e.target.value as InstitutionalFilterStatus })}
                            className="w-full p-2 mt-1 border rounded-md bg-white dark:bg-slate-800 dark:border-slate-600"
                        >
                            <option value="all">{t('institutional_donors.filterAll')}</option>
                            {RELATIONSHIP_STATUSES.map((status) => (
                                <option key={status} value={status}>{t(`institutional_donors.statuses.${status}`)}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-sm">{t('institutional_donors.filter_labels.grantFocusArea')}</label>
                        <input
                            type="text"
                            value={filters.grantFocusArea}
                            onChange={(e) => update({ grantFocusArea: e.target.value })}
                            placeholder={t('institutional_donors.filterFocusPlaceholder')}
                            className="w-full p-2 mt-1 border rounded-md bg-white dark:bg-slate-800 dark:border-slate-600"
                        />
                    </div>
                    <div>
                        <label className="text-sm">{t('institutional_donors.filter_labels.priorityLevel')}</label>
                        <select
                            value={filters.priority}
                            onChange={(e) => update({ priority: e.target.value as InstitutionalFilterPriority })}
                            className="w-full p-2 mt-1 border rounded-md bg-white dark:bg-slate-800 dark:border-slate-600"
                        >
                            <option value="all">{t('institutional_donors.filterAll')}</option>
                            {PRIORITY_LEVELS.map((priority) => (
                                <option key={priority} value={priority}>{t(`institutional_donors.priorities.${priority}`)}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                    <button
                        type="button"
                        onClick={onClear}
                        className="px-4 py-2 text-sm font-medium border rounded-lg dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-700"
                    >
                        {t('institutional_donors.clearFilters')}
                    </button>
                    <button
                        type="button"
                        onClick={onApply}
                        className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark"
                    >
                        {t('institutional_donors.applyFilters')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdvancedFilterPanelInstitutional;
