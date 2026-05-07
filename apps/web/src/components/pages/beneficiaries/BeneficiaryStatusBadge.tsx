import React from 'react';
import type { BeneficiaryStatus } from '../../../types';
import { useLocalization } from '../../../hooks/useLocalization';

const statusStyles: Record<BeneficiaryStatus, string> = {
    active: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    inactive: 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-300',
    graduated: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
    suspended: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
    'on-hold': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
};

const BeneficiaryStatusBadge: React.FC<{ status: BeneficiaryStatus }> = ({ status }) => {
    const { t } = useLocalization(['beneficiaries']);

    return (
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${statusStyles[status] || statusStyles.active}`}>
            {t(`beneficiaries.statuses.${status}`)}
        </span>
    );
};

export default BeneficiaryStatusBadge;
