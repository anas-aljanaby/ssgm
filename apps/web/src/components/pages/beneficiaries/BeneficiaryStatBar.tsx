import React from 'react';
import { Users, UserCheck, Home, Building } from 'lucide-react';
import { useLocalization } from '../../../hooks/useLocalization';
import { formatNumber } from '../../../lib/utils';
import type { Beneficiary } from '../../../types';

interface BeneficiaryStatBarProps {
    beneficiaries: Beneficiary[];
}

const BeneficiaryStatBar: React.FC<BeneficiaryStatBarProps> = ({ beneficiaries }) => {
    const { t, language } = useLocalization(['beneficiaries']);

    const total = beneficiaries.length;
    const active = beneficiaries.filter(b => b.status === 'active').length;
    const individuals = beneficiaries.filter(b => ['student', 'orphan', 'hafiz'].includes(b.beneficiaryType)).length;
    const groups = beneficiaries.filter(b => ['family', 'institution', 'community'].includes(b.beneficiaryType)).length;

    const stats = [
        { label: t('beneficiaries.stats.total'), value: formatNumber(total, language), icon: <Users className="w-5 h-5" /> },
        { label: t('beneficiaries.stats.active'), value: formatNumber(active, language), icon: <UserCheck className="w-5 h-5" /> },
        { label: t('beneficiaries.stats.individuals'), value: formatNumber(individuals, language), icon: <Home className="w-5 h-5" /> },
        { label: t('beneficiaries.stats.groups'), value: formatNumber(groups, language), icon: <Building className="w-5 h-5" /> },
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat, i) => (
                <div key={i} className="bg-card dark:bg-dark-card p-4 rounded-xl shadow-soft border dark:border-slate-700/50 flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-primary-light dark:bg-primary/20 text-primary dark:text-secondary">
                        {stat.icon}
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.label}</p>
                        <p className="text-2xl font-bold text-foreground dark:text-dark-foreground">{stat.value}</p>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default BeneficiaryStatBar;
