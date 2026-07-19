
import React, { useState, useEffect, useMemo } from 'react';
import type { IndividualDonor, DonorCategory, Language } from '../../../types';
import { useLocalization } from '../../../hooks/useLocalization';
import { formatNumber } from '../../../lib/utils';
import { langToFlag } from '../../icons/FlagIcons';

interface TargetSelectionPanelProps {
    allDonors: IndividualDonor[];
    onTargetsUpdate: (donors: IndividualDonor[]) => void;
    languageSelection: 'auto' | Language;
    /** When set, overrides filter selection (e.g. Outreach queue picks). */
    externalTargets?: IndividualDonor[];
}

const TargetSelectionPanel: React.FC<TargetSelectionPanelProps> = ({ allDonors, onTargetsUpdate, languageSelection, externalTargets }) => {
    const { t, language } = useLocalization(['smart_messaging', 'common']);
    const [filterType, setFilterType] = useState('allActive');
    const [selectedCategory, setSelectedCategory] = useState<DonorCategory>('Hero Donor');
    const [selectedQuickFilter, setSelectedQuickFilter] = useState('recent');

    const filteredDonors = useMemo(() => {
        switch (filterType) {
            case 'allActive':
                return allDonors.filter(d => d.status === 'Active');
            case 'specificCategory':
                return allDonors.filter(d => d.donorCategory === selectedCategory);
            case 'quickFilters':
                const now = new Date();
                switch (selectedQuickFilter) {
                    case 'recent':
                        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                        return allDonors.filter(d => d.lastDonationDate && new Date(d.lastDonationDate) > sevenDaysAgo);
                    case 'ready':
                        return allDonors.filter(d => d.best_contact_day_of_month === now.getDate());
                     case 'high_engagement':
                        return allDonors.filter(d => d.donorCategory === 'Hero Donor' && (d.engagement_score || 0) > 70);
                    case 'dormant':
                         const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                         return allDonors.filter(d => d.lastDonationDate && new Date(d.lastDonationDate) < ninetyDaysAgo);
                    default:
                        return [];
                }
            default:
                return [];
        }
    }, [filterType, allDonors, selectedCategory, selectedQuickFilter]);

    useEffect(() => {
        if (externalTargets && externalTargets.length > 0) {
            onTargetsUpdate(externalTargets);
            return;
        }
        onTargetsUpdate(filteredDonors);
    }, [filteredDonors, onTargetsUpdate, externalTargets]);

    const languageBreakdown = useMemo(() => {
        const breakdown: Record<string, number> = { ar: 0, en: 0 };
        filteredDonors.forEach(donor => {
            const lang = donor.preferred_language || 'en';
            breakdown[lang] = (breakdown[lang] || 0) + 1;
        });
        return breakdown;
    }, [filteredDonors]);

    const donorCategories: DonorCategory[] = ['Hero Donor', 'Recurring Donor', 'Seasonal Donor', 'Event Donor', 'Dormant Donor'];

    const quickFilters = [
        { id: 'recent', label: t('smart_messaging.targets.quick_filters.recent') },
        { id: 'ready', label: t('smart_messaging.targets.quick_filters.ready') },
        { id: 'high_engagement', label: t('smart_messaging.targets.quick_filters.high_engagement') },
        { id: 'dormant', label: t('smart_messaging.targets.quick_filters.dormant') },
    ];
    
    return (
        <div className="bg-card dark:bg-dark-card rounded-2xl shadow-soft border dark:border-slate-700/50">
            <h3 className="text-lg font-bold p-4 border-b dark:border-slate-700">{t('smart_messaging.targets.title')}</h3>
            <div className="p-4 space-y-4">
                <div className="space-y-2">
                    {['allActive', 'specificCategory', 'quickFilters', 'customFilter'].map(type => (
                        <div key={type} className="flex items-center">
                            <input
                                type="radio"
                                id={type}
                                name="filterType"
                                value={type}
                                checked={filterType === type}
                                onChange={e => setFilterType(e.target.value)}
                                className="w-4 h-4 text-primary focus:ring-primary"
                                disabled={type === 'customFilter'}
                            />
                            <label htmlFor={type} className="ms-2 text-sm font-medium">{t(`smart_messaging.targets.${type}`)}</label>
                        </div>
                    ))}
                </div>

                {filterType === 'specificCategory' && (
                    <div className="ps-6 animate-fade-in-fast">
                        <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value as DonorCategory)} className="w-full p-2 text-sm border rounded-lg bg-gray-50 dark:bg-slate-800 dark:border-slate-700">
                           {donorCategories.map(cat => <option key={cat} value={cat}>{t(`donorIntelligence.categories.${cat.replace(/ /g, '')}`)}</option>)}
                        </select>
                    </div>
                )}
                 {filterType === 'quickFilters' && (
                    <div className="ps-6 animate-fade-in-fast">
                        <select value={selectedQuickFilter} onChange={e => setSelectedQuickFilter(e.target.value)} className="w-full p-2 text-sm border rounded-lg bg-gray-50 dark:bg-slate-800 dark:border-slate-700">
                           {quickFilters.map(qf => <option key={qf.id} value={qf.id}>{qf.label}</option>)}
                        </select>
                    </div>
                )}
            </div>
             <div className="p-4 border-t dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 rounded-b-xl">
                 <h4 className="font-semibold text-sm">{t('smart_messaging.targets.preview')}</h4>
                 <p className="font-bold text-lg text-primary dark:text-secondary">{t('smart_messaging.targets.donorsSelected', { count: formatNumber(filteredDonors.length, language) })}</p>
                 
                 <div className="text-xs text-gray-500 mt-1">
                    <p className="font-semibold">📊 {languageSelection === 'auto' ? t('smart_messaging.targets.breakdown_auto') : t('smart_messaging.targets.breakdown_specific')}</p>
                    {languageSelection === 'auto' ? (
                        <div className="flex gap-x-3 gap-y-1 flex-wrap">
                            {Object.entries(languageBreakdown).map(([lang, count]) => {
                                if (count === 0) return null;
                                const Flag = langToFlag[lang as Language];
                                return <span key={lang} className="flex items-center gap-1"><Flag /> {lang.toUpperCase()}: {count}</span>;
                            })}
                        </div>
                    ) : (
                        <p>
                            {(() => {
                                const Flag = langToFlag[languageSelection as Language];
                                const langName = t(`smart_messaging.config.lang_${languageSelection}`);
                                return <span className="flex items-center gap-1"><Flag /> {t('smart_messaging.targets.breakdown_specific_lang', { count: filteredDonors.length, language: langName })}</span>;
                            })()}
                        </p>
                    )}
                 </div>
             </div>
        </div>
    );
};

export default TargetSelectionPanel;
