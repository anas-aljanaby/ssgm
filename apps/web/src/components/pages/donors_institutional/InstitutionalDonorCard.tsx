import React from 'react';
import { useLocalization } from '../../../hooks/useLocalization';
import type { InstitutionalDonor, GrantmakerRelationshipStatus, PriorityLevel } from '../../../types';
import { formatDate, formatCurrency } from '../../../lib/utils';
import { Clock, Tag, DollarSign, Package, MapPin, Eye, Trash2 } from 'lucide-react';
import { isOptimisticInstitution } from '../../../lib/institutionOptimistic';
import { formatInstitutionalCountry } from './countryDisplay';

interface InstitutionalDonorCardProps {
    donor: InstitutionalDonor;
    highlighted?: boolean;
    onSelect: (donor: InstitutionalDonor) => void;
    onDelete?: (donor: InstitutionalDonor) => void;
}

const InstitutionalDonorCard: React.FC<InstitutionalDonorCardProps> = ({ donor, highlighted = false, onSelect, onDelete }) => {
    const { t, language } = useLocalization(['common', 'institutional_donors']);
    const optimistic = isOptimisticInstitution(donor.id);

    const priorityClasses: Record<PriorityLevel, string> = {
        'High': 'border-red-500',
        'Medium': 'border-yellow-500',
        'Low': 'border-green-500',
    };
    
    const statusClasses: Record<GrantmakerRelationshipStatus, string> = {
        'Cold': 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
        'Prospect': 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
        'Cultivating': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
        'Active': 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
        'Stewardship': 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
    };

    return (
        <div 
            onClick={() => !optimistic && onSelect(donor)}
            className={`bg-card dark:bg-dark-card rounded-xl shadow-soft transition-all duration-300 border-s-4 ${priorityClasses[donor.priority]} flex flex-col ${
                optimistic
                    ? 'opacity-70 animate-pulse cursor-default'
                    : 'cursor-pointer hover:shadow-lg hover:-translate-y-1'
            } ${highlighted ? 'ring-2 ring-emerald-300 dark:ring-emerald-700' : ''}`}
        >
            <div className="p-4 flex-grow">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <img src={donor.logo} alt={`${donor.organizationName[language] || donor.organizationName.en} logo`} className="w-12 h-12 rounded-lg object-cover bg-gray-100" />
                        <div>
                            <h3 className="font-bold text-lg text-foreground dark:text-dark-foreground">{donor.organizationName[language] || donor.organizationName.en}</h3>
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                                <MapPin size={12}/> {optimistic ? t('common.saving') : `${t(`institutional_donors.types.${donor.type}`)} • ${formatInstitutionalCountry(donor.country, t)}`}
                            </p>
                        </div>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusClasses[donor.relationshipStatus]}`}>
                        {t(`institutional_donors.statuses.${donor.relationshipStatus}`)}
                    </span>
                </div>

                <div className="mt-4">
                    <h4 className="text-xs font-semibold text-gray-400 mb-2 flex items-center gap-1"><Tag size={14} /> {t('institutional_donors.columns.focus')}</h4>
                    <div className="flex flex-wrap gap-1">
                        {donor.focusAreas.slice(0, 3).map(area => (
                            <span key={area} className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-slate-700 rounded-full">{area}</span>
                        ))}
                        {donor.focusAreas.length > 3 && <span className="text-xs text-gray-400">+{donor.focusAreas.length - 3}</span>}
                    </div>
                </div>

                <div className="mt-4 pt-4 border-t dark:border-slate-700 grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-start gap-2">
                        <DollarSign size={16} className="text-primary mt-1"/>
                        <div>
                            <p className="text-xs text-gray-500">{t('institutional_donors.columns.funding')}</p>
                            <p className="font-semibold">{formatCurrency(donor.totalGrantsAwarded, language)}</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-2">
                        <Package size={16} className="text-primary mt-1"/>
                        <div>
                            <p className="text-xs text-gray-500">{t('institutional_donors.detail.activeGrants')}</p>
                            <p className="font-semibold">{donor.activeGrants}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-dark-card/50 rounded-b-xl border-t dark:border-slate-700 flex items-center justify-between gap-2">
                 <div className="flex items-center gap-2 text-sm flex-1 min-w-0">
                    <Clock size={16} className="text-primary flex-shrink-0"/>
                    <div className="min-w-0">
                        <p className="text-xs text-gray-500">{t('institutional_donors.nextDeadline')}</p>
                        <p className="font-semibold truncate">{donor.nextDeadline ? formatDate(donor.nextDeadline, language, 'medium') : t('common.notAvailable')}</p>
                    </div>
                </div>
                {!optimistic && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onSelect(donor); }}
                            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700"
                            title={t('institutional_donors.card.viewProfile')}
                            aria-label={t('institutional_donors.card.viewProfile')}
                        >
                            <Eye size={16} />
                        </button>
                        {onDelete && (
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); onDelete(donor); }}
                                className="p-2 rounded-full hover:bg-red-100 text-red-600 dark:hover:bg-red-900/30"
                                title={t('institutional_donors.deleteInstitution')}
                                aria-label={t('institutional_donors.deleteInstitution')}
                            >
                                <Trash2 size={16} />
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default InstitutionalDonorCard;
