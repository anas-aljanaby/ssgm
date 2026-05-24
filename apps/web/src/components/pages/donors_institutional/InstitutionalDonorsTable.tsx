import React from 'react';
import { useLocalization } from '../../../hooks/useLocalization';
import type { InstitutionalDonor, GrantmakerRelationshipStatus, PriorityLevel, SortDirection } from '../../../types';
import { formatDate, formatCurrency } from '../../../lib/utils';
import { ChevronDownIcon } from '../../icons/GenericIcons';
import { Eye, Trash2 } from 'lucide-react';
import { isOptimisticInstitution } from '../../../lib/institutionOptimistic';
import { formatInstitutionalCountry } from './countryDisplay';

interface InstitutionalDonorsTableProps {
    donors: InstitutionalDonor[];
    highlightedId?: string | null;
    onDonorSelect: (donor: InstitutionalDonor) => void;
    onDonorDelete?: (donor: InstitutionalDonor) => void;
    sortColumn: keyof InstitutionalDonor | null;
    sortDirection: SortDirection;
    onSort: (column: keyof InstitutionalDonor) => void;
}

const InstitutionalDonorsTable: React.FC<InstitutionalDonorsTableProps> = ({ donors, highlightedId = null, onDonorSelect, onDonorDelete, sortColumn, sortDirection, onSort }) => {
    const { t, language } = useLocalization(['common', 'institutional_donors']);

    const SortableHeader: React.FC<{ column: keyof InstitutionalDonor, labelKey: string, className?: string }> = ({ column, labelKey, className }) => (
        <th scope="col" className={`px-4 py-3 ${className}`}>
            <div className="flex items-center gap-1 cursor-pointer" onClick={() => onSort(column)}>
                {t(labelKey)}
                {sortColumn === column && (
                    <ChevronDownIcon className={`w-4 h-4 transition-transform ${sortDirection === 'asc' ? 'transform rotate-180' : ''}`} />
                )}
            </div>
        </th>
    );

    const StatusBadge: React.FC<{ status: GrantmakerRelationshipStatus }> = ({ status }) => {
        const styles = {
            'Cold': 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
            'Prospect': 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
            'Cultivating': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
            'Active': 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
            'Stewardship': 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
        };
        return <span className={`px-2 py-1 text-xs font-semibold rounded-full ${styles[status]}`}>{t(`institutional_donors.statuses.${status}`)}</span>;
    };
    
    const PriorityBadge: React.FC<{ priority: PriorityLevel }> = ({ priority }) => {
        const styles = { 'High': 'bg-red-500', 'Medium': 'bg-yellow-500', 'Low': 'bg-green-500' };
        return (
            <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${styles[priority]}`}></span>
                <span>{t(`institutional_donors.priorities.${priority}`)}</span>
            </div>
        );
    };

    return (
        <div className="bg-card dark:bg-dark-card rounded-2xl shadow-soft overflow-hidden border border-gray-200 dark:border-slate-700/50">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-start text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-dark-card/50 dark:text-gray-400">
                        <tr>
                            <SortableHeader column="organizationName" labelKey="institutional_donors.columns.institution" className="w-1/4" />
                            <SortableHeader column="createdDate" labelKey="institutional_donors.columns.createdDate" />
                            <SortableHeader column="totalGrantsAwarded" labelKey="institutional_donors.columns.funding" />
                            <SortableHeader column="nextDeadline" labelKey="institutional_donors.columns.deadlines" />
                            <SortableHeader column="relationshipStatus" labelKey="institutional_donors.columns.status" />
                            <SortableHeader column="focusAreas" labelKey="institutional_donors.columns.focus" />
                            <SortableHeader column="priority" labelKey="institutional_donors.columns.priority" />
                            <th scope="col" className="px-4 py-3 text-end">{t('institutional_donors.columns.actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {donors.map(donor => {
                            const optimistic = isOptimisticInstitution(donor.id);
                            const highlighted = highlightedId === donor.id;
                            return (
                            <tr
                                key={donor.id}
                                className={`bg-card dark:bg-dark-card border-b dark:border-slate-700 hover:bg-gray-50/50 dark:hover:bg-slate-800/20 ${
                                    optimistic
                                        ? 'opacity-70 animate-pulse bg-blue-50/60 dark:bg-blue-950/30'
                                        : highlighted
                                          ? 'bg-emerald-50 dark:bg-emerald-950/40 ring-1 ring-inset ring-emerald-200/80 dark:ring-emerald-800/60'
                                          : ''
                                }`}
                            >
                                <td className="px-4 py-4">
                                    <div className="flex items-center gap-3">
                                        <img className="w-10 h-10 rounded-lg object-cover bg-gray-100" src={donor.logo} alt={`${donor.organizationName.en} logo`} loading="lazy" />
                                        <div>
                                            <button onClick={() => onDonorSelect(donor)} className="font-bold text-foreground dark:text-dark-foreground hover:underline text-start">{donor.organizationName[language]}</button>
                                            <div className="text-xs text-gray-500">
                                                {optimistic ? t('common.saving') : `${t(`institutional_donors.types.${donor.type}`)} • ${formatInstitutionalCountry(donor.country, t)}`}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-4">
                                    {formatDate(donor.createdDate, language)}
                                </td>
                                <td className="px-4 py-4">
                                    <div className="font-semibold">{formatCurrency(donor.totalGrantsAwarded, language)}</div>
                                    <div className="text-xs text-gray-500">{t('institutional_donors.active', { count: donor.activeGrants })}</div>
                                </td>
                                <td className="px-4 py-4">
                                    <div className="font-semibold">{donor.nextDeadline ? formatDate(donor.nextDeadline, language) : t('common.notAvailable')}</div>
                                    <div className="text-xs text-gray-500">{t('institutional_donors.nextDeadline')}</div>
                                </td>
                                <td className="px-4 py-4"><StatusBadge status={donor.relationshipStatus} /></td>
                                <td className="px-4 py-4 max-w-xs">
                                    <div className="flex flex-wrap gap-1">
                                        {donor.focusAreas.slice(0, 2).map(tag => <span key={tag} className="px-2 py-0.5 text-xs bg-gray-200 dark:bg-slate-700 rounded-full truncate">{tag}</span>)}
                                        {donor.focusAreas.length > 2 && <span className="text-xs text-gray-400">+{donor.focusAreas.length - 2}</span>}
                                    </div>
                                </td>
                                <td className="px-4 py-4"><PriorityBadge priority={donor.priority} /></td>
                                <td className="px-4 py-4 text-end">
                                    {optimistic ? (
                                        <span className="text-xs text-gray-400">—</span>
                                    ) : (
                                        <div className="flex items-center justify-end gap-1">
                                            <button
                                                type="button"
                                                onClick={() => onDonorSelect(donor)}
                                                className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-300"
                                                title={t('institutional_donors.card.viewProfile')}
                                                aria-label={t('institutional_donors.card.viewProfile')}
                                            >
                                                <Eye size={16} />
                                            </button>
                                            {onDonorDelete && (
                                                <button
                                                    type="button"
                                                    onClick={() => onDonorDelete(donor)}
                                                    className="p-2 rounded-full hover:bg-red-100 text-red-600 dark:hover:bg-red-900/30"
                                                    title={t('institutional_donors.deleteInstitution')}
                                                    aria-label={t('institutional_donors.deleteInstitution')}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </td>
                            </tr>
                        );
                        })}
                    </tbody>
                </table>
                 {donors.length === 0 && <div className="text-center py-16 text-gray-500">{t('institutional_donors.noResults')}</div>}
            </div>
        </div>
    );
};

export default InstitutionalDonorsTable;
