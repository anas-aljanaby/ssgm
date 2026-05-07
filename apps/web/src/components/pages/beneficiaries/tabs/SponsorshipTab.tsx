import React from 'react';
import type { Beneficiary, SponsorshipInfo } from '../../../../types';
import { useLocalization } from '../../../../hooks/useLocalization';
import { formatCurrency } from '../../../../lib/utils';

const SponsorshipTab: React.FC<{ beneficiary: Beneficiary }> = ({ beneficiary }) => {
    const { t, language } = useLocalization(['beneficiaries']);
    const p = beneficiary.profile;

    let sponsorship: SponsorshipInfo | undefined;
    if (p.type === 'student' || p.type === 'orphan' || p.type === 'hafiz') {
        sponsorship = p.sponsorship;
    }

    if (!sponsorship) {
        return (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                {t('beneficiaries.noSponsorshipData')}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h3 className="font-bold text-lg text-foreground dark:text-dark-foreground">{t('beneficiaries.tabs.sponsorship')}</h3>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('beneficiaries.fields.supportType')}</dt>
                    <dd className="mt-1 text-sm font-semibold text-foreground dark:text-dark-foreground">
                        {t(`beneficiaries.supportTypes.${beneficiary.supportType}`)}
                    </dd>
                </div>
                {sponsorship.startDate && (
                    <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('beneficiaries.fields.startDate')}</dt>
                        <dd className="mt-1 text-sm font-semibold text-foreground dark:text-dark-foreground">
                            {new Date(sponsorship.startDate).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </dd>
                    </div>
                )}
                {sponsorship.monthlyAmount !== undefined && (
                    <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('beneficiaries.fields.monthlyAmount')}</dt>
                        <dd className="mt-1 text-sm font-semibold text-foreground dark:text-dark-foreground">
                            {formatCurrency(sponsorship.monthlyAmount, language)} {sponsorship.currency && `(${sponsorship.currency})`}
                        </dd>
                    </div>
                )}
                {sponsorship.donorId && (
                    <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('beneficiaries.fields.donorId')}</dt>
                        <dd className="mt-1 text-sm font-semibold text-foreground dark:text-dark-foreground">{String(sponsorship.donorId)}</dd>
                    </div>
                )}
            </dl>
        </div>
    );
};

export default SponsorshipTab;
