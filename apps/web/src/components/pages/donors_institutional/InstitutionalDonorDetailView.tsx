import React, { useState } from 'react';
import type { InstitutionalDonor } from '../../../types';
import { useLocalization } from '../../../hooks/useLocalization';
import Tabs from '../../common/Tabs';
import DetailOverviewTabInstitutional from './DetailOverviewTabInstitutional';
import { ArrowLeft, CalendarClock, Mail, MapPin, WalletCards } from 'lucide-react';
import GrantsTab from './GrantsTab';
import ContactsTab from './ContactsTab';
import DocumentsTab from './DocumentsTab';
import { formatCurrency, formatDate, formatRelativeTime } from '../../../lib/utils';
import { formatInstitutionalLocation } from './countryDisplay';

interface InstitutionalDonorDetailViewProps {
    donor: InstitutionalDonor;
    onBack: () => void;
    onDonorUpdated?: (donor: InstitutionalDonor) => void;
    existingCountries?: string[];
}

const InstitutionalDonorDetailView: React.FC<InstitutionalDonorDetailViewProps> = ({ donor, onBack, onDonorUpdated, existingCountries = [] }) => {
    const { t, language } = useLocalization(['common', 'institutional_donors']);
    const [activeTab, setActiveTab] = useState('overview');

    const tabs = [
        { id: 'overview', label: t('institutional_donors.detail.overview') },
        { id: 'grants', label: t('institutional_donors.detail.grants') },
        { id: 'contacts', label: t('institutional_donors.detail.contacts') },
        { id: 'documents', label: t('institutional_donors.detail.documents') },
    ];

    const renderTabContent = () => {
        switch (activeTab) {
            case 'overview':
                return <DetailOverviewTabInstitutional donor={donor} onDonorUpdated={onDonorUpdated} existingCountries={existingCountries} />;
            case 'grants':
                return <GrantsTab donor={donor} />;
            case 'contacts':
                return <ContactsTab donor={donor} />;
            case 'documents':
                return <DocumentsTab donor={donor} />;
            default:
                return <div className="p-8 text-center text-gray-500">{t('placeholder.underConstruction')}</div>;
        }
    };

    return (
        <div className="animate-fade-in space-y-4 pb-24 md:pb-0">
            <button onClick={onBack} className="flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
                <ArrowLeft className="rtl:rotate-180" /> {t('institutional_donors.backToList')}
            </button>

            <section className="overflow-hidden rounded-2xl border border-gray-200 bg-card shadow-soft dark:border-slate-700/60 dark:bg-dark-card">
                <div className="grid grid-cols-1 gap-5 p-5 sm:p-6 xl:grid-cols-[minmax(0,1fr)_auto]">
                    <div className="flex min-w-0 items-center gap-4 sm:gap-5">
                        <img src={donor.logo} alt={donor.organizationName[language] || donor.organizationName.en} className="h-20 w-20 flex-shrink-0 rounded-2xl bg-gray-100 object-cover dark:bg-slate-800 sm:h-24 sm:w-24" />
                        <div className="min-w-0">
                            <h1 className="break-words text-2xl font-bold leading-tight text-foreground dark:text-dark-foreground sm:text-3xl">{donor.organizationName[language] || donor.organizationName.en}</h1>
                            <p className="mt-2 flex flex-wrap items-center gap-2 text-sm font-semibold text-gray-500 dark:text-gray-400">
                                <MapPin size={15} /> {t(`institutional_donors.types.${donor.type}`)} / {formatInstitutionalLocation(donor.city, donor.country, t) || t('common.notAvailable')}
                            </p>
                            <div className="mt-4 flex flex-wrap gap-2">
                                <span className="rounded-full bg-primary-light px-2.5 py-1 text-xs font-bold text-primary dark:bg-primary/20 dark:text-secondary">{t(`institutional_donors.statuses.${donor.relationshipStatus}`)}</span>
                                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 dark:bg-amber-900/25 dark:text-amber-200">{t(`institutional_donors.priorities.${donor.priority}`)}</span>
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:w-80 xl:grid-cols-1">
                        <a href={`mailto:${donor.primaryContact.email}`} className="inline-flex items-center justify-center gap-2 rounded-lg bg-secondary px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-secondary-dark">
                            <Mail size={16} /> {donor.primaryContact.name}
                        </a>
                        <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-bold text-foreground dark:border-slate-700 dark:bg-slate-900/30 dark:text-dark-foreground">
                            <span className="flex items-center justify-center gap-2"><WalletCards size={16} /> {formatCurrency(donor.totalGrantsAwarded, language, 'USD')}</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 border-t border-gray-200 bg-gray-50/70 p-4 dark:border-slate-700 dark:bg-slate-900/20 xl:grid-cols-4">
                    <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">{t('institutional_donors.detail.activeGrants')}</p>
                        <p className="mt-1 break-words text-sm font-bold text-foreground dark:text-dark-foreground">{donor.activeGrants}</p>
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">{t('institutional_donors.detail.nextDeadline')}</p>
                        <p className="mt-1 flex items-center gap-1 break-words text-sm font-bold text-foreground dark:text-dark-foreground"><CalendarClock size={14} /> {donor.nextDeadline ? formatDate(donor.nextDeadline, language) : t('common.notAvailable')}</p>
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">{t('institutional_donors.detail.lastContact')}</p>
                        <p className="mt-1 break-words text-sm font-bold text-foreground dark:text-dark-foreground">{donor.lastContactDate ? formatRelativeTime(donor.lastContactDate, language) : t('common.notAvailable')}</p>
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">{t('institutional_donors.columns.focus')}</p>
                        <p className="mt-1 break-words text-sm font-bold text-foreground dark:text-dark-foreground">{donor.focusAreas.slice(0, 2).join(', ')}{donor.focusAreas.length > 2 ? ` +${donor.focusAreas.length - 2}` : ''}</p>
                    </div>
                </div>
            </section>

            <section className="rounded-2xl border border-gray-200 bg-card shadow-sm dark:border-slate-700/60 dark:bg-dark-card">
                <div className="px-4 pt-2 sm:px-6">
                    <Tabs tabs={tabs} activeTab={activeTab} onTabClick={setActiveTab} />
                </div>
                <div className="rounded-b-2xl bg-gray-50/70 p-4 dark:bg-dark-background/30 sm:p-6">
                    {renderTabContent()}
                </div>
            </section>
        </div>
    );
};

export default InstitutionalDonorDetailView;
